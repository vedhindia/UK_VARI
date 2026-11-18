
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./modules/auth/auth.routes.js";
import adminOperationsRoutes from "./modules/admin/admin.operations.routes.js";
import storeRoutes from "./modules/store/store.routes.js";
import { listPublicBooks } from "./modules/admin/admin.operations.controller.js";
import { razorpayWebhook } from "./modules/store/store.controller.js";

const app = express();
const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicApiUrl = process.env.API_PUBLIC_URL ||
    process.env.VITE_API_URL ||
    `http://localhost:${process.env.PORT || 5000}`;
const publicApiOrigin = new URL(
    publicApiUrl,
    `http://localhost:${process.env.PORT || 5000}`
).origin;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            imgSrc: ["'self'", "data:", publicApiOrigin]
        }
    }
}));

app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        const allowed = [
            process.env.FRONTEND_URL,
            process.env.ADMIN_URL,
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
        ].filter(Boolean);
        if (allowed.includes(origin)) return callback(null, true);
        // Fallback: allow any localhost origin in development
        if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

// Razorpay webhook must receive the raw body for signature verification,
// so it is registered before the JSON body parser.
app.post("/api/v1/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.resolve(backendDirectory, "../uploads"), {
    dotfiles: "deny",
    index: false,
    maxAge: "1d"
}));

app.use("/api/v1/admin/login", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false
}));

app.use("/api/v1/admin/password", rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false
}));

app.use("/api/v1/admin", adminOperationsRoutes);
app.use("/api/v1/admin", authRoutes);
app.use("/api/v1", storeRoutes);
app.get("/api/v1/books", listPublicBooks);

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        message: "Bookstore API is running",
        adminManagementRoutes: true
    });
});

app.use("/api/v1", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found. Check the URL and restart the backend so it loads the current routes.",
        path: req.originalUrl
    });
});

export default app;
