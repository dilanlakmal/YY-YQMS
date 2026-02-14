import { FileText, List, Package, X } from "lucide-react";
import React from "react";

// Helper to get all unique colors for the pivot table headers
const getUniqueColors = (order) => {
  const colorSet = new Set();
  order.OrderQtyByCountry.forEach((country) => {
    country.ColorQty.forEach((color) => {
      colorSet.add(color.ColorName);
    });
  });
  return Array.from(colorSet).sort();
};

const AdditionalInfoModal = ({ isOpen, onClose, order }) => {
  if (!order) return null;

  const totalOrderQty = order.OrderQtyByCountry.reduce(
    (sum, country) => sum + country.TotalQty,
    0
  );
  const uniqueColors = getUniqueColors(order);

  // A reusable component for section styling
  const Section = ({ icon, title, children }) => (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200">
        {icon}
        <h3 className="text-md font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    // Backdrop with transition
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Modal panel with transition */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-50 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              Order Details
            </h2>
            <div className="text-sm text-slate-500 flex items-center gap-x-3 gap-y-1 flex-wrap">
              <span className="font-medium text-slate-700">
                {order.factory}
              </span>
              <span className="text-slate-300">|</span>
              <span>
                MO: <strong className="text-indigo-600">{order.moNo}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Style: <strong className="text-slate-700">{order.style}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Buyer: <strong className="text-slate-700">{order.buyer}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Total Qty:{" "}
                <strong className="text-slate-700">
                  {totalOrderQty.toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-white">
          <Section
            icon={<FileText className="w-5 h-5 text-indigo-600" />}
            title="SKU Description"
          >
            <p className="text-sm text-slate-700 bg-slate-100 p-4 rounded-md">
              {order.skuDescription}
            </p>
          </Section>

          <Section
            icon={<List className="w-5 h-5 text-indigo-600" />}
            title="SKU Details"
          >
            <div className="overflow-y-auto max-h-72 border border-slate-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    {["SKU", "ETD", "ETA", "PO Line", "Color", "Qty"].map(
                      (header) => (
                        <th
                          key={header}
                          className={`px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider ${
                            header === "Qty" ? "text-right" : "text-left"
                          }`}
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.SKUData.map((sku, index) => (
                    <tr
                      key={index}
                      className="even:bg-slate-50 hover:bg-indigo-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-xs font-semibold whitespace-nowrap text-slate-700">
                        {sku.sku}
                      </td>
                      <td className="px-5 py-3  text-xs whitespace-nowrap text-slate-700">
                        {sku.ETD}
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-slate-700">
                        {sku.ETA}
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-slate-700">
                        {sku.POLine}
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-slate-700">
                        {sku.Color}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right font-medium text-slate-800 font-mono">
                        {sku.Qty.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            icon={<Package className="w-5 h-5 text-indigo-600" />}
            title="Order Quantity by Country & Color"
          >
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="sticky left-0 bg-slate-100 px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="sticky left-[120px] bg-slate-100 px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider border-l border-slate-200">
                      Total Qty
                    </th>
                    {uniqueColors.map((color) => (
                      <th
                        key={color}
                        className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider"
                      >
                        {color}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.OrderQtyByCountry.map((country) => (
                    <tr
                      key={country.CountryID}
                      className="even:bg-slate-50 hover:bg-indigo-50 transition-colors"
                    >
                      <td className="sticky left-0 bg-white even:bg-slate-50 hover:bg-indigo-50 px-5 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {country.CountryID}
                      </td>
                      <td className="sticky left-[120px] bg-white even:bg-slate-50 hover:bg-indigo-50 px-5 py-3 text-right font-semibold text-indigo-700 font-mono border-l border-slate-200">
                        {country.TotalQty.toLocaleString()}
                      </td>
                      {uniqueColors.map((colorName) => {
                        const colorData = country.ColorQty.find(
                          (c) => c.ColorName === colorName
                        );
                        return (
                          <td
                            key={colorName}
                            className="px-5 py-3 text-right font-mono text-slate-700"
                          >
                            {colorData ? (
                              colorData.Qty.toLocaleString()
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoModal;
