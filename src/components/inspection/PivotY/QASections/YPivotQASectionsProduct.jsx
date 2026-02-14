import {
  FileText,
  Layers,
  Users,
  MapPin,
  CheckSquare,
  Image as ImageIcon,
  BookOpen,
  Sliders,
  Factory,
  Grid,
  Ship,
  Scissors,
} from "lucide-react";
import React, { useMemo } from "react";
import YPivotQASectionsProductCategory from "./YPivotQASectionsProductCategory";
import YPivotQASectionsProductTypeManagement from "./YPivotQASectionsProductTypeManagement";
import YPivotQASectionsBuyerManagement from "./YPivotQASectionsBuyerManagement";
import YPivotQASectionsBuyerStatusManagement from "./YPivotQASectionsBuyerStatusManagement";
import YPivotQASectionsProductDefectManagement from "./YPivotQASectionsProductDefectManagement";
import YPivotQASectionsProductLocationManagement from "./YPivotQASectionsProductLocationManagement";
import StyleProductLocationManagement from "./StyleProductLocationManagement";
import YPivotQASectionsAQLTerminology from "./YPivotQASectionsAQLTerminology";
import YPivotQASectionsAQLBuyerConfig from "./YPivotQASectionsAQLBuyerConfig";
import YPivotQASectionsLineConfig from "./YPivotQASectionsLineConfig";
import YPivotQASectionsTableConfig from "./YPivotQASectionsTableConfig";
import YPivotQASectionsShippingStageConfig from "./YPivotQASectionsShippingStageConfig";

// Placeholder components for other tabs
const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] flex flex-col justify-center items-center">
      <div className="mb-4 text-indigo-500 dark:text-indigo-400">
        <Icon size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        This section is under development.
      </p>
    </div>
  );
};

const YPivotQASectionsProduct = ({ activeSubTab, setActiveSubTab }) => {
  const subTabs = useMemo(
    () => [
      {
        id: "buyer",
        label: "Buyer Management",
        icon: <Users size={16} />,
        component: <YPivotQASectionsBuyerManagement />,
      },
      {
        id: "lines",
        label: "Line Management",
        icon: <Factory size={16} />,
        component: <YPivotQASectionsLineConfig />,
      },
      {
        id: "tables",
        label: "Table Management",
        icon: <Grid size={16} />,
        component: <YPivotQASectionsTableConfig />,
      },
      {
        id: "shipping",
        label: "Shipping Stage",
        icon: <Ship size={16} />,
        component: <YPivotQASectionsShippingStageConfig />,
      },
      {
        id: "category",
        label: "Category Management",
        icon: <Layers size={16} />,
        component: <YPivotQASectionsProductCategory />,
      },
      {
        id: "product-type",
        label: "Product Type Management",
        icon: <ImageIcon size={16} />,
        component: <YPivotQASectionsProductTypeManagement />,
      },
      {
        id: "product-location",
        label: "Product Location",
        icon: <MapPin size={16} />,
        component: <YPivotQASectionsProductLocationManagement />,
      },
      {
        id: "style-location",
        label: "Style Location",
        icon: <Scissors size={16} />, // Or any preferred icon
        component: <StyleProductLocationManagement />,
      },
      {
        id: "defect",
        label: "Defect Management",
        icon: <FileText size={16} />,
        component: <YPivotQASectionsProductDefectManagement />,
      },
      {
        id: "buyer-status",
        label: "Buyer Defect Status",
        icon: <CheckSquare size={16} />,
        component: <YPivotQASectionsBuyerStatusManagement />,
      },
      {
        id: "aql-term",
        label: "AQL Terminology",
        icon: <BookOpen size={16} />,
        component: <YPivotQASectionsAQLTerminology />,
      },
      {
        id: "aql-config",
        label: "AQL Config",
        icon: <Sliders size={16} />,
        component: <YPivotQASectionsAQLBuyerConfig />,
      },
    ],
    [],
  );

  const activeComponent = useMemo(() => {
    return subTabs.find((tab) => tab.id === activeSubTab)?.component || null;
  }, [activeSubTab, subTabs]);

  return (
    <div className="space-y-2">
      {/* Sub-tab Content - Navigation removed, now in header */}
      <div>{activeComponent}</div>
    </div>
  );
};

export default YPivotQASectionsProduct;
