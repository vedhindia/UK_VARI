
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./modules/auth/auth.routes.js";
import adminOperationsRoutes from "./modules/admin/admin.operations.routes.js";
import { listPublicBooks } from "./modules/admin/admin.operations.controller.js";

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
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

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

app.use("/api/v1/admin", adminOperationsRoutes);
app.use("/api/v1/admin", authRoutes);
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
