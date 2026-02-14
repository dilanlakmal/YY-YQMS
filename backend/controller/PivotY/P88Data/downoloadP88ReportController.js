import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { execSync } from "child_process";
import { exec } from "child_process";
import { p88LegacyData } from "../../MongoDB/dbConnectionController.js";
import { Builder, Browser, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import archiver from "archiver";
import { Buffer } from "buffer";
import { logFailedReport } from "./p88failedReportController.js";

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const activeJobs = new Map();

const baseTempDir =
  process.platform === "win32"
    ? path.join(process.env.TEMP || "C:/temp", "p88-bulk-temp")
    : "/tmp/p88-bulk-temp";

if (!fs.existsSync(baseTempDir)) fs.mkdirSync(baseTempDir, { recursive: true });

const CONFIG = {
  LOGIN_URL: "https://yw.pivot88.com/login",
  BASE_REPORT_URL: "https://yw.pivot88.com/inspectionreport/show/",
  DEFAULT_DOWNLOAD_DIR:
    process.platform === "win32" ? "P:/P88Test" : "/tmp/p88-reports",
  HEADLESS: "new"
};

// Enhanced waitForNewFile function with better error handling
async function waitForNewFile(dir, existingFiles, timeout = 90000) {
  // Increased timeout
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (fs.existsSync(dir)) {
      const currentFiles = fs.readdirSync(dir);

      // Find files that are PDFs and were NOT in the initial list
      const newPdfs = currentFiles.filter(
        (f) =>
          f.endsWith(".pdf") &&
          !existingFiles.includes(f) &&
          !f.endsWith(".crdownload") &&
          !f.endsWith(".tmp") &&
          !f.endsWith(".part")
      );

      // Check if there are any active downloads still happening
      const isDownloading = currentFiles.some(
        (f) =>
          f.endsWith(".crdownload") || f.endsWith(".tmp") || f.endsWith(".part")
      );

      if (newPdfs.length > 0 && !isDownloading) {
        // Double check file size to ensure it's not a 0-byte placeholder
        const filePath = path.join(dir, newPdfs[0]);
        const fileSize = fs.statSync(filePath).size;

        if (fileSize > 1000) {
          return newPdfs;
        }
      }
    }

    await new Promise((r) => setTimeout(r, 2000)); // Poll every 2 seconds
  }
  throw new Error(
    "Download timeout: No new PDF file detected within 90 seconds."
  );
}

// Helper functions (keep existing ones)
const getFileSize = async (filePath) => {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (
    parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) +
    " " +
    ["Bytes", "KB", "MB", "GB"][i]
  );
};

const getAvailableSpace = async (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    let availableBytes = 0;

    if (process.platform === "win32") {
      try {
        const drive = path.parse(path.resolve(dirPath)).root;
        const output = execSync(`dir /-c "${drive}"`, { encoding: "utf8" });
        const lines = output.split("\n");
        const lastLine = lines[lines.length - 2] || lines[lines.length - 1];
        const match = lastLine.match(/(\d+)\s+bytes\s+free/i);
        if (match) {
          availableBytes = parseInt(match[1]);
        }
      } catch (error) {
        console.warn("Could not get disk space on Windows:", error.message);
        availableBytes = 1024 * 1024 * 1024 * 5;
      }
    } else {
      try {
        const output = execSync(`df -k "${dirPath}"`, { encoding: "utf8" });
        const lines = output.split("\n");
        const dataLine = lines[1];
        const columns = dataLine.split(/\s+/);
        availableBytes = parseInt(columns[3]) * 1024;
      } catch (error) {
        console.warn("Could not get disk space on Unix:", error.message);
        availableBytes = 1024 * 1024 * 1024 * 5;
      }
    }

    return availableBytes;
  } catch (error) {
    console.warn("Error getting available space:", error.message);
    return 1024 * 1024 * 1024 * 5;
  }
};

export const downloadBulkReportsUbuntu = async (req, res) => {
  const { jobId, userId } = req.body;

  // 1. Initialize the job in the activeJobs map
  activeJobs.set(jobId, {
    status: "running",
    startTime: new Date(),
    cancelled: false,
    progress: { processed: 0, total: 0, success: 0, failed: 0 },
    jobDir: null,
    driver: null // Store Selenium driver here so we can quit it on cancel
  });

  // 2. Start the background worker (Selenium version)
  runDownloadTaskUbuntu(jobId, req.body, userId);

  // 3. Return 202 immediately to the frontend
  res.status(202).json({
    success: true,
    message: "Download job started on Ubuntu server",
    jobId
  });
};

const runDownloadTaskUbuntu = async (jobId, params, userId) => {
  const jobInfo = activeJobs.get(jobId);
  let driver = null;
  let jobDir = null;

  try {
    const {
      startRange,
      endRange,
      downloadAll,
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      language = "english",
      includeDownloaded = false
    } = params;

    // Setup Directory
    jobDir = path.join(baseTempDir, `selenium_${jobId}_${Date.now()}`);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
    jobInfo.jobDir = jobDir;

    const records = await getInspectionRecords(
      startRange,
      endRange,
      downloadAll,
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      includeDownloaded
    );

    if (records.length === 0) {
      jobInfo.status = "completed";
      jobInfo.results = { total: 0, message: "No records matching criteria" };
      return;
    }

    jobInfo.progress.total = records.length;

    // Selenium Setup
    const options = new chrome.Options();
    options.addArguments(
      "--headless",
      "--no-sandbox",
      "--disable-dev-shm-usage"
    );
    options.setUserPreferences({ "download.default_directory": jobDir });

    driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build();
    jobInfo.driver = driver;

    await driver.sendAndGetDevToolsCommand("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: jobDir
    });

    // Login
    await driver.get(CONFIG.LOGIN_URL);
    await driver
      .findElement(By.id("username"))
      .sendKeys(process.env.P88_USERNAME);
    await driver
      .findElement(By.id("password"))
      .sendKeys(process.env.P88_PASSWORD);
    await driver.findElement(By.id("js-login-submit")).click();
    await driver.wait(until.urlContains("dashboard"), 20000);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let failedReports = [];

    for (const record of records) {
      // Check for cancellation
      if (jobInfo.cancelled) break;

      const inspNo =
        record.inspectionNumbers?.[0] ||
        record.inspectionNumbersKey?.split("-")[0];
      if (!inspNo) {
        processedCount++;
        continue;
      }

      try {
        await updateDownloadStatus(record._id, "In Progress");
        const filesBefore = fs.readdirSync(jobDir);

        await driver.get(`${CONFIG.BASE_REPORT_URL}${inspNo}`);

        const printBtn = await driver.wait(
          until.elementLocated(By.css("#page-wrapper a")),
          15000
        );
        await printBtn.click();

        const newFiles = await waitForNewFile(jobDir, filesBefore);
        const baseName = getFilename(record, inspNo);

        newFiles.forEach((file, index) => {
          const oldPath = path.join(jobDir, file);
          const newName = `${baseName}-${language}${
            newFiles.length > 1 ? `_${index + 1}` : ""
          }.pdf`;
          fs.renameSync(oldPath, path.join(jobDir, newName));
        });

        await updateDownloadStatus(record._id, "Downloaded");
        successCount++;
      } catch (err) {
        failedCount++;
        failedReports.push({ inspectionNumber: inspNo, error: err.message });
        await updateDownloadStatus(record._id, "Failed");

        // FIX: Pass individual arguments in the correct order
        if (typeof logFailedReport === "function") {
          await logFailedReport(
            record._id, // legacyId
            inspNo, // inspNo
            record.groupNumber, // groupId
            err.message, // reason
            userId // empId
          );
        }
      }

      processedCount++;
      jobInfo.progress = {
        processed: processedCount,
        total: records.length,
        success: successCount,
        failed: failedCount
      };
    }

    await driver.quit();
    jobInfo.driver = null;

    // Generate ZIP
    const zipName = `Reports_${jobId}.zip`;
    const zipPath = path.join(baseTempDir, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    const streamFinished = new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
    });

    archive.pipe(output);
    archive.directory(jobDir, false);
    await archive.finalize();
    await streamFinished;

    jobInfo.zipPath = zipPath;
    jobInfo.status = "completed";
    jobInfo.results = {
      total: processedCount,
      successful: successCount,
      failed: failedCount,
      failedReports,
      completedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Ubuntu Worker Error:", error);
    jobInfo.status = "failed";
    jobInfo.error = error.message;
    if (driver) await driver.quit();
  }
};

export const downloadBulkReportsAutoCancellable = async (req, res) => {
  process.platform === "linux"
    ? await downloadBulkReportsUbuntu(req, res)
    : await downloadBulkReportsCancellable(req, res);
};

export const initializeDownloadStatus = async (req, res) => {
  try {
    // Count records without downloadStatus
    const recordsWithoutStatus = await p88LegacyData.countDocuments({
      downloadStatus: { $exists: false }
    });

    if (recordsWithoutStatus === 0) {
      return res.json({
        success: true,
        message: "All records already have download status initialized",
        recordsUpdated: 0
      });
    }

    // Update records without downloadStatus
    const result = await p88LegacyData.updateMany(
      { downloadStatus: { $exists: false } },
      {
        $set: {
          downloadStatus: "Pending",
          downloadedAt: null
        }
      }
    );

    // Get status distribution
    const statusDistribution = await p88LegacyData.aggregate([
      {
        $group: {
          _id: "$downloadStatus",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      message: `Successfully initialized download status for ${result.modifiedCount} records`,
      recordsUpdated: result.modifiedCount,
      statusDistribution: statusDistribution
    });
  } catch (error) {
    console.error("Error initializing download status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get download status statistics
export const getDownloadStatusStats = async (req, res) => {
  try {
    const stats = await p88LegacyData.aggregate([
      {
        $group: {
          _id: "$downloadStatus",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totalRecords = await p88LegacyData.countDocuments();

    // Format the response
    const formattedStats = {
      total: totalRecords,
      pending: 0,
      inProgress: 0,
      downloaded: 0,
      failed: 0
    };

    stats.forEach((stat) => {
      switch (stat._id) {
        case "Pending":
          formattedStats.pending = stat.count;
          break;
        case "In Progress":
          formattedStats.inProgress = stat.count;
          break;
        case "Downloaded":
          formattedStats.downloaded = stat.count;
          break;
        case "Failed":
          formattedStats.failed = stat.count;
          break;
        default:
          // Handle null or undefined status
          formattedStats.pending += stat.count;
      }
    });

    res.json({
      success: true,
      stats: formattedStats,
      rawStats: stats
    });
  } catch (error) {
    console.error("Error getting download status stats:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 1. IMPROVED LANGUAGE CHANGE: Waits for reload to ensure language "sticks"
const changeLanguage = async (page, targetLanguage = "english") => {
  try {
    const target = targetLanguage.toLowerCase();

    // 1. Check current language from the dropdown button text
    const currentLangDisplay = await page.evaluate(() => {
      const el = document.querySelector("#dropdownLanguage");
      return el ? el.innerText.trim().toLowerCase() : "";
    });

    const isCurrentlyChinese =
      currentLangDisplay.includes("中文") ||
      currentLangDisplay.includes("chinese");
    const isCurrentlyEnglish =
      currentLangDisplay.includes("english") ||
      currentLangDisplay.includes("en");

    if (
      (target === "chinese" && isCurrentlyChinese) ||
      (target === "english" && isCurrentlyEnglish)
    ) {
      return true;
    }

    // 2. Open the dropdown
    await page.waitForSelector("#dropdownLanguage", { timeout: 10000 });
    await page.click("#dropdownLanguage");

    // 3. Wait for the menu to exist in the DOM
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Find the target link with Strict Text Matching
    const clickResult = await page.evaluate((targetLang) => {
      // Get all links that are children of a dropdown menu or have language-related text
      const links = Array.from(document.querySelectorAll("a"));

      let found = null;
      if (targetLang === "chinese") {
        // Look for Chinese identifiers
        found = links.find((a) => /中文|Chinese|CN/i.test(a.textContent));
      } else {
        // Look for English identifiers - STRICTOR matching to avoid "Tasks" (任务)
        // We look for "English" or "EN" specifically
        found = links.find((a) => {
          const text = a.textContent.trim();
          return (
            text === "English" ||
            text === "EN" ||
            /^English\s?\(.*\)$/i.test(text)
          );
        });
      }

      if (found) {
        found.click();
        return { success: true, text: found.textContent.trim() };
      }

      // Diagnostic: return all available link texts if we failed
      return {
        success: false,
        availableLinks: links
          .map((a) => a.textContent.trim())
          .filter((t) => t.length > 0)
          .slice(0, 20)
      };
    }, target);

    if (clickResult.success) {
      // 5. Wait for the page to reload
      await Promise.all([
        page
          .waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
          .catch(() => {}),
        new Promise((r) => setTimeout(r, 5000))
      ]);

      // 6. Force Refresh if the UI is still wrong
      const bodyText = await page.evaluate(() => document.body.innerText);
      const verified =
        target === "chinese"
          ? bodyText.includes("报告")
          : bodyText.includes("Report");

      if (!verified) {
        await page.reload({ waitUntil: "networkidle2" });
        await new Promise((r) => setTimeout(r, 3000));
      }

      return true;
    } else {
      console.warn(
        `❌ Link not found. Available links on page:`,
        clickResult.availableLinks
      );
      await page.keyboard.press("Escape");
      return false;
    }
  } catch (error) {
    console.warn("⚠️ Language switch error:", error.message);
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
};

// Update download status in database
const updateDownloadStatus = async (recordId, status) => {
  try {
    await p88LegacyData.findByIdAndUpdate(recordId, {
      downloadStatus: status,
      downloadedAt: status === "Downloaded" ? new Date() : null
    });
  } catch (e) {
    console.error("DB Error:", e.message);
  }
};

const getFilename = (record, inspNo) => {
  const reportType = (record.reportType || "Report").replace(
    /[/\\?%*:|"<>]/g,
    "-"
  );
  const po = record.poNumbers?.length > 0 ? record.poNumbers[0] : "NO-PO";
  const group = record.groupNumber || "NO-GROUP";
  return `${reportType}-${po}-${group}-${inspNo}`;
};

// Get inspection records from your MongoDB collection (updated to include download status)
const getInspectionRecords = async (
  startRange,
  endRange,
  downloadAll,
  startDate,
  endDate,
  factoryName,
  poNumber,
  styleNumber,
  includeDownloaded = false
) => {
  let query = {};

  // Only exclude downloaded records if user hasn't selected to include them
  if (!includeDownloaded) {
    query.downloadStatus = { $ne: "Downloaded" };
  }

  if (startDate && endDate) {
    query.submittedInspectionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + "T23:59:59.999Z")
    };
  }

  if (factoryName?.trim()) {
    query.supplier = factoryName;
  }

  if (poNumber?.trim()) {
    query.poNumbers = poNumber;
  }

  if (styleNumber?.trim()) {
    query.style = styleNumber; // Changed from styleNumber to style (lowercase)
  }

  if (downloadAll) {
    const records = await p88LegacyData
      .find(query)
      .sort({ submittedInspectionDate: 1 })
      .lean();
    return records;
  }

  const skip = Math.max(0, startRange - 1);
  const limit = Math.max(1, endRange - startRange + 1);
  const records = await p88LegacyData
    .find(query)
    .sort({ submittedInspectionDate: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return records;
};

export const downloadBulkReportsAuto = async (req, res) => {
  process.platform === "linux"
    ? await downloadBulkReportsUbuntu(req, res)
    : await downloadBulkReports(req, res);
};

// NEW: Single file download with temp folder and direct serve
export const downloadSingleReportDirect = async (req, res) => {
  let browser = null;
  let jobDir = null;
  try {
    const { inspectionNumber, language = "english" } = req.body;

    if (!inspectionNumber) {
      return res.status(400).json({
        success: false,
        error: "Inspection number is required"
      });
    }

    const jobId =
      Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);
    jobDir = path.join(baseTempDir, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: jobDir
    });

    // Login process
    await page.goto(CONFIG.LOGIN_URL);
    await page.waitForSelector("#username");
    await page.type("#username", process.env.P88_USERNAME);
    await page.type("#password", process.env.P88_PASSWORD);
    await page.click("#js-login-submit");
    await page.waitForNavigation();

    // Navigate to report
    const reportUrl = `${CONFIG.BASE_REPORT_URL}${inspectionNumber}`;
    await page.goto(reportUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for page to fully load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 🔥 ALWAYS try to change language (for both English and Chinese)
    const languageChanged = await changeLanguage(page, language);
    if (languageChanged) {
      console.log(`✅ Language changed to ${language} for ${inspectionNumber}`);
    } else {
      console.warn(`⚠️ Language change failed for ${inspectionNumber}`);
    }

    // Wait for print button and click
    await page.waitForSelector("#page-wrapper a", { timeout: 15000 });
    await page.click("#page-wrapper a");

    // Wait and check for file creation
    let downloadedFile = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !downloadedFile) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const files = fs.readdirSync(jobDir);
        const pdfFiles = files.filter(
          (file) => file.endsWith(".pdf") && !file.endsWith(".crdownload")
        );

        if (pdfFiles.length > 0) {
          downloadedFile = pdfFiles[0];
        }
      } catch (error) {
        console.log("📂 Checking for downloaded files...");
      }

      attempts++;
    }

    // Close browser
    if (browser) {
      await browser.close();
      browser = null;
    }

    if (!downloadedFile) {
      throw new Error(
        "Download timeout - no file was downloaded within 30 seconds"
      );
    }

    // Send file to the user
    const filePath = path.join(jobDir, downloadedFile);
    const customFileName = `Report-${inspectionNumber}-${language}-${Date.now()}.pdf`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${customFileName}"`
    );
    res.setHeader("Content-Type", "application/pdf");

    res.download(filePath, customFileName, (err) => {
      // Cleanup temp directory
      if (jobDir && fs.existsSync(jobDir)) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error("Error cleaning up temp directory:", cleanupError);
        }
      }

      if (err) {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Failed to send downloaded file"
          });
        }
      } else {
        console.log(`✅ File sent successfully to user in ${language}`);
      }
    });
  } catch (error) {
    console.error("Direct download failed:", error);
    // Cleanup on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    if (jobDir && fs.existsSync(jobDir)) {
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Error cleaning up temp directory:", cleanupError);
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

const runDownloadTask = async (jobId, recordParams, userId) => {
  const jobInfo = activeJobs.get(jobId);
  let browser = null;

  try {
    const {
      startRange,
      endRange,
      downloadAll,
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      language,
      includeDownloaded
    } = recordParams;

    const jobDir = path.join(baseTempDir, `puppeteer_${jobId}`);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
    jobInfo.jobDir = jobDir;

    const records = await getInspectionRecords(
      startRange,
      endRange,
      downloadAll,
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      includeDownloaded
    );

    if (records.length === 0) {
      jobInfo.status = "completed";
      jobInfo.results = { total: 0, message: "No records matching criteria" };
      return;
    }

    jobInfo.progress.total = records.length;

    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });
    jobInfo.browser = browser;

    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: jobDir
    });

    // --- FULL LOGIN LOGIC ---
    await page.goto(CONFIG.LOGIN_URL, { waitUntil: "networkidle2" });
    await page.waitForSelector("#username", { timeout: 30000 });
    await page.type("#username", process.env.P88_USERNAME);
    await page.type("#password", process.env.P88_PASSWORD);
    await page.click("#js-login-submit");
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    // -----------------------

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let failedReports = [];

    for (const record of records) {
      if (jobInfo.cancelled) break;

      const inspNo =
        record.inspectionNumbers?.[0] ||
        record.inspectionNumbersKey?.split("-")[0];
      if (!inspNo) {
        processedCount++;
        continue;
      }

      try {
        await updateDownloadStatus(record._id, "In Progress");
        const filesBefore = fs.readdirSync(jobDir);

        await page.goto(`${CONFIG.BASE_REPORT_URL}${inspNo}`, {
          waitUntil: "networkidle2"
        });
        await changeLanguage(page, language);
        await new Promise((r) => setTimeout(r, 2000));

        await page.evaluate(() => {
          const btn = document.querySelector(
            '#page-wrapper a, a[href*="print"]'
          );
          if (btn) {
            btn.setAttribute("target", "_self");
            btn.click();
          }
        });

        const newFiles = await waitForNewFile(jobDir, filesBefore, 90000);
        const baseName = getFilename(record, inspNo);

        newFiles.forEach((file, index) => {
          const oldPath = path.join(jobDir, file);
          const newName = `${baseName}-${language}${
            newFiles.length > 1 ? `_${index + 1}` : ""
          }.pdf`;
          fs.renameSync(oldPath, path.join(jobDir, newName));
        });

        await updateDownloadStatus(record._id, "Downloaded");
        successCount++;
      } catch (err) {
        failedCount++;
        failedReports.push({ inspectionNumber: inspNo, error: err.message });
        await updateDownloadStatus(record._id, "Failed");

        // FIX: Add the database log call here
        if (typeof logFailedReport === "function") {
          await logFailedReport(
            record._id,
            inspNo,
            record.groupNumber,
            err.message,
            userId
          );
        }
      }

      processedCount++;
      jobInfo.progress = {
        processed: processedCount,
        total: records.length,
        success: successCount,
        failed: failedCount
      };
    }

    await browser.close();
    jobInfo.browser = null;

    // ZIP Generation
    const zipName = `Reports_${jobId}.zip`;
    const zipPath = path.join(baseTempDir, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    const streamFinished = new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
    });

    archive.pipe(output);
    archive.directory(jobDir, false);
    await archive.finalize();
    await streamFinished;

    jobInfo.zipPath = zipPath;
    jobInfo.status = "completed";
    jobInfo.results = {
      total: processedCount,
      successful: successCount,
      failed: failedCount,
      failedReports,
      completedAt: new Date().toISOString()
    };
  } catch (error) {
    jobInfo.status = "failed";
    jobInfo.error = error.message;
    if (browser) await browser.close();
  }
};

export const downloadBulkReportsCancellable = async (req, res) => {
  const { jobId } = req.body;

  activeJobs.set(jobId, {
    status: "running",
    startTime: new Date(),
    cancelled: false,
    progress: { processed: 0, total: 0, success: 0, failed: 0 },
    jobDir: null,
    zipPath: null
  });

  // Start background worker
  runDownloadTask(jobId, req.body, req.body.userId);

  // Return 202 immediately to frontend
  res.status(202).json({
    success: true,
    message: "Download job started",
    jobId
  });
};

export const getJobZip = async (req, res) => {
  const { jobId } = req.params;

  // 🛑 TEMPORARY BYPASS: Comment out these lines to stop the 401 error
  /*
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ error: 'Authentication token required' });
    }
    */

  const job = activeJobs.get(jobId);

  // If server restarted or job expired
  if (!job) {
    return res.status(404).send("Download link expired or Job ID not found.");
  }

  if (job.status !== "completed" || !job.zipPath) {
    return res.status(400).send("File is not ready yet.");
  }

  // Send the file
  res.download(job.zipPath, `P88_Reports_${jobId}.zip`, (err) => {
    if (err) console.error("Error during file download:", err);

    // Cleanup after sending
    try {
      if (fs.existsSync(job.zipPath)) fs.unlinkSync(job.zipPath);
      if (job.jobDir && fs.existsSync(job.jobDir)) {
        fs.rmSync(job.jobDir, { recursive: true, force: true });
      }
      activeJobs.delete(jobId);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  });
};

// NEW: Cancel download function
export const cancelBulkDownload = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: "Job ID is required"
      });
    }

    const jobInfo = activeJobs.get(jobId);

    if (!jobInfo) {
      return res.status(404).json({
        success: false,
        error: "Job not found or already completed"
      });
    }

    // Mark job as cancelled
    jobInfo.cancelled = true;
    jobInfo.cancelledAt = new Date();

    // Close Puppeteer if it exists
    if (jobInfo.browser) {
      try {
        await jobInfo.browser.close();
      } catch (e) {
        // Ignore errors when closing browser
      }
    }

    // Close Selenium if it exists
    if (jobInfo.driver) {
      try {
        await jobInfo.driver.quit();
      } catch (e) {
        // Ignore errors when closing driver
      }
    }

    // Wait a moment for any ongoing operations to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if there are any downloaded files to send
    if (jobInfo.jobDir && fs.existsSync(jobInfo.jobDir)) {
      const files = fs.readdirSync(jobInfo.jobDir);
      const pdfFiles = files.filter((file) => file.endsWith(".pdf"));

      if (pdfFiles.length > 0) {
        // Create ZIP with partial results
        const zipName = `Reports_Partial_${Date.now()}.zip`;
        const zipPath = path.join(baseTempDir, zipName);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
          // Send the partial results ZIP
          res.download(zipPath, zipName, (err) => {
            // Cleanup
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            if (fs.existsSync(jobInfo.jobDir)) {
              fs.rmSync(jobInfo.jobDir, { recursive: true, force: true });
            }
            activeJobs.delete(jobId);

            // if (err) {
            //     console.error('Error sending partial results:', err);
            // } else {
            //     console.log(`Partial results sent successfully for job ${jobId}`);
            // }
          });
        });

        output.on("error", (err) => {
          activeJobs.delete(jobId);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: "Failed to create partial results ZIP"
            });
          }
        });

        archive.pipe(output);
        archive.directory(jobInfo.jobDir, false);
        await archive.finalize();
      } else {
        // No files downloaded yet
        activeJobs.delete(jobId);
        res.json({
          success: true,
          message: "Download cancelled. No files were completed yet.",
          partialResults: false
        });
      }
    } else {
      // No job directory found
      activeJobs.delete(jobId);
      res.json({
        success: true,
        message: "Download cancelled. No files were completed yet.",
        partialResults: false
      });
    }
  } catch (error) {
    console.error("Error cancelling download:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// NEW: Get job status function (optional - for progress tracking)
export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobInfo = activeJobs.get(jobId);

    if (!jobInfo) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      jobInfo: {
        status: jobInfo.status,
        cancelled: jobInfo.cancelled,
        startTime: jobInfo.startTime,
        progress: jobInfo.progress || null
      }
    });
  } catch (error) {
    console.error("Error getting job status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// NEW: Get download results
export const getDownloadResults = async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobInfo = activeJobs.get(jobId);

    if (!jobInfo) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found or expired" });
    }

    if (jobInfo.results) {
      return res.json({ success: true, results: jobInfo.results });
    }

    res.json({ success: false, message: "Results not available yet" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. STANDARD BULK DOWNLOAD (Follows same logic)
export const downloadBulkReports = async (req, res) => {
  let browser = null;
  let jobDir = null;

  try {
    const {
      userId,
      startRange,
      endRange,
      downloadAll,
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      language = "english",
      includeDownloaded = false
    } = req.body;

    jobDir = path.join(baseTempDir, `puppeteer_${Date.now()}`);
    fs.mkdirSync(jobDir, { recursive: true });
    const records = await getInspectionRecords(
      startRange,
      endRange,
      downloadAll,
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      includeDownloaded
    );

    if (records.length === 0) {
      return res.json({
        success: false,
        message: "No records matching criteria"
      });
    }

    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-pdf-viewer-policy"
      ]
    });

    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: jobDir
    });

    await page.goto(CONFIG.LOGIN_URL);
    await page.waitForSelector("#username");
    await page.type("#username", process.env.P88_USERNAME);
    await page.type("#password", process.env.P88_PASSWORD);
    await page.click("#js-login-submit");
    await page.waitForNavigation();

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let failedReports = [];
    const startTime = Date.now();

    for (const record of records) {
      const inspNo =
        record.inspectionNumbers?.[0] ||
        record.inspectionNumbersKey?.split("-")[0];
      if (!inspNo) continue;

      try {
        await updateDownloadStatus(record._id, "In Progress");
        const filesBefore = fs.readdirSync(jobDir);

        // Load Report Page
        await page.goto(`${CONFIG.BASE_REPORT_URL}${inspNo}`, {
          waitUntil: "networkidle2"
        });

        // Language change
        await changeLanguage(page, language);

        // Give the server a moment to synchronize
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Prepare print button
        await page.evaluate(() => {
          const btn = document.querySelector(
            '#page-wrapper a, a[href*="print"]'
          );
          if (btn) btn.setAttribute("target", "_self");
        });

        try {
          const printBtn = await page.waitForSelector("#page-wrapper a", {
            timeout: 15000
          });
          await printBtn.click();
        } catch (clickErr) {
          if (!clickErr.message.includes("net::ERR_ABORTED")) throw clickErr;
        }

        // Wait for file
        const newFiles = await waitForNewFile(jobDir, filesBefore, 120000);

        // Rename
        const baseName = getFilename(record, inspNo);
        newFiles.forEach((file, index) => {
          const oldPath = path.join(jobDir, file);
          const newName = `${baseName}-${language}${
            newFiles.length > 1 ? `_${index + 1}` : ""
          }.pdf`;
          fs.renameSync(oldPath, path.join(jobDir, newName));
        });

        await updateDownloadStatus(record._id, "Downloaded");
        successCount++;
      } catch (err) {
        console.error(`❌ Error on ${inspNo}:`, err.message);
        failedCount++;
        failedReports.push({
          inspectionNumber: inspNo,
          groupNumber: record.groupNumber,
          error: err.message
        });
        await updateDownloadStatus(record._id, "Failed");

        // FIX: Add the database log call here
        if (typeof logFailedReport === "function") {
          await logFailedReport(
            record._id,
            inspNo,
            record.groupNumber,
            err.message,
            userId
          );
        }
      }

      processedCount++;
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    const downloadResults = {
      total: processedCount,
      successful: successCount,
      failed: failedCount,
      failedReports: failedReports,
      duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      completedAt: new Date().toISOString()
    };

    await browser.close();
    await streamZipAndCleanup(jobDir, res, downloadResults);
  } catch (error) {
    console.error("Download error:", error);
    if (browser) await browser.close();
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

async function streamZipAndCleanup(jobDir, res, downloadResults = null) {
  const zipName = `P88_Reports_${Date.now()}.zip`;
  const zipPath = path.join(baseTempDir, zipName);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    if (downloadResults) {
      try {
        const jsonStr = JSON.stringify(downloadResults);
        // Use the global Buffer to create a Base64 string
        const base64Results = Buffer.from(jsonStr).toString("base64");

        // Expose the header so the browser/frontend can see it
        res.setHeader("Access-Control-Expose-Headers", "X-Download-Results");
        res.setHeader("X-Download-Results", base64Results);
      } catch (headerError) {
        console.error("Error setting results header:", headerError);
      }
    }

    res.download(zipPath, zipName, (err) => {
      // Cleanup files after download starts/finishes
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      if (fs.existsSync(jobDir)) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (rmErr) {
          console.error("Error removing job directory:", rmErr);
        }
      }
    });
  });

  output.on("error", (err) => {
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, error: "Failed to create ZIP file" });
    }
  });

  archive.pipe(output);
  archive.directory(jobDir, false);
  archive.finalize();
}

// Get total record count endpoint (updated)
export const getRecordCount = async (req, res) => {
  try {
    const { includeDownloaded = "false" } = req.query;

    let query = {};
    if (includeDownloaded !== "true") {
      query.downloadStatus = { $ne: "Downloaded" };
    }

    const totalRecords = await p88LegacyData.countDocuments(query);
    const downloadedRecords = await p88LegacyData.countDocuments({
      downloadStatus: "Downloaded"
    });
    const pendingRecords =
      totalRecords - (includeDownloaded === "true" ? 0 : downloadedRecords);

    res.json({
      success: true,
      totalRecords,
      downloadedRecords: includeDownloaded === "true" ? downloadedRecords : 0,
      pendingRecords
    });
  } catch (error) {
    console.error("Error getting record count:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reset download status endpoint (useful for testing)
export const resetDownloadStatus = async (req, res) => {
  try {
    const { recordIds } = req.body;

    let result;
    if (recordIds && recordIds.length > 0) {
      // Reset specific records
      result = await p88LegacyData.updateMany(
        { _id: { $in: recordIds } },
        { $unset: { downloadStatus: "", downloadedAt: "" } }
      );
    } else {
      // Reset all records
      result = await p88LegacyData.updateMany(
        {},
        { $unset: { downloadStatus: "", downloadedAt: "" } }
      );
    }

    res.json({
      success: true,
      message: `Reset download status for ${result.modifiedCount} records`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error resetting download status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Keep existing functions with minor updates...
export const checkBulkSpace = async (req, res) => {
  try {
    const {
      downloadPath,
      startRange,
      endRange,
      downloadAll,
      includeDownloaded = false,
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber
    } = req.body;

    const targetDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Build query for counting records
    let query = {};

    // Add date range filter
    if (startDate && endDate) {
      query.submittedInspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z")
      };
    }

    // Add factory filter
    if (factoryName && factoryName.trim() !== "") {
      query.supplier = factoryName;
    }

    // Add PO number filter
    if (poNumber && poNumber.trim() !== "") {
      query.poNumbers = poNumber;
    }

    // Add style filter
    if (styleNumber && styleNumber.trim() !== "") {
      query.style = styleNumber;
    }

    // Filter out already downloaded records unless specifically requested
    if (!includeDownloaded) {
      query.downloadStatus = { $ne: "Downloaded" };
    }

    let recordCount;
    if (downloadAll) {
      recordCount = await p88LegacyData.countDocuments(query);
    } else {
      if (!startRange || !endRange || startRange > endRange || startRange < 1) {
        return res.status(400).json({
          success: false,
          error: "Invalid range specified"
        });
      }

      const totalRecords = await p88LegacyData.countDocuments(query);
      if (startRange > totalRecords) {
        recordCount = 0;
      } else if (endRange > totalRecords) {
        recordCount = totalRecords - startRange + 1;
      } else {
        recordCount = endRange - startRange + 1;
      }
    }

    const availableSpace = await getAvailableSpace(targetDir);
    const estimatedSize = 1024 * 1024 * 2 * recordCount; // 2MB per report estimate
    const hasEnoughSpace = availableSpace > estimatedSize * 1.5; // 1.5x buffer

    res.json({
      success: true,
      availableSpace: formatBytes(availableSpace),
      availableSpaceBytes: availableSpace,
      estimatedDownloadSize: formatBytes(estimatedSize),
      estimatedDownloadSizeBytes: estimatedSize,
      recordCount: recordCount,
      hasEnoughSpace: hasEnoughSpace,
      path: targetDir,
      recommendation: hasEnoughSpace
        ? `You have sufficient space to download ${recordCount} reports.`
        : `Warning: Limited disk space for ${recordCount} reports. Consider freeing up space or choosing a different location.`,
      filters: {
        dateRange:
          startDate && endDate
            ? `${startDate} to ${endDate}`
            : "No date filter",
        factory: factoryName || "All factories",
        includeDownloaded: includeDownloaded
      }
    });
  } catch (error) {
    console.error("Error checking bulk space:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Keep existing single download function
export const saveDownloadParth = async (req, res) => {
  let browser = null;
  let jobDir = null;
  try {
    const { downloadPath, language = "english" } = req.body;
    const targetDownloadDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

    // Ensure download directory exists
    if (!fs.existsSync(targetDownloadDir)) {
      fs.mkdirSync(targetDownloadDir, { recursive: true });
    }

    // 2️⃣ Launch browser with better configuration
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote"
      ],
      defaultViewport: null
    });

    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // 👉 Enhanced download behavior setup
    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: jobDir
    });

    // Also set via page._client() as backup
    try {
      await page._client().send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: jobDir
      });
    } catch (clientError) {
      console.log(
        "⚠️ Backup download behavior setup failed:",
        clientError.message
      );
    }

    // Get initial file list and timestamps
    const getFileList = async () => {
      if (!fs.existsSync(targetDownloadDir)) return [];
      const files = await readdir(targetDownloadDir);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(targetDownloadDir, file);
          const stats = await stat(filePath);
          return {
            name: file,
            mtime: stats.mtime.getTime()
          };
        })
      );
      return fileStats;
    };

    const initialFiles = await getFileList();

    // Login process
    await page.goto(CONFIG.LOGIN_URL);
    await page.waitForSelector("#username");
    await page.type("#username", process.env.P88_USERNAME);
    await page.type("#password", process.env.P88_PASSWORD);
    await page.click("#js-login-submit");
    await page.waitForNavigation();

    // Navigate to the default report (you might want to make this configurable)
    const defaultInspectionNumber = "1528972"; // You can make this dynamic
    await page.goto(`${CONFIG.BASE_REPORT_URL}${defaultInspectionNumber}`);

    // Change language if requested
    if (language === "chinese") {
      await changeLanguage(page, language);
    }

    await page.waitForSelector("#page-wrapper a");

    // Click print button
    await page.click("#page-wrapper a");

    // Wait for download to complete - increased wait time
    await new Promise((resolve) => setTimeout(resolve, 8000));

    if (browser) {
      await browser.close();
    }

    // Get final file list and identify new files
    const finalFiles = await getFileList();
    const newFiles = finalFiles.filter(
      (finalFile) =>
        !initialFiles.some(
          (initialFile) =>
            initialFile.name === finalFile.name &&
            initialFile.mtime === finalFile.mtime
        )
    );

    let totalSize = 0;
    const fileDetails = [];

    for (const fileInfo of newFiles) {
      const filePath = path.join(targetDownloadDir, fileInfo.name);
      const size = await getFileSize(filePath);
      totalSize += size;
      fileDetails.push({
        name: fileInfo.name,
        size: formatBytes(size),
        sizeBytes: size
      });
    }

    res.json({
      success: true,
      message: "Report downloaded successfully",
      downloadInfo: {
        fileCount: newFiles.length,
        totalSize: formatBytes(totalSize),
        totalSizeBytes: totalSize,
        files: fileDetails,
        downloadPath: targetDownloadDir
      }
    });
  } catch (error) {
    console.error("Scraping failed:", error);

    // Ensure browser is closed on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Keep existing functions
export const checkSpace = async (req, res) => {
  try {
    const { downloadPath } = req.body;
    const targetDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

    // Ensure directory exists for space check
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const availableSpace = await getAvailableSpace(targetDir);
    const estimatedSize = 1024 * 1024 * 2; // 2MB estimate for single report
    const hasEnoughSpace = availableSpace > estimatedSize * 2; // 2x buffer

    res.json({
      success: true,
      availableSpace: formatBytes(availableSpace),
      availableSpaceBytes: availableSpace,
      estimatedDownloadSize: formatBytes(estimatedSize),
      estimatedDownloadSizeBytes: estimatedSize,
      hasEnoughSpace: hasEnoughSpace,
      path: targetDir,
      recommendation: hasEnoughSpace
        ? "You have sufficient space for the download."
        : "Warning: Limited disk space available. Consider freeing up space or choosing a different location."
    });
  } catch (error) {
    console.error("Error checking space:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const validateDownloadParth = async (req, res) => {
  try {
    const { downloadPath } = req.body;

    if (!downloadPath) {
      return res.json({
        success: true,
        isValid: true,
        path: CONFIG.DEFAULT_DOWNLOAD_DIR,
        message: "Using default download directory"
      });
    }

    try {
      const resolvedPath = path.resolve(downloadPath);

      // Try to create directory if it doesn't exist
      if (!fs.existsSync(resolvedPath)) {
        fs.mkdirSync(resolvedPath, { recursive: true });
      }

      // Test write permissions
      const testFile = path.join(resolvedPath, "test_write.tmp");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);

      res.json({
        success: true,
        isValid: true,
        path: resolvedPath,
        message: "Path is valid and writable"
      });
    } catch (error) {
      let errorMessage = "Path is not accessible";
      if (error.code === "EPERM" || error.code === "EACCES") {
        errorMessage =
          "Permission denied. Please choose a folder you have write access to.";
      }

      res.json({
        success: true,
        isValid: false,
        path: downloadPath,
        message: errorMessage
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get unique factories from database
export const getFactories = async (req, res) => {
  try {
    const factories = await p88LegacyData.distinct("supplier");
    const filteredFactories = factories.filter(
      (factory) => factory && factory.trim() !== ""
    );

    res.json({
      success: true,
      factories: filteredFactories.sort()
    });
  } catch (error) {
    console.error("Error getting factories:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get unique PO numbers from database
export const getPONumbers = async (req, res) => {
  try {
    const poNumbers = await p88LegacyData.distinct("poNumbers");
    // Flatten array since poNumbers might be an array field
    const flattenedPOs = poNumbers
      .flat()
      .filter((po) => po && po.trim() !== "");

    res.json({
      success: true,
      poNumbers: [...new Set(flattenedPOs)].sort()
    });
  } catch (error) {
    console.error("Error getting PO numbers:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get unique styles from database
export const getStyles = async (req, res) => {
  try {
    const styles = await p88LegacyData.distinct("style"); // Changed from 'Style' to 'style'
    const filteredStyles = styles.filter(
      (style) => style && style.trim() !== ""
    );

    res.json({
      success: true,
      styles: filteredStyles.sort()
    });
  } catch (error) {
    console.error("Error getting styles:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get cross-filtered options based on current filters
export const getCrossFilteredOptions = async (req, res) => {
  try {
    const { startDate, endDate, factoryName, poNumber, styleNumber } =
      req.query;

    let baseQuery = {};

    // Add date filter if provided
    if (startDate && endDate) {
      baseQuery.submittedInspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z")
      };
    }

    // Build queries for each filter option
    const factoryQuery = { ...baseQuery };
    const poQuery = { ...baseQuery };
    const styleQuery = { ...baseQuery };

    // Add cross-filters (exclude the field we're getting options for)
    if (poNumber && poNumber.trim() !== "") {
      factoryQuery.poNumbers = poNumber;
      styleQuery.poNumbers = poNumber;
    }

    if (styleNumber && styleNumber.trim() !== "") {
      factoryQuery.style = styleNumber; // Changed to 'style'
      poQuery.style = styleNumber; // Changed to 'style'
    }

    if (factoryName && factoryName.trim() !== "") {
      poQuery.supplier = factoryName;
      styleQuery.supplier = factoryName;
    }

    // Get filtered options
    const [factories, poNumbers, styles] = await Promise.all([
      p88LegacyData.distinct("supplier", factoryQuery),
      p88LegacyData.distinct("poNumbers", poQuery),
      p88LegacyData.distinct("style", styleQuery) // Changed to 'style'
    ]);

    res.json({
      success: true,
      factories: factories.filter((f) => f && f.trim() !== "").sort(),
      poNumbers: [...new Set(poNumbers.flat())]
        .filter((po) => po && po.trim() !== "")
        .sort(),
      styles: styles.filter((s) => s && s.trim() !== "").sort()
    });
  } catch (error) {
    console.error("Error getting cross-filtered options:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Open download folder in system file explorer
export const openDownloadFolder = async (req, res) => {
  try {
    const { downloadPath } = req.body;
    const targetDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let command;
    if (process.platform === "win32") {
      command = `explorer "${targetDir}"`;
    } else if (process.platform === "darwin") {
      command = `open "${targetDir}"`;
    } else {
      command = `xdg-open "${targetDir}"`;
    }

    exec(command, (error) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: "Failed to open download folder"
        });
      }

      res.json({
        success: true,
        message: "Download folder opened successfully",
        path: targetDir
      });
    });
  } catch (error) {
    console.error("Error opening download folder:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get date filtered statistics
export const getDateFilteredStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      includeDownloaded = "false"
    } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.submittedInspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z")
      };
    }

    if (factoryName && factoryName.trim() !== "") {
      query.supplier = factoryName;
    }

    if (poNumber && poNumber.trim() !== "") {
      query.poNumbers = poNumber;
    }

    if (styleNumber && styleNumber.trim() !== "") {
      query.style = styleNumber; // Changed to 'style'
    }

    if (includeDownloaded !== "true") {
      query.downloadStatus = { $ne: "Downloaded" };
    }

    const totalRecords = await p88LegacyData.countDocuments(query);
    const downloadedQuery = { ...query, downloadStatus: "Downloaded" };
    const downloadedRecords = await p88LegacyData.countDocuments(
      downloadedQuery
    );
    const pendingRecords =
      totalRecords - (includeDownloaded === "true" ? 0 : downloadedRecords);

    res.json({
      success: true,
      totalRecords,
      downloadedRecords: includeDownloaded === "true" ? downloadedRecords : 0,
      pendingRecords,
      filters: {
        dateRange: startDate && endDate ? { startDate, endDate } : null,
        factory: factoryName || null,
        poNumber: poNumber || null,
        styleNumber: styleNumber || null
      }
    });
  } catch (error) {
    console.error("Error getting date filtered stats:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const searchSuppliers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 1) {
      return res.json({ success: true, suggestions: [] });
    }

    const suppliers = await p88LegacyData.distinct("supplier", {
      supplier: { $regex: query.trim(), $options: "i" }
    });

    const filteredSuppliers = suppliers
      .filter((supplier) => supplier && supplier.trim() !== "")
      .slice(0, 10) // Limit to 10 suggestions
      .sort();

    res.json({
      success: true,
      suggestions: filteredSuppliers
    });
  } catch (error) {
    console.error("Error searching suppliers:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const searchPONumbers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 1) {
      return res.json({ success: true, suggestions: [] });
    }

    const poNumbers = await p88LegacyData.distinct("poNumbers", {
      poNumbers: { $regex: query.trim(), $options: "i" }
    });

    const filteredPOs = [...new Set(poNumbers.flat())]
      .filter((po) => po && po.trim() !== "")
      .slice(0, 10)
      .sort();

    res.json({
      success: true,
      suggestions: filteredPOs
    });
  } catch (error) {
    console.error("Error searching PO numbers:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const searchStyles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 1) {
      return res.json({ success: true, suggestions: [] });
    }

    const styles = await p88LegacyData.distinct("style", {
      style: { $regex: query.trim(), $options: "i" }
    });

    const filteredStyles = styles
      .filter((style) => style && style.trim() !== "")
      .slice(0, 10)
      .sort();

    res.json({
      success: true,
      suggestions: filteredStyles
    });
  } catch (error) {
    console.error("Error searching styles:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GARBAGE COLLECTOR
 * Run every hour to clean up "zombie" folders left by crashes or cancelled jobs
 */
// setInterval(() => {
//     console.log("Running scheduled temp file cleanup...");
//     fs.readdir(baseTempDir, (err, files) => {
//         if (err) {
//             console.error("Cleanup error:", err);
//             return;
//         }

//         const now = Date.now();
//         const maxAge = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

//         files.forEach(file => {
//             const filePath = path.join(baseTempDir, file);
//             fs.stat(filePath, (err, stats) => {
//                 if (err) return;

//                 // If the file/folder is older than maxAge, delete it
//                 if (now - stats.mtimeMs > maxAge) {
//                     fs.rm(filePath, { recursive: true, force: true }, (rmErr) => {
//                         if (!rmErr) {
//                             console.log(`Garbage Collector: Deleted old temp file/folder: ${file}`);
//                         } else {
//                             console.error(`Garbage Collector: Failed to delete ${file}:`, rmErr);
//                         }
//                     });
//                 }
//             });
//         });
//     });
// }, 60 * 60 * 1000); // 1 hour interval
