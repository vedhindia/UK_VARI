import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import multer from "multer";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const bookImagesDirectory = path.resolve(moduleDirectory, "../../../uploads/books");

fs.mkdirSync(bookImagesDirectory, { recursive: true });

const imageTypes = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
};

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, bookImagesDirectory),
    filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${imageTypes[file.mimetype] || ".img"}`);
    }
});

export const uploadBookImages = multer({
    storage,
    limits: {
        files: 8,
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (_req, file, callback) => {
        if (!imageTypes[file.mimetype]) {
            callback(new Error("Only JPEG, PNG, WebP, or GIF image files are supported."));
            return;
        }
        callback(null, true);
    }
});

export const isValidImageFile = async (file) => {
    const handle = await fs.promises.open(file.path, "r");
    try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        const bytes = header.subarray(0, bytesRead);

        if (file.mimetype === "image/jpeg") {
            return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
        }
        if (file.mimetype === "image/png") {
            return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        }
        if (file.mimetype === "image/gif") {
            return bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6));
        }
        if (file.mimetype === "image/webp") {
            return bytes.length >= 12 &&
                bytes.toString("ascii", 0, 4) === "RIFF" &&
                bytes.toString("ascii", 8, 12) === "WEBP";
        }
        return false;
    } finally {
        await handle.close();
    }
};

export const removeUploadedFiles = async (files = []) => {
    const results = await Promise.allSettled(
        files.map((file) => fs.promises.unlink(file.path))
    );
    results
        .filter((result) => result.status === "rejected" && result.reason?.code !== "ENOENT")
        .forEach((result) => console.error("Unable to remove uploaded image:", result.reason));
};
