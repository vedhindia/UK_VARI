import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { Op } from "sequelize";

import sequelize from "../../config/database.js";
import Admin from "./admin.model.js";
import AdminPasswordReset from "./adminPasswordReset.model.js";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const hashToken = (token) =>
    createHash("sha256").update(token).digest("hex");

const escapeHtml = (value) =>
    value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);

const sendResetEmail = async (admin, token) => {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        SMTP_FROM_EMAIL,
        SMTP_FROM_NAME,
        FRONTEND_URL
    } = process.env;

    const requiredSettings = {
        SMTP_HOST,
        SMTP_USER,
        SMTP_PASS,
        SMTP_FROM_EMAIL,
        FRONTEND_URL
    };
    const missingSettings = Object.entries(requiredSettings)
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missingSettings.length) {
        throw new Error(
            `Missing required password reset settings: ${missingSettings.join(", ")}`
        );
    }

    const port = Number(SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("SMTP_PORT must be a valid port number");
    }

    const resetUrl = new URL("/admin/reset-password", FRONTEND_URL);
    resetUrl.searchParams.set("token", token);
    const safeName = escapeHtml(admin.name);
    const safeUrl = escapeHtml(resetUrl.toString());

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    await transporter.sendMail({
        from: {
            name: SMTP_FROM_NAME || "BookStore Admin",
            address: SMTP_FROM_EMAIL
        },
        to: admin.email,
        subject: "Reset your BookStore admin password",
        text: `Hello ${admin.name},\n\nUse this link to reset your admin password. It expires in 30 minutes and can only be used once:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hello ${safeName},</p><p>Use the link below to reset your admin password. It expires in 30 minutes and can only be used once.</p><p><a href="${safeUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`
    });
};

export const requestAdminPasswordReset = async (email) => {
    const admin = await Admin.findOne({
        where: {
            email: email.trim().toLowerCase(),
            status: "active"
        }
    });

    if (!admin) {
        return;
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    await AdminPasswordReset.destroy({
        where: { admin_id: admin.id }
    });

    await AdminPasswordReset.create({
        admin_id: admin.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS)
    });

    try {
        await sendResetEmail(admin, token);
    } catch (error) {
        await AdminPasswordReset.destroy({
            where: { token_hash: tokenHash }
        });
        throw error;
    }
};

export const resetAdminPassword = async (token, password) => {
    const tokenHash = hashToken(token);
    const now = new Date();

    return sequelize.transaction(async (transaction) => {
        const resetRecord = await AdminPasswordReset.findOne({
            where: {
                token_hash: tokenHash,
                expires_at: { [Op.gt]: now }
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!resetRecord) {
            await AdminPasswordReset.destroy({
                where: { token_hash: tokenHash },
                transaction
            });
            return false;
        }

        const admin = await Admin.findByPk(resetRecord.admin_id, { transaction });
        if (!admin || admin.status !== "active") {
            await resetRecord.destroy({ transaction });
            return false;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await admin.update({ password: hashedPassword }, { transaction });
        await AdminPasswordReset.destroy({
            where: { admin_id: admin.id },
            transaction
        });

        return true;
    });
};
