import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// For Chinese font support, we'll use a Google Font approach
// You need to download and convert NotoSansSC-Regular.ttf to base64
// For now, we'll handle it with a fallback approach

const MeasurementSheet = ({ data, filterCriteria }) => {
  const [chineseFontLoaded, setChineseFontLoaded] = useState(false);
  const [chineseFontData, setChineseFontData] = useState(null);

  // Load Chinese font on component mount
  useEffect(() => {
    const loadChineseFont = async () => {
      try {
        // Try to fetch the font from public folder or CDN
        const response = await fetch("/fonts/NotoSansSC-Regular.ttf");
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              "",
            ),
          );
          setChineseFontData(base64);
          setChineseFontLoaded(true);
        }
      } catch (error) {
        console.warn("Chinese font not loaded, using fallback:", error);
      }
    };

    loadChineseFont();
  }, []);

  // Sanitize function for measurement point names
  const sanitizeMeasurementPoint = (point, forPDF = false) => {
    if (!point || typeof point !== "string") {
      return "N/A";
    }

    let sanitized = String(point);

    if (forPDF && !chineseFontLoaded) {
      // If Chinese font not loaded, replace special characters
      sanitized = sanitized
        .replace(/（/g, "(")
        .replace(/）/g, ")")
        .replace(/［/g, "[")
        .replace(/］/g, "]")
        .replace(/｛/g, "{")
        .replace(/｝/g, "}")
        .replace(/≤/g, "<=")
        .replace(/≥/g, ">=")
        .replace(/≠/g, "!=")
        .replace(/±/g, "+/-")
        .replace(/×/g, "x")
        .replace(/÷/g, "/")
        .replace(/°/g, "deg")
        .replace(/″/g, '"')
        .replace(/′/g, "'")
        .replace(/…/g, "...")
        .replace(/–/g, "-")
        .replace(/—/g, "-")
        .replace(/'/g, "'")
        .replace(/'/g, "'")
        .replace(/"/g, '"')
        .replace(/"/g, '"');
    }

    // Handle spaced-out characters
    sanitized = sanitized.replace(
      /\b([a-zA-Z0-9])\s+([a-zA-Z0-9])\s+([a-zA-Z0-9])\s+([a-zA-Z0-9])\b/g,
      (match) => {
        const parts = match.split(/\s+/);
        if (parts.every((part) => part.length === 1)) {
          return match.replace(/\s/g, "");
        }
        return match;
      },
    );

    sanitized = sanitized.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\b/g, "$1$2$3");

    if (!forPDF) {
      sanitized = sanitized.replace(/"/g, "");
    }

    sanitized = sanitized.replace(/ {3,}/g, " ");
    sanitized = sanitized.trim();

    return sanitized.substring(0, 100);
  };

  const decimalToFraction = (decimal) => {
    if (
      decimal === null ||
      decimal === undefined ||
      decimal === "" ||
      isNaN(parseFloat(decimal))
    ) {
      return "";
    }

    const num = parseFloat(decimal);
    if (Number.isInteger(num)) {
      return num.toString();
    }

    const tolerance = 1.0e-6;
    const integerPart = Math.trunc(num);
    let fractionalPart = Math.abs(num - integerPart);

    if (fractionalPart < tolerance) {
      return integerPart.toString();
    }

    const denominators = [2, 4, 8, 16, 32, 64];

    for (const d of denominators) {
      if (
        Math.abs(fractionalPart * d - Math.round(fractionalPart * d)) <
        tolerance * d
      ) {
        const numerator = Math.round(fractionalPart * d);
        const gcd = (a, b) => (b < 0.00001 ? a : gcd(b, Math.floor(a % b)));
        const commonDivisor = gcd(numerator, d);
        const simplifiedNumerator = numerator / commonDivisor;
        const simplifiedDenominator = d / commonDivisor;
        return `${
          integerPart || ""
        } ${simplifiedNumerator}/${simplifiedDenominator}`.trim();
      }
    }

    return num.toFixed(2);
  };

  const measurementGroups = useMemo(() => {
    if (!data) return {};
    return data[filterCriteria.washType] || {};
  }, [data, filterCriteria.washType]);

  const tabs = useMemo(
    () => Object.keys(measurementGroups),
    [measurementGroups],
  );

  const [activeTab, setActiveTab] = useState(() => {
    // First try to find K-type tabs, then P-type tabs
    const firstKTab = tabs.find((tab) => tab.toUpperCase().startsWith("K"));
    const firstPTab = tabs.find((tab) => tab.toUpperCase().startsWith("P"));
    return firstKTab || firstPTab || tabs[0] || "main";
  });

  const [isExporting, setIsExporting] = useState(false);

  const sizes = filterCriteria.sizes || [];

  // Update activeTab when tabs change
  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      const firstKTab = tabs.find((tab) => tab.toUpperCase().startsWith("K"));
      const firstPTab = tabs.find((tab) => tab.toUpperCase().startsWith("P"));
      setActiveTab(firstKTab || firstPTab || tabs[0] || "main");
    }
  }, [tabs, activeTab]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg mt-6 border border-gray-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500">
            No measurement data found for the selected criteria. Please try
            different filter options.
          </p>
        </div>
      </div>
    );
  }

  const currentMeasurements = measurementGroups[activeTab] || [];

  const getTableData = (groupKey) => {
    const groupData = measurementGroups[groupKey] || [];
    const headers = ["Measurement Point", "Tol+", "Tol-", ...sizes];

    const body = groupData.map((m) => [
      sanitizeMeasurementPoint(m.point),
      `+${decimalToFraction(m.tolerancePlus)}`,
      `-${decimalToFraction(m.toleranceMinus)}`,
      ...sizes.map((size, index) => {
        const value = m.values?.[index];
        return decimalToFraction(value);
      }),
    ]);

    return { headers, body };
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF("landscape");

      // Add Chinese font if loaded
      if (chineseFontLoaded && chineseFontData) {
        doc.addFileToVFS("NotoSansSC-Regular.ttf", chineseFontData);
        doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
      }

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Filter tabs (K-type or P-type)
      const validTabs = tabs.filter(
        (tab) =>
          tab.toUpperCase().startsWith("K") ||
          tab.toUpperCase().startsWith("P"),
      );

      if (validTabs.length === 0) {
        // If no K or P tabs, use all tabs
        validTabs.push(...tabs);
      }

      validTabs.forEach((tabKey, tabIndex) => {
        const groupData = measurementGroups[tabKey] || [];

        if (groupData.length > 0) {
          if (tabIndex > 0) {
            doc.addPage("landscape");
          }

          let currentPageY = 5;

          // Function to add header to page
          const addHeader = (y, kValue) => {
            const washTypeDisplay =
              filterCriteria.washType === "beforeWash"
                ? "Before Wash"
                : "After Wash";
            doc.setFillColor(240, 240, 240);
            doc.rect(5, y, pageWidth - 10, 12, "F");
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(
              "Yorkmars (Cambodia) Garment MFG. Co. Ltd. - Measurement List",
              pageWidth / 2,
              y + 5,
              { align: "center" },
            );

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`(${washTypeDisplay})`, pageWidth / 2, y + 10, {
              align: "center",
            });

            y += 15;

            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");

            doc.text(`Customer: ${filterCriteria.customer || ""}`, 8, y);
            doc.text(`CustStyle: ${filterCriteria.custStyle || ""}`, 8, y + 6);

            doc.text(
              `Our Ref: ${filterCriteria.styleNo || ""}`,
              pageWidth / 2 - 25,
              y,
            );
            doc.text(
              `Order Qty: ${filterCriteria.totalQty || ""}`,
              pageWidth / 2 - 25,
              y + 6,
            );

            doc.text(`Actual Qty:`, pageWidth - 50, y);
            doc.text(`Date:`, pageWidth - 50, y + 6);

            return y + 8;
          };

          // Function to add table headers
          const addTableHeaders = (y) => {
            const rowHeight = 8;
            const fontSize = 6;

            const measurementPointWidth = 80;
            const tolPlusWidth = 8;
            const tolMinusWidth = 8;
            const remainingWidth =
              pageWidth -
              10 -
              measurementPointWidth -
              tolPlusWidth -
              tolMinusWidth;
            const sizeGroupWidth = remainingWidth / sizes.length;
            const sizeColumnWidth = sizeGroupWidth / 4;

            let tableY = y;

            // First header row
            doc.setFillColor(220, 220, 220);
            doc.rect(5, tableY, pageWidth - 10, rowHeight, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(fontSize);

            let colX = 5;

            doc.rect(colX, tableY, measurementPointWidth, rowHeight, "S");
            doc.text(
              "Measurement Point",
              colX + measurementPointWidth / 2,
              tableY + rowHeight / 2 + 1,
              { align: "center" },
            );
            colX += measurementPointWidth;

            doc.rect(
              colX,
              tableY,
              tolPlusWidth + tolMinusWidth,
              rowHeight,
              "S",
            );
            doc.text(
              "Tolerance",
              colX + (tolPlusWidth + tolMinusWidth) / 2,
              tableY + rowHeight / 2 + 1,
              { align: "center" },
            );
            colX += tolPlusWidth + tolMinusWidth;

            sizes.forEach((size) => {
              doc.rect(colX, tableY, sizeGroupWidth, rowHeight, "S");
              doc.text(
                size,
                colX + sizeGroupWidth / 2,
                tableY + rowHeight / 2 + 1,
                { align: "center" },
              );
              colX += sizeGroupWidth;
            });

            tableY += rowHeight;

            // Second header row
            doc.setFillColor(200, 200, 200);
            doc.rect(5, tableY, pageWidth - 10, rowHeight, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(fontSize - 0.5);

            colX = 5;

            doc.rect(colX, tableY, measurementPointWidth, rowHeight, "S");
            colX += measurementPointWidth;

            doc.rect(colX, tableY, tolPlusWidth, rowHeight, "S");
            doc.text("+", colX + tolPlusWidth / 2, tableY + rowHeight / 2 + 1, {
              align: "center",
            });
            colX += tolPlusWidth;

            doc.rect(colX, tableY, tolMinusWidth, rowHeight, "S");
            doc.text(
              "-",
              colX + tolMinusWidth / 2,
              tableY + rowHeight / 2 + 1,
              { align: "center" },
            );
            colX += tolMinusWidth;

            sizes.forEach(() => {
              doc.rect(colX, tableY, sizeColumnWidth, rowHeight, "S");
              doc.text(
                "Spec",
                colX + sizeColumnWidth / 2,
                tableY + rowHeight / 2 + 1,
                { align: "center" },
              );
              colX += sizeColumnWidth;

              for (let i = 0; i < 3; i++) {
                doc.rect(colX, tableY, sizeColumnWidth, rowHeight, "S");
                colX += sizeColumnWidth;
              }
            });

            return tableY + rowHeight;
          };

          // Function to add footer
          const addFooter = () => {
            const footerY = pageHeight - 22;

            doc.setFillColor(240, 240, 240);
            doc.rect(5, footerY, pageWidth - 10, 16, "F");

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.rect(5, footerY, pageWidth - 10, 16);

            doc.setFontSize(6);
            doc.setFont("helvetica", "normal");

            const leftWidth = 60;
            doc.line(5 + leftWidth, footerY, 5 + leftWidth, footerY + 16);

            doc.setFont("helvetica", "bold");
            doc.text("Inspect Quantity", 7, footerY + 4);
            doc.setFont("helvetica", "normal");

            doc.rect(7, footerY + 5, 2, 2);
            doc.text("Accept", 10, footerY + 7);

            doc.rect(7, footerY + 10, 2, 2);
            doc.text("Reject", 10, footerY + 12);

            doc.rect(30, footerY + 10, 2, 2);
            doc.text("Wait for Approval", 33, footerY + 12);

            const centerWidth = pageWidth - 10 - leftWidth - 70;
            doc.line(
              5 + leftWidth + centerWidth,
              footerY,
              5 + leftWidth + centerWidth,
              footerY + 16,
            );

            doc.setFont("helvetica", "bold");
            doc.text("Remark:", 5 + leftWidth + 2, footerY + 4);
            doc.setFont("helvetica", "normal");

            doc.text("Inspector:", 5 + leftWidth + 2, footerY + 10);
            doc.text("Inspector's Signature:", 5 + leftWidth + 2, footerY + 14);
            doc.text(`Color:`, 5 + leftWidth + 70, footerY + 10);
            doc.text(
              `K-Value: ${tabKey || ""}`,
              5 + leftWidth + 70,
              footerY + 14,
            );

            doc.setFont("helvetica", "bold");
            doc.text(
              "QC Signature",
              5 + leftWidth + centerWidth + 2,
              footerY + 4,
            );
            doc.setFont("helvetica", "normal");

            doc.text(
              "Factory Signature",
              5 + leftWidth + centerWidth + 2,
              footerY + 10,
            );
            doc.text(
              "Supervisor Approval",
              5 + leftWidth + centerWidth + 2,
              footerY + 14,
            );

            doc.line(5, footerY + 8, pageWidth - 5, footerY + 8);
          };

          // Calculate row height function
          const calculateRowHeight = (text, width, fontSize) => {
            // Use Chinese font if loaded
            if (chineseFontLoaded) {
              doc.setFont("NotoSansSC", "normal");
            } else {
              doc.setFont("helvetica", "bold");
            }
            doc.setFontSize(fontSize);

            const sanitizedText = sanitizeMeasurementPoint(
              text,
              !chineseFontLoaded,
            );
            const lines = doc.splitTextToSize(sanitizedText, width - 1);
            const lineHeight = fontSize * 1.05;
            const minRowHeight = 6;
            const textHeight = lines.length * lineHeight + 1;

            return Math.max(minRowHeight, textHeight);
          };

          currentPageY = addHeader(currentPageY, tabKey);
          let tableY = addTableHeaders(currentPageY);

          const measurementPointWidth = 80;
          const tolPlusWidth = 8;
          const tolMinusWidth = 8;
          const remainingWidth =
            pageWidth -
            10 -
            measurementPointWidth -
            tolPlusWidth -
            tolMinusWidth;
          const sizeGroupWidth = remainingWidth / sizes.length;
          const sizeColumnWidth = sizeGroupWidth / 4;

          const measurementPointFontSize = 6;
          const toleranceFontSize = 6;
          const specFontSize = 6;

          groupData.forEach((item, index) => {
            const requiredRowHeight = calculateRowHeight(
              item.point,
              measurementPointWidth,
              measurementPointFontSize,
            );

            if (tableY + requiredRowHeight > pageHeight - 25) {
              addFooter();
              doc.addPage("landscape");
              currentPageY = 5;
              currentPageY = addHeader(currentPageY, tabKey);
              tableY = addTableHeaders(currentPageY);
            }

            if (index % 2 === 0) {
              doc.setFillColor(248, 248, 248);
              doc.rect(5, tableY, pageWidth - 10, requiredRowHeight, "F");
            }

            let colX = 5;

            // Measurement Point column
            doc.rect(
              colX,
              tableY,
              measurementPointWidth,
              requiredRowHeight,
              "S",
            );

            // Use Chinese font if loaded
            if (chineseFontLoaded) {
              doc.setFont("NotoSansSC", "normal");
            } else {
              doc.setFont("helvetica", "bold");
            }
            doc.setFontSize(measurementPointFontSize);

            const sanitizedMeasurementText = sanitizeMeasurementPoint(
              item.point,
              !chineseFontLoaded,
            );
            const lines = doc.splitTextToSize(
              sanitizedMeasurementText,
              measurementPointWidth - 6,
            );
            const lineHeight = measurementPointFontSize * 1.05;

            const totalTextHeight = lines.length * lineHeight;
            const paddingTop = Math.max(
              0,
              (requiredRowHeight - totalTextHeight) / 2,
            );
            const startY = tableY + paddingTop + lineHeight * 0.8;

            lines.forEach((line, lineIndex) => {
              const yPos = startY + lineIndex * lineHeight;
              doc.text(line.trim(), colX + 3, yPos);
            });

            colX += measurementPointWidth;

            // Reset to default font for other columns
            doc.setFont("helvetica", "normal");

            // Tolerance Plus
            doc.rect(colX, tableY, tolPlusWidth, requiredRowHeight, "S");
            doc.setFontSize(toleranceFontSize);
            doc.text(
              decimalToFraction(item.tolerancePlus),
              colX + tolPlusWidth / 2,
              tableY + requiredRowHeight / 2 + 2,
              { align: "center" },
            );
            colX += tolPlusWidth;

            // Tolerance Minus
            doc.rect(colX, tableY, tolMinusWidth, requiredRowHeight, "S");
            doc.setFontSize(toleranceFontSize);
            doc.text(
              decimalToFraction(item.toleranceMinus),
              colX + tolMinusWidth / 2,
              tableY + requiredRowHeight / 2 + 2,
              { align: "center" },
            );
            colX += tolMinusWidth;

            // Size values
            sizes.forEach((size, valueIndex) => {
              const value = item.values?.[valueIndex];
              doc.rect(colX, tableY, sizeColumnWidth, requiredRowHeight, "S");
              doc.setFontSize(specFontSize);
              doc.setFont("helvetica", "bold");

              const textToDisplay =
                value !== undefined && value !== null && value !== ""
                  ? decimalToFraction(value)
                  : "-";
              doc.text(
                textToDisplay,
                colX + sizeColumnWidth / 2,
                tableY + requiredRowHeight / 2 + 2,
                { align: "center" },
              );
              colX += sizeColumnWidth;

              // Three empty columns
              for (let j = 0; j < 3; j++) {
                doc.rect(colX, tableY, sizeColumnWidth, requiredRowHeight, "S");
                colX += sizeColumnWidth;
              }
            });

            tableY += requiredRowHeight;
          });

          addFooter();
        }
      });

      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(
        `${filterCriteria.styleNo}_${filterCriteria.washType}_${timestamp}.pdf`,
      );
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Filter K-type or P-type tabs
      const validTabs = tabs.filter(
        (tab) =>
          tab.toUpperCase().startsWith("K") ||
          tab.toUpperCase().startsWith("P"),
      );

      if (validTabs.length === 0) {
        validTabs.push(...tabs);
      }

      if (validTabs.length === 0) {
        alert("No measurement groups found to export.");
        setIsExporting(false);
        return;
      }

      validTabs.forEach((tabKey) => {
        const { headers, body } = getTableData(tabKey);
        if (body.length > 0) {
          const sheetData = [
            [
              "🏭 YORKMARS (CAMBODIA) GARMENT MFG CO., LTD",
              "",
              "",
              "",
              "",
              "",
              "",
              "📊 MEASUREMENT SPECIFICATION",
            ],
            [
              `📋 ${tabKey.toUpperCase()} MEASUREMENT SPECIFICATIONS`,
              "",
              "",
              "",
              "",
              "",
              "",
              "✅ QUALITY CONTROL DOCUMENT",
            ],
            [
              "═══════════════════════════════════════════════════════════════════════════════════════════════",
            ],
            [
              "📄 DOCUMENT INFORMATION",
              "",
              "",
              "",
              "",
              "⚙️ TECHNICAL DETAILS",
              "",
              "",
            ],
            [
              "Style Number:",
              filterCriteria.styleNo,
              "",
              "Wash Type:",
              filterCriteria.washType === "beforeWash"
                ? "🧼 Before Wash"
                : "🌊 After Wash",
              "Total Items:",
              body.length.toString(),
              "",
            ],
            [
              "Generated Date:",
              new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              "",
              "Generated Time:",
              new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              "Group Type:",
              `📏 ${tabKey.toUpperCase()}`,
              "",
            ],
            [
              "Customer:",
              filterCriteria.customer || "",
              "",
              "Available Sizes:",
              sizes.join(" | "),
              "Status:",
              "✅ Active",
              "",
            ],
            [
              "Quality Level:",
              "🏆 Premium Grade",
              "",
              "Tolerance Check:",
              "✅ Verified",
              "Export Format:",
              "📊 Excel Professional",
              "",
            ],
            [
              "═══════════════════════════════════════════════════════════════════════════════════════════════",
            ],
            ["📊 MEASUREMENT DATA TABLE", "", "", "", "", "", "", ""],
            [
              "📌 Point Name",
              "📈 Tolerance (+)",
              "📉 Tolerance (-)",
              ...sizes.map((size) => `📏 Size ${size}`),
              "",
            ],
            headers,
            ...body,
          ];

          const ws = XLSX.utils.aoa_to_sheet(sheetData);

          const colWidths = [
            { width: 40 },
            { width: 18 },
            { width: 18 },
            ...sizes.map(() => ({ width: 20 })),
          ];
          ws["!cols"] = colWidths;

          const maxCol = Math.max(headers.length - 1, 7);
          ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
            { s: { r: 0, c: 7 }, e: { r: 0, c: maxCol } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
            { s: { r: 1, c: 7 }, e: { r: 1, c: maxCol } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: maxCol } },
            { s: { r: 8, c: 0 }, e: { r: 8, c: maxCol } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
            { s: { r: 3, c: 5 }, e: { r: 3, c: maxCol } },
            { s: { r: 9, c: 0 }, e: { r: 9, c: maxCol } },
          ];

          ws["!rows"] = [
            { hpt: 35 },
            { hpt: 30 },
            { hpt: 20 },
            { hpt: 25 },
            { hpt: 22 },
            { hpt: 22 },
            { hpt: 22 },
            { hpt: 22 },
            { hpt: 20 },
            { hpt: 30 },
            { hpt: 25 },
            { hpt: 28 },
            ...body.map(() => ({ hpt: 24 })),
          ];

          const sheetName = `${tabKey.toUpperCase()}`.substring(0, 31);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      });

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
      const fileName = `${filterCriteria.styleNo}_Measurements_${dateStr}_${timeStr}.xlsx`;

      XLSX.writeFile(wb, fileName, {
        bookType: "xlsx",
        cellStyles: true,
        sheetStubs: false,
        compression: true,
      });
    } catch (error) {
      console.error("Excel Export failed:", error);
      alert("Failed to export Excel file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mt-6 border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Measurement Details
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Style:{" "}
                <span className="font-semibold text-gray-800">
                  {filterCriteria.styleNo}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Wash Type:{" "}
                <span className="font-semibold text-gray-800">
                  {filterCriteria.washType === "beforeWash"
                    ? "Before Wash"
                    : "After Wash"}
                </span>
              </span>
              {filterCriteria.customer && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Customer:{" "}
                  <span className="font-semibold text-gray-800">
                    {filterCriteria.customer}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {isExporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                "Export PDF"
              )}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {isExporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                "Export Excel"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <nav className="flex space-x-1 p-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm border-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              } flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 capitalize border ${
                activeTab === tab ? "border-blue-200" : "border-transparent"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTab === tab ? "bg-blue-500" : "bg-gray-300"
                  }`}
                ></span>
                {tab}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {(measurementGroups[tab] || []).length}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th
                rowSpan="2"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-100"
              >
                <div className="flex items-center gap-2 group">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Measurement Point
                </div>
              </th>
              <th
                colSpan="2"
                className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Tolerance
                </div>
              </th>
              {sizes.map((size) => (
                <th
                  key={size}
                  rowSpan="2"
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    {size}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider border-r border-gray-200 bg-green-50">
                Tol+
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider border-r border-gray-200 bg-red-50">
                Tol-
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentMeasurements.map((item, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition-colors duration-200 group`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 group-hover:text-blue-900">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-normal">
                      {item.seq || index + 1}.
                    </span>
                    {sanitizeMeasurementPoint(item.point)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    +{decimalToFraction(item.tolerancePlus)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    -{decimalToFraction(item.toleranceMinus)}
                  </span>
                </td>
                {sizes.map((size, vIndex) => {
                  const value = item.values?.[vIndex];
                  return (
                    <td
                      key={vIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium ${
                        vIndex < sizes.length - 1
                          ? "border-r border-gray-200"
                          : ""
                      }`}
                    >
                      {value !== undefined &&
                      value !== null &&
                      value !== "N/A" ? (
                        <span className="px-2 py-1 bg-gray-100 rounded group-hover:bg-blue-100 transition-colors">
                          {decimalToFraction(value)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {currentMeasurements.length === 0 && (
              <tr>
                <td colSpan={3 + sizes.length} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-300 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm">
                      No measurements available for this group
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with summary */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
          <span>
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {currentMeasurements.length}
            </span>{" "}
            measurements in{" "}
            <span className="font-semibold text-gray-900 capitalize">
              {activeTab}
            </span>{" "}
            group
          </span>
          <span className="text-xs">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MeasurementSheet;
