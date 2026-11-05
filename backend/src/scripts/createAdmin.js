
import "dotenv/config";

import bcrypt from "bcryptjs";

import sequelize from "../config/database.js";

import Admin from "../modules/auth/admin.model.js";

const createAdmin = async () => {

    try {

        await sequelize.authenticate();

        const name = process.env.ADMIN_NAME;

        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error("Admin environment variables are missing");
        }

        if (password.length < 12) {
            throw new Error("Password must contain at least 12 characters");
        }

        const existingAdmin = await Admin.findOne({
            where: { email }
        });

        if (existingAdmin) {
            console.log("Admin already exists:", email);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: "super_admin",
            status: "active"
        });

        console.log("Super Admin created successfully!");

    } catch (error) {

        console.error("Error:", error.message);

        process.exitCode = 1;

    } finally {

        await sequelize.close();
    }
};

createAdmin();
