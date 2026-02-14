/* ------------------------------
   Import Required Libraries/Models
------------------------------ */

import { app, server, PORT } from "./Config/appConfig.js";

/* -----------------------------
  User Imports
------------------------------ */
import auth from "./routes/User/authRoutes.js";
import roleManagement from "./routes/User/roleManagementRoutes.js";
import user from "./routes/User/userRoutes.js";

/* ------------------------------
   SQL Query Import
/------------------------------ */

// import sqlQuery from "./routes/SQL/sqlQueryRoutes.js";
// import { closeSQLPools } from "./controller/SQL/sqlQueryController.js";

/* -----------------------------
Common File Imports
------------------------------ */

import dtOrders from "./routes/Common/DTOrdersRoutes.js";

/* -----------------------------
Measurement Imports
------------------------------ */
import measurement from "./routes/Measurement/measurementRoutes.js";

/* ------------------------------
  PivotY - QA Sections
------------------------------ */

import QASections_ProductType from "./routes/PivotY/QASections/QASections_ProductType_Route.js";
import QASections_Home from "./routes/PivotY/QASections/QASections_Home_Route.js";
import QASections_Photos from "./routes/PivotY/QASections/QASections_Photos_Route.js";
import QASections_Packing from "./routes/PivotY/QASections/QASections_Packing_Route.js";
import QASections_Buyer from "./routes/PivotY/QASections/QASections_Buyer_Route.js";
import QASections_DefectList from "./routes/PivotY/QASections/QASections_DefectList_Route.js";
import QASections_DefectCategory from "./routes/PivotY/QASections/QASections_DefectCategory_Route.js";
import QASections_ProductLocation from "./routes/PivotY/QASections/QASections_ProductLocation_Route.js";
import QASections_AQL_Sample_Letters from "./routes/PivotY/QASections/QASections_AQL_Sample_Letter_Route.js";
import QASections_AQL_Values from "./routes/PivotY/QASections/QASections_AQL_Values_Route.js";
import QASections_AQL_Config from "./routes/PivotY/QASections/QASections_AQL_Config_Routes.js";
import QASections_Line from "./routes/PivotY/QASections/QASections_Line_Route.js";
import QASections_Table from "./routes/PivotY/QASections/QASections_Table_Route.js";
import QASections_Shipping_Stage from "./routes/PivotY/QASections/QASections_Shipping_Stage_Route.js";

/* ------------------------------
  PivotY - QA Measurement Specs
------------------------------ */

import QASections_Measurement_Specs from "./routes/PivotY/QASections/QASections_Measurement_Specs_Route.js";
// import ModifyDTSpec from "./routes/PivotY/QASections/DTModify/DTModifyRoutes.js";

/* ------------------------------
  PivotY - QA Templates
------------------------------ */
import QASections_Templates from "./routes/PivotY/QATemplates/QATemplatesReport_Route.js";

/* ------------------------------
PivotY - Fincheck Inspection
------------------------------ */
import FincheckInspection from "./routes/PivotY/FincheckInspection/FincheckInspection_Route.js";
import FincheckInspection_Report from "./routes/PivotY/FincheckInspection/FincheckInspection_Report_Route.js";
import FincheckInspection_Approval from "./routes/PivotY/FincheckInspection/FincheckInspection_Approval_Route.js";
import FincheckNotificationGroup from "./routes/PivotY/FincheckInspection/FincheckNotificationGroup_Routes.js";
import FincheckAIRoutes from "./routes/PivotY/AI/FincheckAIRoutes.js";

/* ------------------------------
PivotY - Fincheck Analytics
------------------------------ */
import FincheckAnalyticsReport from "./routes/PivotY/FincheckAnalytics/FincheckAnalytics_Routes.js";

/* ------------------------------
 P88 Data Upoad Routes
------------------------------ */
// import p88Upload from "./routes/PivotY/P88Data/uploadP88DataRoutes.js";
// import p88Summarydata from "./routes/PivotY/P88Data/summaryP88DataRoutes.js";
// import downloadP88Report from "./routes/PivotY/P88Data/downloadP88ReportRoutes.js";
// import p88failedReports from "./routes/PivotY/P88Data/p88failedReportsRoutes.js";

/* ------------------------------
  Yorksys Orders
------------------------------ */

import YorksysOrders from "./routes/YorksysOrders/uploadOrderRoutes.js";
import FiberNameRoute from "./routes/YorksysOrders/FIberNameRoute.js";

/* ------------------------------
  Sub Con QC1 Inspection
------------------------------ */

import subConSewingQCFactory from "./routes/Sub-ConQC1/Sub-ConQC1 Admin/subConSewingQCFactoryRoutes.js";

/* ------------------------------
  Sub Con QC1 Inspection
------------------------------ */

/* -----------------------------
  User Routes
------------------------------ */
app.use(auth);
app.use(roleManagement);
app.use(user);

/* ------------------------------
  SQL Query routes start
------------------------------ */
// app.use(sqlQuery);

/* -----------------------------
Commin file  Routes
------------------------------ */
app.use(dtOrders);

/* -----------------------------
Measurement Routes
------------------------------ */
app.use(measurement);

/* ------------------------------
  PivotY - QA Sections routes
------------------------------ */

app.use(QASections_ProductType);
app.use(QASections_Home);
app.use(QASections_Photos);
app.use(QASections_Packing);
app.use(QASections_Buyer);
app.use(QASections_DefectList);
app.use(QASections_DefectCategory);
app.use(QASections_ProductLocation);
app.use(QASections_AQL_Sample_Letters);
app.use(QASections_AQL_Values);
app.use(QASections_AQL_Config);
app.use(QASections_Line);
app.use(QASections_Table);
app.use(QASections_Shipping_Stage);

/* ------------------------------
  PivotY - QA Measurements routes
------------------------------ */
app.use(QASections_Measurement_Specs);
// app.use(ModifyDTSpec);

/* ------------------------------
  PivotY - QA Templates routes
------------------------------ */
app.use(QASections_Templates);

/* ------------------------------
PivotY - Fincheck Inspection routes
------------------------------ */
app.use(FincheckInspection);
app.use(FincheckInspection_Report);
app.use(FincheckInspection_Approval);
app.use(FincheckNotificationGroup);
app.use(FincheckAIRoutes);

/* ------------------------------
PivotY - Fincheck Analytics
------------------------------ */
app.use(FincheckAnalyticsReport);

/* ------------------------------
 P88 Data Upoad Routes
------------------------------ */
// app.use(p88Upload);
// app.use(p88Summarydata);
// app.use(downloadP88Report);
// app.use(p88failedReports);

/* ------------------------------
  Yorksys Orders routes
------------------------------ */
app.use(YorksysOrders);
app.use(FiberNameRoute);

/* ------------------------------
  Sub Con QC1 Inspection routes
------------------------------ */
app.use(subConSewingQCFactory);

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

/* ------------------------------
   Graceful Shutdown
------------------------------ */

// process.on("SIGINT", async () => {
//   try {
//     await closeSQLPools();
//     console.log("SQL connection pools closed.");
//   } catch (err) {
//     console.error("Error closing SQL connection pools:", err);
//   } finally {
//     process.exit(0);
//   }
// });

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server is running on PORT:${PORT}`);
});
