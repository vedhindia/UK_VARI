
import jwt from "jsonwebtoken";

import Admin from "./admin.model.js";

// =================================
// VERIFY ADMIN AUTHENTICATION
// =================================

export const verifyAdmin = async (req, res, next) => {

    const token = req.cookies.admin_token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET,
            {
                issuer: "bookstore-api",
                audience: "bookstore-admin"
            }
        );

        // Check current admin in database
        const admin = await Admin.findByPk(decoded.id);

        if (!admin || admin.status !== "active") {
            return res.status(401).json({
                success: false,
                message: "Admin account is not active"
            });
        }

        req.admin = {
            id: admin.id,
            role: admin.role,
            email: admin.email
        };

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired session"
        });
    }
};


// =================================
// SUPER ADMIN PERMISSION
// =================================

export const requireSuperAdmin = (req, res, next) => {

    if (req.admin.role !== "super_admin") {

        return res.status(403).json({
            success: false,
            message: "Only Super Admin can perform this action"
        });
    }

    next();
};
