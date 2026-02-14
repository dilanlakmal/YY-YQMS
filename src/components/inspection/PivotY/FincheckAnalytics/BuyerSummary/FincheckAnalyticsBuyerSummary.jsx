import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../../config";
import BuyerSummaryFilters from "./BuyerSummaryFilters";
import BuyerSummaryChart from "./BuyerSummaryChart";
import BuyerSummaryTable from "./BuyerSummaryTable";
import BuyerCellDetailModal from "./BuyerCellDetailModal";

const FincheckAnalyticsBuyerSummary = () => {
  // --- State ---
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedBuyers, setSelectedBuyers] = useState([]);
  const [selectedReportTypes, setSelectedReportTypes] = useState([]);

  const [availableBuyers, setAvailableBuyers] = useState([]);
  const [availableReportTypes, setAvailableReportTypes] = useState([]);

  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);

  // --- Initial Load ---
  useEffect(() => {
    handleDefault();
  }, []);

  const getLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const handleDefault = () => {
    const range = getLast7Days();
    setDateRange(range);
    setSelectedBuyers([]);
    setSelectedReportTypes([]);
    fetchData(range.start, range.end, [], []);
  };

  const handleReset = () => {
    setDateRange({ start: "", end: "" });
    setSelectedBuyers([]);
    setSelectedReportTypes([]);
    fetchData("", "", [], []);
  };

  const fetchData = async (start, end, buyers, reportTypes) => {
    setLoading(true);
    try {
      const buyerStr = buyers.length > 0 ? buyers.join(",") : "All";
      const rtStr = reportTypes.length > 0 ? reportTypes.join(",") : "All";

      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/buyer-summary`,
        {
          params: {
            startDate: start,
            endDate: end,
            buyers: buyerStr,
            reportTypes: rtStr,
          },
        },
      );
      if (res.data.success) {
        setAnalyticsData(res.data.data.analytics || []);
        setAvailableBuyers(res.data.data.availableBuyers || []);
        setAvailableReportTypes(res.data.data.availableReportTypes || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on filter change
  useEffect(() => {
    if (dateRange.start || dateRange.end) {
      fetchData(
        dateRange.start,
        dateRange.end,
        selectedBuyers,
        selectedReportTypes,
      );
    }
  }, [dateRange.start, dateRange.end, selectedBuyers, selectedReportTypes]);

  // --- Data Processing ---
  const processedData = useMemo(() => {
    // 1. Generate Date Array
    let dates = [];
    if (dateRange.start && dateRange.end) {
      const s = new Date(dateRange.start);
      const e = new Date(dateRange.end);
      for (let d = s; d <= e; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
      }
    } else {
      const allDates = new Set();
      analyticsData.forEach((buyer) => {
        buyer.reportTypes.forEach((rt) => allDates.add(rt.date));
      });
      dates = Array.from(allDates).sort();
    }

    // 2. Build Table Data
    const tableRows = analyticsData.map((buyer) => {
      const byType = {};
      // Group raw data by report type
      buyer.reportTypes.forEach((rt) => {
        if (!byType[rt.type]) byType[rt.type] = {};
        byType[rt.type][rt.date] = { sample: rt.sample, defects: rt.defects };
      });

      // Calculate "All Report Total"
      const allTypes = { type: "All Report Total", data: {} };
      dates.forEach((d) => {
        let sumSample = 0,
          sumDefects = 0;
        Object.values(byType).forEach((typeObj) => {
          if (typeObj[d]) {
            sumSample += typeObj[d].sample;
            sumDefects += typeObj[d].defects;
          }
        });
        allTypes.data[d] = { sample: sumSample, defects: sumDefects };
      });

      const reportTypeRows = Object.keys(byType)
        .sort()
        .map((type) => ({
          type,
          data: byType[type],
        }));

      // Add Total Row
      reportTypeRows.push(allTypes);

      return { buyer: buyer._id, rows: reportTypeRows };
    });

    return { dates, tableRows };
  }, [analyticsData, dateRange]);

  // --- Actions ---
  const handleCellClick = (buyer, reportType, date) => {
    if (reportType === "All Report Total") return;

    setModalContext({ buyer, reportType, date });
    setIsModalOpen(true);
  };

  const getDynamicTitle = () => {
    const buyersText =
      selectedBuyers.length === 0 ? "All Buyers" : selectedBuyers.join(", ");
    const dateText =
      dateRange.start && dateRange.end
        ? `${dateRange.start} to ${dateRange.end}`
        : "All Time";
    return `Analysis for ${buyersText} (${dateText})`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <BuyerSummaryFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedBuyers={selectedBuyers}
        setSelectedBuyers={setSelectedBuyers}
        availableBuyers={availableBuyers}
        selectedReportTypes={selectedReportTypes}
        setSelectedReportTypes={setSelectedReportTypes}
        availableReportTypes={availableReportTypes}
        onDefault={handleDefault}
        onReset={handleReset}
      />

      <BuyerSummaryChart
        data={analyticsData} // Pass raw data, chart component handles grouping
        dates={processedData.dates}
        selectedBuyers={selectedBuyers}
        availableBuyers={availableBuyers}
        dynamicTitle={getDynamicTitle()}
      />

      <BuyerSummaryTable
        data={processedData.tableRows}
        dates={processedData.dates}
        loading={loading}
        onCellClick={handleCellClick}
      />

      <BuyerCellDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        context={modalContext}
      />
    </div>
  );
};

export default FincheckAnalyticsBuyerSummary;
