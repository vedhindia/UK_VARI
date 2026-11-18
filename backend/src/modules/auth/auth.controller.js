
import bcrypt from "bcryptjs";

import Admin from "./admin.model.js";

import { loginAdmin } from "./auth.service.js";
import {
    requestAdminPasswordReset,
    resetAdminPassword
} from "./passwordReset.service.js";

// Cookie configuration
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/admin"
};

// =================================
// ADMIN LOGIN
// =================================

export const adminLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const result = await loginAdmin(
            email,
            password
        );

        res.cookie(
            "admin_token",
            result.token,
            {
                ...cookieOptions,
                maxAge: 8 * 60 * 60 * 1000
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            admin: result.admin
        });

    } catch (error) {

        console.error("ADMIN LOGIN ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const requestPasswordReset = async (req, res) => {
    const { email } = req.body || {};

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address"
        });
    }

    try {
        await requestAdminPasswordReset(email);
        return res.status(202).json({
            success: true,
            message: "If an active admin account matches that email, password reset instructions will be sent."
        });
    } catch (error) {
        console.error("ADMIN PASSWORD RESET REQUEST ERROR:", error.message);
        return res.status(503).json({
            success: false,
            message: "Password reset email service is unavailable. Please try again later."
        });
    }
};

export const completePasswordReset = async (req, res) => {
    const { token, password } = req.body || {};

    if (typeof token !== "string" || !token || typeof password !== "string") {
        return res.status(400).json({
            success: false,
            message: "A reset token and new password are required"
        });
    }

    if (password.length < 12) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 12 characters"
        });
    }

    try {
        const wasReset = await resetAdminPassword(token, password);
        if (!wasReset) {
            return res.status(400).json({
                success: false,
                message: "This password reset link is invalid or has expired. Please request a new one."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password updated. You can now sign in with your new password."
        });
    } catch (error) {
        console.error("ADMIN PASSWORD RESET ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to reset the password right now. Please try again later."
        });
    }
};


// =================================
// ADMIN LOGOUT
// =================================

export const adminLogout = (req, res) => {

    res.clearCookie(
        "admin_token",
        cookieOptions
    );

    return res.json({
        success: true,
        message: "Logged out successfully"
    });
};


// =================================
// GET ADMIN PROFILE
// =================================

export const getAdminProfile = async (req, res) => {

    try {

        const admin = await Admin.findByPk(
            req.admin.id,
            {
                attributes: [
                    "id",
                    "name",
                    "email",
                    "phone",
                    "role",
                    "status",
                    "last_login"
                ]
            }
        );

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        return res.json({
            success: true,
            admin
        });

    } catch (error) {

        console.error("PROFILE ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch admin profile"
        });
    }
};


// =================================
// CREATE NEW ADMIN
// Super Admin only
// =================================

export const registerAdmin = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone,
            role
        } = req.body;

        // Required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Validate email
        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email"
            });
        }

        // Password validation
        if (password.length < 12) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 12 characters"
            });
        }

        // Restrict assignable roles
        const allowedRoles = ["admin"];

        const selectedRole = role || "admin";

        if (!allowedRoles.includes(selectedRole)) {
            return res.status(400).json({
                success: false,
                message: "You cannot assign this role"
            });
        }

        // Check existing email
        const existingAdmin = await Admin.findOne({
            where: {
                email: normalizedEmail
            }
        });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        // Create admin
        const newAdmin = await Admin.create({

            name: name.trim(),

            email: normalizedEmail,

            password: hashedPassword,

            phone: phone || null,

            role: selectedRole,

            status: "active"

        });

        return res.status(201).json({
            success: true,
            message: "Admin account created successfully",

            admin: {
                id: newAdmin.id,
                name: newAdmin.name,
                email: newAdmin.email,
                phone: newAdmin.phone,
                role: newAdmin.role,
                status: newAdmin.status
            }
        });

    } catch (error) {

        console.error("ADMIN REGISTRATION ERROR:", error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create admin account"
        });
    }
};
