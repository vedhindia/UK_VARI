import { QueryTypes } from "sequelize";
import sequelize from "../../config/database.js";
import fs from "node:fs/promises";
import path from "node:path";
import { bookImagesDirectory, isValidImageFile, removeUploadedFiles } from "./bookImageUpload.js";

const BOOK_STATUSES = ["active", "inactive"];
const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const CUSTOMER_STATUSES = ["active", "inactive"];
const MAX_BOOK_IMAGES = 8;

const sendError = (res, error, message) => {
    console.error(message, error);
    return res.status(500).json({ success: false, message });
};

const sendBookImagesColumnError = (res, error) => {
    if (error.original?.code === "ER_BAD_FIELD_ERROR") {
        return res.status(500).json({
            success: false,
            message: "The books.images column is missing. Run: ALTER TABLE books ADD COLUMN images JSON NULL;"
        });
    }
    return null;
};

export const getAdminSummary = async (_req, res) => {
    try {
        const rows = await sequelize.query(
            `SELECT
                (SELECT COUNT(*) FROM books WHERE status <> 'archived') AS total_books,
                (SELECT COUNT(*) FROM orders) AS total_orders,
                (SELECT COUNT(*) FROM customers) AS total_customers,
                COALESCE((
                    SELECT JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.currency'))
                    FROM store_settings WHERE setting_key = 'store_profile' LIMIT 1
                ), 'INR') AS currency,
                (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
                    WHERE p.status = 'paid'
                    AND p.currency = COALESCE((
                        SELECT JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.currency'))
                        FROM store_settings WHERE setting_key = 'store_profile' LIMIT 1
                    ), 'INR')) AS total_revenue`,
            { type: QueryTypes.SELECT }
        );
        return res.json({ success: true, summary: rows[0] });
    } catch (error) {
        return sendError(res, error, "Unable to load the dashboard summary.");
    }
};

const isNonNegativeInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;
const isValidPrice = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

const parseBookImages = (storedValue, legacyCover = null) => {
    try {
        const parsed = typeof storedValue === "string" ? JSON.parse(storedValue) : storedValue;
        if (Array.isArray(parsed)) {
            const imageUrls = parsed.filter((url) => typeof url === "string" && url.length > 0);
            if (imageUrls.length) return imageUrls;
        }
    } catch {
        // Existing rows may only have a single cover URL.
    }

    return legacyCover ? [legacyCover] : [];
};

const serializeBook = (book) => {
    const imageUrls = parseBookImages(book.images, book.cover_image_url);
    return {
        ...book,
        cover_image_url: imageUrls[0] || null,
        image_urls: imageUrls
    };
};

const getById = async (table, id, fields = "*", transaction) => {
    const rows = await sequelize.query(
        `SELECT ${fields} FROM ${table} WHERE id = ? LIMIT 1`,
        { replacements: [id], type: QueryTypes.SELECT, transaction }
    );
    return rows[0] || null;
};

export const listBooks = async (_req, res) => {
    try {
        const rows = await sequelize.query(
            "SELECT id, title, author, isbn, category, description, price, stock_quantity, cover_image_url, images, status, created_at, updated_at FROM books ORDER BY created_at DESC, id DESC",
            { type: QueryTypes.SELECT }
        );
        const books = rows.map(serializeBook);
        return res.json({ success: true, books });
    } catch (error) {
        const schemaError = sendBookImagesColumnError(res, error);
        if (schemaError) return schemaError;
        return sendError(res, error, "Unable to load books. Confirm that the bookstore tables have been created.");
    }
};

export const getBook = async (req, res) => {
    try {
        const book = await getById(
            "books",
            req.params.id,
            "id, title, author, isbn, category, description, price, stock_quantity, cover_image_url, images, status, created_at, updated_at"
        );
        if (!book) return res.status(404).json({ success: false, message: "Book not found." });
        return res.json({ success: true, book: serializeBook(book) });
    } catch (error) {
        const schemaError = sendBookImagesColumnError(res, error);
        if (schemaError) return schemaError;
        return sendError(res, error, "Unable to load book details.");
    }
};

export const listBookImages = async (req, res) => {
    try {
        const book = await getById("books", req.params.id, "id, cover_image_url, images");
        if (!book) return res.status(404).json({ success: false, message: "Book not found." });

        const images = parseBookImages(book.images, book.cover_image_url).map((imageUrl, index) => ({
            id: index,
            image_url: imageUrl,
            is_primary: index === 0,
            sort_order: index
        }));
        return res.json({ success: true, images });
    } catch (error) {
        const schemaError = sendBookImagesColumnError(res, error);
        if (schemaError) return schemaError;
        return sendError(res, error, "Unable to load book images.");
    }
};

export const uploadBookImagesForBook = async (req, res) => {
    const files = req.files || [];
    if (!files.length) {
        return res.status(400).json({ success: false, message: "Choose at least one image to upload." });
    }

    try {
        for (const file of files) {
            if (!await isValidImageFile(file)) {
                await removeUploadedFiles(files);
                return res.status(400).json({
                    success: false,
                    message: "One or more files are not valid JPEG, PNG, WebP, or GIF images."
                });
            }
        }

        const result = await sequelize.transaction(async (transaction) => {
            const books = await sequelize.query(
                "SELECT id, cover_image_url, images FROM books WHERE id = ? AND status <> 'archived' FOR UPDATE",
                { replacements: [req.params.id], type: QueryTypes.SELECT, transaction }
            );
            if (!books.length) return null;

            const existingImageUrls = parseBookImages(books[0].images, books[0].cover_image_url);
            if (existingImageUrls.length + files.length > MAX_BOOK_IMAGES) {
                return { error: "image-limit" };
            }
            const uploadedImageUrls = files.map((file) => `/uploads/books/${file.filename}`);
            const imageUrls = [...existingImageUrls, ...uploadedImageUrls];
            const serializedImageUrls = JSON.stringify(imageUrls);
            if (Buffer.byteLength(serializedImageUrls, "utf8") > 65535) {
                return { error: "image-storage-limit" };
            }
            await sequelize.query(
                "UPDATE books SET images = ?, cover_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                { replacements: [serializedImageUrls, imageUrls[0] || null, req.params.id], transaction }
            );

            const images = imageUrls.map((imageUrl, index) => ({
                id: index,
                image_url: imageUrl,
                is_primary: index === 0,
                sort_order: index
            }));
            const book = await getById("books", req.params.id, "*", transaction);
            return { images, book: serializeBook(book) };
        });

        if (!result) {
            await removeUploadedFiles(files);
            return res.status(404).json({ success: false, message: "Book not found or it has been archived." });
        }
        if (result.error === "image-limit") {
            await removeUploadedFiles(files);
            return res.status(400).json({ success: false, message: `A book can have at most ${MAX_BOOK_IMAGES} images.` });
        }
        if (result.error === "image-storage-limit") {
            await removeUploadedFiles(files);
            return res.status(400).json({
                success: false,
                message: "The image paths exceed the database column capacity. Check the books.images JSON column."
            });
        }

        return res.status(201).json({ success: true, ...result });
    } catch (error) {
        await removeUploadedFiles(files);
        const schemaError = sendBookImagesColumnError(res, error);
        if (schemaError) return schemaError;
        return sendError(res, error, "Unable to save book images to the books table.");
    }
};

export const deleteBookImage = async (req, res) => {
    try {
        const result = await sequelize.transaction(async (transaction) => {
            const books = await sequelize.query(
                "SELECT id, cover_image_url, images FROM books WHERE id = ? FOR UPDATE",
                { replacements: [req.params.id], type: QueryTypes.SELECT, transaction }
            );
            if (!books.length) return { error: "book" };

            const imageUrls = parseBookImages(books[0].images, books[0].cover_image_url);
            const imageIndex = Number(req.params.imageId);
            if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= imageUrls.length) {
                return { error: "image" };
            }

            const [removedImageUrl] = imageUrls.splice(imageIndex, 1);
            await sequelize.query(
                "UPDATE books SET images = ?, cover_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                {
                    replacements: [
                        imageUrls.length ? JSON.stringify(imageUrls) : null,
                        imageUrls[0] || null,
                        req.params.id
                    ],
                    transaction
                }
            );
            return {
                images: imageUrls.map((imageUrl, index) => ({
                    id: index,
                    image_url: imageUrl,
                    is_primary: index === 0,
                    sort_order: index
                })),
                removedImageUrl
            };
        });

        if (result.error === "book") return res.status(404).json({ success: false, message: "Book not found." });
        if (result.error === "image") return res.status(404).json({ success: false, message: "Book image not found." });

        if (result.removedImageUrl.startsWith("/uploads/books/")) {
            const fileName = path.basename(result.removedImageUrl);
            try {
                await fs.unlink(path.join(bookImagesDirectory, fileName));
            } catch (error) {
                if (error.code !== "ENOENT") {
                    console.error("Unable to remove deleted book image file:", error);
                }
            }
        }

        return res.json({ success: true, images: result.images });
    } catch (error) {
        const schemaError = sendBookImagesColumnError(res, error);
        if (schemaError) return schemaError;
        return sendError(res, error, "Unable to delete book image.");
    }
};

export const createBook = async (req, res) => {
    const { title, author, isbn, category, description, price, stock_quantity, cover_image_url, status = "active" } = req.body;
    if (!String(title || "").trim() || !String(author || "").trim() || !isValidPrice(price) || !isNonNegativeInteger(stock_quantity) || !BOOK_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Title, author, a non-negative price, non-negative stock quantity, and valid catalog status are required." });
    }

    try {
        const [id] = await sequelize.query(
            "INSERT INTO books (title, author, isbn, category, description, price, stock_quantity, cover_image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            {
                replacements: [
                    String(title).trim(), String(author).trim(),
                    String(isbn || "").trim() || null, String(category || "").trim() || null,
                    String(description || "").trim() || null, Number(price), Number(stock_quantity),
                    String(cover_image_url || "").trim() || null, status
                ],
                type: QueryTypes.INSERT
            }
        );
        const book = await getById("books", id);
        return res.status(201).json({ success: true, book: serializeBook(book) });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError" || error.original?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ success: false, message: "A book with this ISBN already exists." });
        }
        return sendError(res, error, "Unable to create book.");
    }
};

export const updateBook = async (req, res) => {
    const { title, author, isbn, category, description, price, stock_quantity, cover_image_url, status } = req.body;
    if (!String(title || "").trim() || !String(author || "").trim() || !isValidPrice(price) || !isNonNegativeInteger(stock_quantity) || !BOOK_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Provide valid book details, price, stock quantity, and active/inactive status." });
    }

    try {
        const existing = await getById("books", req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Book not found." });

        await sequelize.query(
            "UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, description = ?, price = ?, stock_quantity = ?, cover_image_url = COALESCE(?, cover_image_url), status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status <> 'archived'",
            {
                replacements: [
                    String(title).trim(), String(author).trim(), String(isbn || "").trim() || null,
                    String(category || "").trim() || null, String(description || "").trim() || null,
                    Number(price), Number(stock_quantity), cover_image_url ? String(cover_image_url).trim() : null,
                    status, req.params.id
                ]
            }
        );
        const book = await getById("books", req.params.id);
        return res.json({ success: true, book: serializeBook(book) });
    } catch (error) {
        if (error.original?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ success: false, message: "A book with this ISBN already exists." });
        }
        return sendError(res, error, "Unable to update book.");
    }
};

export const archiveBook = async (req, res) => {
    try {
        const existing = await getById("books", req.params.id, "id, status");
        if (!existing) return res.status(404).json({ success: false, message: "Book not found." });
        await sequelize.query(
            "UPDATE books SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            { replacements: [req.params.id] }
        );
        return res.json({ success: true, message: "Book archived." });
    } catch (error) {
        return sendError(res, error, "Unable to archive book.");
    }
};

export const listInventory = async (_req, res) => {
    try {
        const inventory = await sequelize.query(
            "SELECT id AS book_id, title, author, isbn, stock_quantity, status, updated_at FROM books WHERE status <> 'archived' ORDER BY title",
            { type: QueryTypes.SELECT }
        );
        return res.json({ success: true, inventory });
    } catch (error) {
        return sendError(res, error, "Unable to load inventory.");
    }
};

export const updateInventory = async (req, res) => {
    const { stock_quantity, reason } = req.body;
    if (!isNonNegativeInteger(stock_quantity) || !String(reason || "").trim()) {
        return res.status(400).json({ success: false, message: "A non-negative stock quantity and an adjustment reason are required." });
    }

    try {
        const inventory = await sequelize.transaction(async (transaction) => {
            const books = await sequelize.query(
                "SELECT id, stock_quantity FROM books WHERE id = ? AND status <> 'archived' FOR UPDATE",
                { replacements: [req.params.id], type: QueryTypes.SELECT, transaction }
            );
            if (!books.length) return null;

            const previousQuantity = Number(books[0].stock_quantity);
            const nextQuantity = Number(stock_quantity);
            await sequelize.query(
                "UPDATE books SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                { replacements: [nextQuantity, req.params.id], transaction }
            );
            await sequelize.query(
                "INSERT INTO inventory_adjustments (book_id, admin_id, quantity_change, reason) VALUES (?, ?, ?, ?)",
                {
                    replacements: [req.params.id, req.admin.id, nextQuantity - previousQuantity, String(reason).trim()],
                    transaction
                }
            );
            const rows = await sequelize.query(
                "SELECT id AS book_id, title, author, isbn, stock_quantity, status, updated_at FROM books WHERE id = ?",
                { replacements: [req.params.id], type: QueryTypes.SELECT, transaction }
            );
            return rows[0];
        });

        if (!inventory) return res.status(404).json({ success: false, message: "Inventory record not found." });
        return res.json({ success: true, inventory });
    } catch (error) {
        return sendError(res, error, "Unable to update inventory.");
    }
};

export const listOrders = async (_req, res) => {
    try {
        const orders = await sequelize.query(
            `SELECT o.id, o.order_number, o.customer_id, c.full_name AS customer_name,
                    o.status, o.subtotal, o.shipping_amount, o.total_amount, o.currency,
                    o.created_at, o.updated_at,
                    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
             FROM orders o
             INNER JOIN customers c ON c.id = o.customer_id
             ORDER BY o.created_at DESC, o.id DESC`,
            { type: QueryTypes.SELECT }
        );
        return res.json({ success: true, orders });
    } catch (error) {
        return sendError(res, error, "Unable to load orders.");
    }
};

export const updateOrder = async (req, res) => {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Choose a valid order status." });
    }

    try {
        const existing = await getById("orders", req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Order not found." });
        await sequelize.query(
            "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            { replacements: [status, req.params.id] }
        );
        const rows = await sequelize.query(
            `SELECT o.id, o.order_number, o.customer_id, c.full_name AS customer_name,
                    o.status, o.subtotal, o.shipping_amount, o.total_amount, o.currency,
                    o.created_at, o.updated_at,
                    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
             FROM orders o INNER JOIN customers c ON c.id = o.customer_id WHERE o.id = ?`,
            { replacements: [req.params.id], type: QueryTypes.SELECT }
        );
        return res.json({ success: true, order: rows[0] });
    } catch (error) {
        return sendError(res, error, "Unable to update order.");
    }
};

export const listCustomers = async (_req, res) => {
    try {
        const customers = await sequelize.query(
            `SELECT c.id, c.full_name, c.email, c.phone, c.status, c.created_at, c.updated_at,
                    (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count
             FROM customers c ORDER BY c.created_at DESC, c.id DESC`,
            { type: QueryTypes.SELECT }
        );
        return res.json({ success: true, customers });
    } catch (error) {
        return sendError(res, error, "Unable to load customers.");
    }
};

export const updateCustomer = async (req, res) => {
    const { status } = req.body;
    if (!CUSTOMER_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Choose active or inactive for the customer status." });
    }

    try {
        const existing = await getById("customers", req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Customer not found." });
        await sequelize.query(
            "UPDATE customers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            { replacements: [status, req.params.id] }
        );
        const rows = await sequelize.query(
            `SELECT c.id, c.full_name, c.email, c.phone, c.status, c.created_at, c.updated_at,
                    (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count
             FROM customers c WHERE c.id = ?`,
            { replacements: [req.params.id], type: QueryTypes.SELECT }
        );
        return res.json({ success: true, customer: rows[0] });
    } catch (error) {
        return sendError(res, error, "Unable to update customer.");
    }
};

export const listPayments = async (_req, res) => {
    try {
        const payments = await sequelize.query(
            `SELECT p.id, p.order_id, o.order_number, c.full_name AS customer_name,
                    p.provider, p.provider_reference, p.method, p.amount, p.currency,
                    p.status, p.paid_at, p.created_at
             FROM payments p
             INNER JOIN orders o ON o.id = p.order_id
             INNER JOIN customers c ON c.id = o.customer_id
             ORDER BY p.created_at DESC, p.id DESC`,
            { type: QueryTypes.SELECT }
        );
        return res.json({ success: true, payments });
    } catch (error) {
        return sendError(res, error, "Unable to load payments.");
    }
};

const parseSettingsValue = (value) => {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        throw new Error("Store settings contain invalid JSON.");
    }
};

export const getStoreSettings = async (_req, res) => {
    try {
        const rows = await sequelize.query(
            "SELECT setting_value FROM store_settings WHERE setting_key = 'store_profile' LIMIT 1",
            { type: QueryTypes.SELECT }
        );
        if (!rows.length) return res.status(404).json({ success: false, message: "Store settings are missing. Run the provided schema SQL, including its default settings row." });
        return res.json({ success: true, settings: parseSettingsValue(rows[0].setting_value) });
    } catch (error) {
        return sendError(res, error, "Unable to load store settings.");
    }
};

export const updateStoreSettings = async (req, res) => {
    const { store_name, support_email, support_phone, currency, tax_rate, low_stock_threshold } = req.body;
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(support_email || ""));
    const normalizedCurrency = String(currency || "").trim().toUpperCase();
    if (!String(store_name || "").trim() || !emailIsValid || !/^[A-Z]{3}$/.test(normalizedCurrency) ||
        !isValidPrice(tax_rate) || Number(tax_rate) > 100 || !isNonNegativeInteger(low_stock_threshold)) {
        return res.status(400).json({ success: false, message: "Enter a store name, valid support email and currency, tax between 0 and 100, and a non-negative stock threshold." });
    }

    const settings = {
        store_name: String(store_name).trim(),
        support_email: String(support_email).trim().toLowerCase(),
        support_phone: String(support_phone || "").trim(),
        currency: normalizedCurrency,
        tax_rate: Number(tax_rate),
        low_stock_threshold: Number(low_stock_threshold)
    };

    try {
        await sequelize.query(
            `INSERT INTO store_settings (setting_key, setting_value)
             VALUES ('store_profile', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
            { replacements: [JSON.stringify(settings)] }
        );
        return res.json({ success: true, settings });
    } catch (error) {
        return sendError(res, error, "Unable to save store settings.");
    }
};
