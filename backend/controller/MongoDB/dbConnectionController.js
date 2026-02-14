import mongoose from "mongoose";

//Schemas
import createDTOrdersSchema from "../../models/dt_orders.js";

//Auth
import createUserModel from "../../models/User.js";
import createRoleManagmentModel from "../../models/RoleManagment.js";

import createYorksysOrdersModel from "../../models/YorksysOrders.js";

import createQASectionsProductType from "../../models/QA/QASectionsProductType.js";
import createQASectionsHomeModel from "../../models/QA/QASectionsHome.js";
import createQASectionsPhotosModel from "../../models/QA/QASectionsPhotos.js";
import createQASectionsPackingModel from "../../models/QA/QASectionsPacking.js";
import createQASectionsBuyerModel from "../../models/QA/QASectionsBuyer.js";
import createQASectionsDefectListModel from "../../models/QA/QASectionsDefectList.js";
import createQASectionsDefectCategoryModel from "../../models/QA/QASectionsDefectCategory.js";
import createQASectionsProductLocationModel from "../../models/QA/QASectionsProductLocation.js";
import createQASectionsAqlSampleLettersModel from "../../models/QA/QASectionsAqlSampleLetters.js";
import createQASectionsAqlValuesModel from "../../models/QA/QASectionsAqlValues.js";
import createQASectionsAqlBuyerConfigModel from "../../models/QA/QASectionsAqlBuyerConfig.js";
import createQASectionsLineModel from "../../models/QA/QASectionsLine.js";
import createQASectionsTableModel from "../../models/QA/QASectionsTable.js";
import createQASectionsShippingStageModel from "../../models/QA/QASectionsShippingStage.js";

import createQASectionsMeasurementSpecsModel from "../../models/QA/QASectionsMeasurementSpecs.js";

import createQASectionsTemplatesModel from "../../models/QA/QASectionsTemplates.js";

import createFincheckUserPreferencesModel from "../../models/QA/FincheckUserPreferences.js";
import createFincheckInspectionReportsModel from "../../models/QA/FincheckInspectionReports.js";
import createFincheckApprovalAssigneeModel from "../../models/QA/FincheckApprovalAssignee.js";
import createFincheckNotificationGroupModel from "../../models/QA/FincheckNotificationGroupSchema.js";
import createFincheckInspectionDecisionModel from "../../models/QA/fincheck_inspection_decision.js";
import createFincheckPushSubscriptionModel from "../../models/QA/FincheckPushSubscription.js";
import createFincheckAIChatModel from "../../models/QA/FincheckAIChatModel.js";

import createSubconSewingFactoryModel from "../../models/subcon_sewing_factory.js";

import createHumidityFiberNameModel from "../../models/HumidityFiberName.js";

//MongoDB Connections
export const yyProdConnection = mongoose.createConnection(
  process.env.MongoDB_URI_yy_prod,
);

export const yyEcoConnection = mongoose.createConnection(
  process.env.MongoDB_URI_yy_eco_board,
);

//Connection status
yyProdConnection.on("connected", () =>
  console.log("✅ Connected to yyProd database..."),
);
yyProdConnection.on("error", (err) =>
  console.error("❌ unexpected error:", err),
);

yyEcoConnection.on("connected", () =>
  console.log("✅ Connected to yy_eco_board database..."),
);
yyEcoConnection.on("error", (err) =>
  console.error("❌ unexpected error:", err),
);

//Collections
export const DtOrder = createDTOrdersSchema(yyProdConnection);
export const YorksysOrders = createYorksysOrdersModel(yyProdConnection);

//Auth
export const UserMain = createUserModel(yyEcoConnection);
export const RoleManagment = createRoleManagmentModel(yyProdConnection);

export const QASectionsProductType =
  createQASectionsProductType(yyProdConnection);
export const QASectionsHome = createQASectionsHomeModel(yyProdConnection);
export const QASectionsPhotos = createQASectionsPhotosModel(yyProdConnection);
export const QASectionsPacking = createQASectionsPackingModel(yyProdConnection);
export const QASectionsBuyer = createQASectionsBuyerModel(yyProdConnection);
export const QASectionsDefectCategory =
  createQASectionsDefectCategoryModel(yyProdConnection);
export const QASectionsDefectList =
  createQASectionsDefectListModel(yyProdConnection);
export const QASectionsProductLocation =
  createQASectionsProductLocationModel(yyProdConnection);
export const QASectionsAqlSampleLetters =
  createQASectionsAqlSampleLettersModel(yyProdConnection);
export const QASectionsAqlValues =
  createQASectionsAqlValuesModel(yyProdConnection);
export const QASectionsAqlBuyerConfig =
  createQASectionsAqlBuyerConfigModel(yyProdConnection);
export const QASectionsLine = createQASectionsLineModel(yyProdConnection);
export const QASectionsTable = createQASectionsTableModel(yyProdConnection);
export const QASectionsShippingStage =
  createQASectionsShippingStageModel(yyProdConnection);

export const QASectionsMeasurementSpecs =
  createQASectionsMeasurementSpecsModel(yyProdConnection);

export const QASectionsTemplates =
  createQASectionsTemplatesModel(yyProdConnection);

export const FincheckUserPreferences =
  createFincheckUserPreferencesModel(yyProdConnection);
export const FincheckInspectionReports =
  createFincheckInspectionReportsModel(yyProdConnection);
export const FincheckApprovalAssignees =
  createFincheckApprovalAssigneeModel(yyProdConnection);
export const FincheckNotificationGroup =
  createFincheckNotificationGroupModel(yyProdConnection);

export const FincheckInspectionDecision =
  createFincheckInspectionDecisionModel(yyProdConnection);
export const FincheckPushSubscription =
  createFincheckPushSubscriptionModel(yyProdConnection);
export const FincheckAIChat = createFincheckAIChatModel(yyProdConnection);

export const SubconSewingFactory =
  createSubconSewingFactoryModel(yyProdConnection);

export const HumidityFiberName = createHumidityFiberNameModel(yyProdConnection);
