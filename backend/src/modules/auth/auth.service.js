
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Admin from "./admin.model.js";

export const loginAdmin = async (email, password) => {

    // Find admin by email
    const admin = await Admin.findOne({
        where: {
            email: email.trim().toLowerCase()
        }
    });

    if (!admin) {
        throw new Error("Invalid email or password");
    }

    // Check account status
    if (admin.status !== "active") {
        throw new Error("Your admin account is inactive or blocked");
    }

    // Verify password
    const isMatch = await bcrypt.compare(
        password,
        admin.password
    );

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    // Generate JWT
    const token = jwt.sign(
        {
            id: admin.id,
            role: admin.role
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "8h",
            issuer: "bookstore-api",
            audience: "bookstore-admin"
        }
    );

    // Update last login
    await admin.update({
        last_login: new Date()
    });

    return {
        token,
        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        }
    };
};
