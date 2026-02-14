import React from "react";

const TabBar = ({ tabs, activeTab, onTabClick, onCloseTab }) => {
  return (
    <div className="flex border-b">
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`px-4 py-2 cursor-pointer border rounded-md ${
            activeTab === index
              ? "border-b-2 rounded-md  font-bold border-gray-500 bg-blue-200"
              : ""
          }`}
          onClick={() => onTabClick(index)}
        >
          {tab}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(index);
            }}
            className="ml-4 text-gray-900 text-xl font-bold"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar;
