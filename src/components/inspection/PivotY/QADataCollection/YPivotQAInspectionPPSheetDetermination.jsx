import React, { useMemo } from "react";
import YPivotQATemplatesPPSheet from "../QATemplates/YPivotQATemplatesPPSheet";
import { FileText } from "lucide-react";

const YPivotQAInspectionPPSheetDetermination = ({
  orderData,
  selectedOrders,
  inspectionDate,
  savedState,
  onUpdate
}) => {
  // Logic to determine auto-fill data based on Order Tab selection
  const prefilledData = useMemo(() => {
    // 1. Determine Style: Join all selected order numbers with a comma
    const style =
      selectedOrders && selectedOrders.length > 0
        ? selectedOrders.join(", ")
        : "";

    // 2. Determine Qty: Get total quantity from calculated order data
    const qty = orderData?.dtOrder?.totalQty
      ? orderData.dtOrder.totalQty.toString()
      : "";

    // 3. Date comes directly from the picker in Order Tab
    const date = inspectionDate || new Date().toISOString().split("T")[0];

    return {
      style,
      qty,
      date
    };
  }, [orderData, selectedOrders, inspectionDate]);

  if (!orderData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">
          Waiting for Order Data
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-xs mt-2">
          Please select an order in the "Order" tab to generate the PP Sheet
          details.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <YPivotQATemplatesPPSheet
        prefilledData={prefilledData}
        savedState={savedState}
        onDataChange={onUpdate}
      />
    </div>
  );
};

export default YPivotQAInspectionPPSheetDetermination;
