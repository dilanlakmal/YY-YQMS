import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import { Server as SocketIO } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import gracefulFs from "graceful-fs";
gracefulFs.gracefulify(fs);
import dotenv from "dotenv";

export const app = express();
export const PORT = 5002;

//dotenv.config();

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Load .env from root directory (one level up from backend)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Define a base directory for the backend root
export const __backendDir = path.resolve(__dirname, "..");

export const API_BASE_URL = process.env.API_BASE_URL;

const options = {
  key: fs.readFileSync(
    path.resolve(path.dirname(__filename), "192.167.14.235-key.pem"),
  ),
  cert: fs.readFileSync(
    path.resolve(path.dirname(__filename), "192.167.14.235.pem"),
  ),
};

export const server = https.createServer(options, app);

// Initialize Socket.io
export const io = new SocketIO(server, {
  cors: {
    origin: "https://192.167.14.235:3002",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Define allowed origins once
const allowedOrigins = [
  "https://192.167.12.85:3002",
  "http://localhost:3001",
  "https://localhost:3001",
  "https://yqms.yaikh.com",
  "https://192.167.14.235:3002",
];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(null, true); // Allow all origins for image proxy
    }
  },
  methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Origin",
    "X-Requested-With",
    "Accept",
    "Pragma",
    "Expires",
    "Last-Modified",
    "If-Modified-Since",
    "If-None-Match",
    "ETag",
    "Mode",
  ],
  exposedHeaders: [
    "Content-Length",
    "Content-Type",
    "Cache-Control",
    "Last-Modified",
    "ETag",
  ],
  credentials: true, // Set to false for broader compatibility
  optionsSuccessStatus: 204,
};

// Apply CORS globally
app.use(cors(corsOptions));

// Body parser configuration
app.use(bodyParser.json({ limit: "1000mb" }));
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));
app.use(express.json());

// Static file serving with simplified CORS
app.use(
  "/storage",
  express.static(path.join(__backendDir, "public/storage"), {
    setHeaders: (res, path) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Cache-Control", "public, max-age=3600");
    },
  }),
);

app.use(
  "/storage/PivotY",
  express.static(path.join(__backendDir, "storage/PivotY"), {
    setHeaders: (res, path) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Cache-Control", "public, max-age=3600");
    },
  }),
);

app.use(
  "/public",
  express.static(path.join(__backendDir, "public"), {
    setHeaders: (res, path) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Cache-Control", "public, max-age=3600");
    },
  }),
);

// Socket.io connection handler
io.on("connection", (socket) => {
  //console.log("A client connected:", socket.id);

  socket.on("disconnect", () => {
    //console.log("A client disconnected:", socket.id);
  });
});
