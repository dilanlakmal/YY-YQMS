import {
  AlertTriangle,
  CheckCircle,
  FileText,
  FileUp,
  Loader,
  Save,
  XCircle,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { read, utils } from "xlsx";
import { API_BASE_URL } from "../../config";
import { cleanYorksysOrderData } from "../components/inspection/qa-pivot/YorksysOrderClean";
import YorksysOrderPreview from "../components/inspection/qa-pivot/YorksysOrderPreview";
import YorksysOrdersView from "../components/inspection/qa-pivot/YorksysOrdersView";
import YorksysProductTypeView from "../components/inspection/qa-pivot/YorksysProductTypeView";
import YorkSysOrdersRibContentSave from "../components/inspection/qa-pivot/YorkSysOrdersRibContentSave";

const UploadYorksysOrders = ({ activeSubTab }) => {
  // --- State for Upload Logic ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: "", type: "" });
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setOrderData(null);
    setError("");
    setSaveStatus({ message: "", type: "" });
  };

  const processFile = (file) => {
    if (
      file &&
      (file.type === "application/vnd.ms-excel" || file.name.endsWith(".xls"))
    ) {
      setSelectedFile(file);
      resetState();
    } else {
      setError("Invalid file type. Please upload a .xls file.");
      setSelectedFile(null);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const handleDragEvents = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    handleDragEvents(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handlePreview = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a .xls file first.");
      return;
    }

    setIsLoading(true);
    resetState();

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const workbook = read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json_data = utils.sheet_to_json(worksheet);
          const cleanedData = cleanYorksysOrderData(json_data);
          setOrderData(cleanedData);
        } catch (e) {
          console.error("Parsing Error:", e);
          setError(
            e.message ||
              "Failed to parse the Excel file. Please check the format and column names.",
          );
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader Error:", err);
        setError("Failed to read the file.");
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (e) {
      console.error("General Error:", e);
      setError(e.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }, [selectedFile]);

  // --- Data Transformation Logic ---
  const transformOrderDataForSave = (data) => {
    const parseFabricContent = (fabricContentStr) => {
      if (!fabricContentStr || fabricContentStr === "N/A") return [];
      return fabricContentStr.split(",").map((item) => {
        const parts = item.trim().split(":");
        const fabricName = parts[0]?.trim() || "";
        const percentageStr = parts[1]?.trim().replace("%", "") || "0";
        const percentageValue = parseInt(percentageStr, 10) || 0;
        return { fabricName, percentageValue };
      });
    };

    const transformMOSummary = (poSummary) => {
      if (!poSummary || poSummary.length === 0) return [];
      return poSummary.map((po) => ({
        TotalSku: po.totalSkus || 0,
        AllETD: po.uniqueEtds ? po.uniqueEtds.split(", ") : [],
        AllETA: po.uniqueEtas ? po.uniqueEtas.split(", ") : [],
        ETDPeriod: po.etdPeriod || "N/A",
        ETAPeriod: po.etaPeriod || "N/A",
        TotalColors: po.totalColors || 0,
        TotalPos: po.totalPoLines || 0,
        TotalQty: po.totalQty || 0,
      }));
    };

    const transformSKUData = (skuDetails) => {
      if (!skuDetails || skuDetails.length === 0) return [];
      return skuDetails.map((sku) => ({
        sku: sku.sku || "",
        ETD: sku.etd || "",
        ETA: sku.eta || "",
        POLine: sku.poLine || "",
        Color: sku.color || "",
        Qty: sku.qty || 0,
      }));
    };

    const transformOrderQtyByCountry = (orderQtyByCountry) => {
      if (!orderQtyByCountry || orderQtyByCountry.length === 0) return [];
      return orderQtyByCountry.map((country) => {
        const colorQtyArray =
          country.qtyByColor && country.qtyByColor !== "N/A"
            ? country.qtyByColor.split(", ").map((item) => {
                const [colorName, qty] = item.split(": ");
                return {
                  ColorName: colorName?.trim() || "",
                  Qty: parseInt(qty?.replace(/,/g, ""), 10) || 0,
                };
              })
            : [];
        return {
          CountryID: country.countryId || "",
          TotalQty: country.totalQty || 0,
          ColorQty: colorQtyArray,
        };
      });
    };

    return {
      buyer: data.buyer || "N/A",
      factory: data.factory || "N/A",
      moNo: data.moNo || "N/A",
      season: data.season || "N/A",
      style: data.style || "N/A",
      product: data.product || "N/A",
      destination: data.destination || "N/A",
      shipMode: data.shipMode || "N/A",
      currency: data.currency || "N/A",
      skuDescription: data.skuDescription || "N/A",
      FabricContent: parseFabricContent(data.fabricContent),
      MOSummary: transformMOSummary(data.poSummary),
      SKUData: transformSKUData(data.skuDetails),
      OrderQtyByCountry: transformOrderQtyByCountry(data.orderQtyByCountry),
    };
  };

  const handleSave = async () => {
    if (!orderData) {
      setError("No data to save. Please preview a file first.");
      return;
    }
    setIsSaving(true);
    setSaveStatus({ message: "", type: "" });
    setError("");

    try {
      const transformedData = transformOrderDataForSave(orderData);
      const response = await fetch(`${API_BASE_URL}/api/yorksys-orders/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to save data.");
      }
      setSaveStatus({
        message: result.message || "Order saved successfully!",
        type: "success",
      });
      setOrderData(null); // This hides the Preview window
      setSelectedFile(null); // This clears the file selection state
    } catch (err) {
      console.error("Save Error:", err);
      setSaveStatus({ message: err.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Content Rendering based on SubTab ---
  return (
    <div className="animate-fadeIn">
      {activeSubTab === "upload" && (
        <>
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6 transition-colors duration-300">
            <div className="flex flex-col gap-4">
              <label
                htmlFor="file-upload"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragEvents}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full px-4 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-full mb-3">
                  <FileUp className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Yorksys Orders | Drag & drop your .xls file here
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse from your computer
                </span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xls"
                  onChange={handleFileChange}
                />
              </label>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Selected File:{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {selectedFile.name}
                    </span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                <button
                  onClick={handlePreview}
                  disabled={!selectedFile || isLoading || isSaving}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm disabled:bg-indigo-300 dark:disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" /> Preview
                    </>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!orderData || isLoading || isSaving}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm disabled:bg-green-300 dark:disabled:bg-green-900/50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" /> Save
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg animate-fadeIn">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}
            {saveStatus.message && (
              <div
                className={`mt-6 flex items-center p-4 rounded-lg border animate-fadeIn ${
                  saveStatus.type === "success"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                }`}
              >
                {saveStatus.type === "success" ? (
                  <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                )}
                <span className="font-medium">{saveStatus.message}</span>
              </div>
            )}
          </div>
          {orderData && <YorksysOrderPreview orderData={orderData} />}
        </>
      )}

      {activeSubTab === "view" && (
        <div className="max-w-8xl mx-auto">
          <YorksysOrdersView />
        </div>
      )}

      {activeSubTab === "productType" && (
        <div className="max-w-8xl mx-auto">
          <YorksysProductTypeView />
        </div>
      )}

      {/* SUB TAB FOR RIB CONTENT */}
      {activeSubTab === "ribContent" && (
        <div className="max-w-8xl mx-auto">
          <YorkSysOrdersRibContentSave />
        </div>
      )}
    </div>
  );
};

export default UploadYorksysOrders;
