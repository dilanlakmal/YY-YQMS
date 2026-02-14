import React from "react";
import {
  Package,
  Globe,
  List,
  Info,
  Hash,
  CalendarClock,
  Layers
} from "lucide-react";

const YorksysOrderPreview = ({ orderData }) => {
  if (
    !orderData ||
    !orderData.skuDetails ||
    orderData.skuDetails.length === 0
  ) {
    return null;
  }

  const {
    buyer,
    factory,
    moNo,
    style,
    season,
    skuDescription,
    fabricContent,
    product,
    destination,
    shipMode,
    currency,
    skuDetails,
    poSummary,
    orderQtyByCountry
  } = orderData;

  const summaryItems = [
    { label: "Factory", value: factory },
    { label: "Buyer", value: buyer },
    { label: "MO No", value: moNo },
    { label: "Style", value: style },
    { label: "Season", value: season },
    { label: "SKU Description", value: skuDescription },
    { label: "Product", value: product },
    { label: "Fabric Content", value: fabricContent },
    { label: "Destination", value: destination },
    { label: "Ship Mode", value: shipMode },
    { label: "Currency", value: currency }
  ];

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 animate-fadeIn">
      {/* --- Header Section --- */}
      <div className="bg-indigo-600 dark:bg-indigo-900/80 px-6 py-4 border-b border-indigo-700 dark:border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Order Preview</h2>
            <p className="text-indigo-100 text-sm font-medium">MO No: {moNo}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* --- Summary Grid --- */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-200">
            <Info className="w-5 h-5 text-indigo-500" />
            <h3 className="text-md font-bold uppercase tracking-wider">
              General Information
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {summaryItems.map((item) => (
              <div key={item.label} className="group">
                <dt className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-1 group-hover:text-indigo-500 transition-colors">
                  {item.label}
                </dt>
                <dd className="text-sm text-gray-800 dark:text-gray-100 font-semibold break-words">
                  {item.value || "-"}
                </dd>
              </div>
            ))}
          </div>
        </div>

        {/* --- PO Summary Table --- */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-200">
            <Layers className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold">PO Summary</h3>
          </div>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    PO #
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    SKUs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    ETD Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    ETA Details
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Colors
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Lines
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {poSummary.map((row) => (
                  <tr
                    key={row.poNo}
                    className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {row.poNo}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                      {row.totalSkus}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {row.etdPeriod}
                      </div>
                      <div className="text-gray-400 dark:text-gray-500">
                        {row.uniqueEtds}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {row.etaPeriod}
                      </div>
                      <div className="text-gray-400 dark:text-gray-500">
                        {row.uniqueEtas}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                      {row.totalColors}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                      {row.totalPoLines}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-100">
                      {row.totalQty.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Order Qty by Country Table --- */}
        {orderQtyByCountry && orderQtyByCountry.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-200">
              <Globe className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold">Order Qty by Country</h3>
            </div>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Country ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Total Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider pl-8">
                      Color
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orderQtyByCountry.map((country, countryIndex) => {
                    const colorItems = country.qtyByColor
                      .split(", ")
                      .map((item) => {
                        const [color, qty] = item.split(": ");
                        return { color, qty };
                      });

                    return colorItems.map((colorItem, colorIndex) => (
                      <tr
                        key={`${country.countryId}-${countryIndex}-${colorIndex}`}
                        className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        {colorIndex === 0 && (
                          <>
                            <td
                              className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400 border-r border-gray-200 dark:border-gray-700 align-top bg-gray-50/50 dark:bg-gray-800/50"
                              rowSpan={colorItems.length}
                            >
                              {country.countryId}
                            </td>
                            <td
                              className="px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 align-top bg-gray-50/50 dark:bg-gray-800/50"
                              rowSpan={colorItems.length}
                            >
                              {country.totalQty.toLocaleString()}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 pl-8 border-l border-gray-100 dark:border-gray-700/50">
                          {colorItem.color}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                          {colorItem.qty}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SKU Details Table --- */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-200">
            <List className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold">SKU Details</h3>
          </div>
          <div className="overflow-y-auto h-[400px] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    SKU #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    ETD
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    ETA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    PO Line
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {skuDetails.map((row, index) => (
                  <tr
                    key={`${row.sku}-${index}`}
                    className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <td className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {row.sku}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <CalendarClock className="w-3 h-3 text-gray-400" />{" "}
                      {row.etd}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {row.eta}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-gray-400" /> {row.poLine}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {row.color}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 text-right font-medium">
                      {row.qty.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YorksysOrderPreview;
