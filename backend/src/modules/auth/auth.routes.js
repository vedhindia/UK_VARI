
import express from "express";

import {
    adminLogin,
    adminLogout,
    getAdminProfile,
    registerAdmin,
    requestPasswordReset,
    completePasswordReset
} from "./auth.controller.js";

import {
    verifyAdmin,
    requireSuperAdmin
} from "./auth.middleware.js";

const router = express.Router();

// Public login
router.post("/login", adminLogin);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", completePasswordReset);

// Protected routes
router.use(verifyAdmin);

// Current admin profile
router.get("/me", getAdminProfile);

// Logout
router.post("/logout", adminLogout);

// Create additional admin - Super Admin only
router.post(
    "/register",
    requireSuperAdmin,
    registerAdmin
);

export default router;
