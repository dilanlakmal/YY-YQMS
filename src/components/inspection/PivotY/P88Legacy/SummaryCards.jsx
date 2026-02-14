import React from 'react';

const SummaryCard = ({ title, value, colorClass, icon, bgClass }) => (
  <div className={`relative overflow-hidden rounded-xl ${bgClass} p-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-w-[160px] flex-1`}>
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className={`text-2xl font-bold ${colorClass} mb-2`}>
          {value.toLocaleString()}
        </span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className={`text-xl ${colorClass} opacity-20`}>
        {icon}
      </div>
    </div>
    <div className={`absolute top-0 right-0 w-20 h-20 ${colorClass} opacity-10 rounded-full -mr-10 -mt-10`}></div>
  </div>
);

const SummaryCards = ({ summary }) => {
  if (!summary) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-medium">No inspection data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Data will appear here once inspections are completed</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Inspections",
      value: summary.total || 0,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800",
      icon: "📋"
    },
    {
      title: "Accepted",
      value: summary.passed || 0,
      colorClass: "text-green-600 dark:text-green-400",
      bgClass: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800",
      icon: "✅"
    },
    {
      title: "Reworked",
      value: summary.failed || 0,
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800",
      icon: "❌"
    },
    {
      title: "Pending Approval",
      value: summary.pending || 0,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800",
      icon: "⏳"
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
      {/* Header Section */}
      {/* <div className="flex items-center justify-between mb-8"> */}
        {/* <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            P88 Inspection Summary
          </h2>
          <p className="text-gray-600">
            Overview of all inspection activities and their current status
          </p>
        </div> */}
        {/* <div className="hidden md:block">
          <div className="bg-blue-100 p-3 rounded-full">
            <span className="text-2xl">🔍</span>
          </div>
        </div> */}
      {/* </div> */}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {cards.map((card, index) => (
          <SummaryCard
            key={index}
            title={card.title}
            value={card.value}
            colorClass={card.colorClass}
            bgClass={card.bgClass}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Additional Info */}
      {/* {summary.total > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Success Rate: {((summary.passed / summary.total) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Failure Rate: {((summary.failed / summary.total) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>Completion Rate: {(((summary.passed + summary.failed) / summary.total) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default SummaryCards;
