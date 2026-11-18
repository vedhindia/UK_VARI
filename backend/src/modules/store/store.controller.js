import crypto from "node:crypto";
import Razorpay from "razorpay";
import { QueryTypes } from "sequelize";
import sequelize from "../../config/database.js";

/* ------------------------------------------------------------------ */
/* Razorpay client                                                     */
/* ------------------------------------------------------------------ */

let razorpayClient = null;

const getRazorpayClient = () => {
    if (!razorpayClient) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return null;
        }
        razorpayClient = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpayClient;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sendError = (res, error, message, status = 500) => {
    console.error(message, error);
    return res.status(status).json({ success: false, message });
};

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const generateOrderNumber = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${yyyy}${mm}${dd}${hh}${mi}${ss}-${rand}`;
};

const getStoreSettings = async (transaction) => {
    const rows = await sequelize.query(
        "SELECT setting_value FROM store_settings WHERE setting_key = 'store_profile' LIMIT 1",
        { type: QueryTypes.SELECT, transaction }
    );
    if (!rows.length) {
        return { currency: "INR", tax_rate: 0 };
    }
    try {
        const parsed = JSON.parse(rows[0].setting_value);
        return {
            currency: parsed.currency || "INR",
            tax_rate: Number(parsed.tax_rate) || 0
        };
    } catch {
        return { currency: "INR", tax_rate: 0 };
    }
};

const parseBookImages = (storedValue, legacyCover = null) => {
    try {
        const parsed = typeof storedValue === "string" ? JSON.parse(storedValue) : storedValue;
        if (Array.isArray(parsed)) {
            const imageUrls = parsed.filter((url) => typeof url === "string" && url.length > 0);
            if (imageUrls.length) return imageUrls;
        }
    } catch {
        // ignore
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

/* ------------------------------------------------------------------ */
/* Public: get single book                                             */
/* ------------------------------------------------------------------ */

export const getPublicBook = async (req, res) => {
    try {
        const rows = await sequelize.query(
            "SELECT id, title, author, category, description, price, stock_quantity, cover_image_url, images FROM books WHERE id = ? AND status = 'active' LIMIT 1",
            { replacements: [req.params.id], type: QueryTypes.SELECT }
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Book not found." });
        }
        return res.json({ success: true, book: serializeBook(rows[0]) });
    } catch (error) {
        return sendError(res, error, "Unable to load book details.");
    }
};

/* ------------------------------------------------------------------ */
/* Public: create order + Razorpay order                               */
/* ------------------------------------------------------------------ */

export const createOrder = async (req, res) => {
    const { book_id, quantity, full_name, email, phone, address } = req.body;

    if (!isPositiveInteger(book_id) || !isPositiveInteger(quantity)) {
        return res.status(400).json({
            success: false,
            message: "A valid book and a positive quantity are required."
        });
    }
    if (!String(full_name || "").trim() || !isValidEmail(email) || !String(phone || "").trim()) {
        return res.status(400).json({
            success: false,
            message: "Full name, a valid email, and a phone number are required."
        });
    }

    // Fail fast: Razorpay must be configured before we touch the database
    if (!getRazorpayClient()) {
        return res.status(500).json({
            success: false,
            message: "Razorpay is not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
        });
    }

    try {
        const result = await sequelize.transaction(async (transaction) => {
            // 1. Load book (lock for stock check)
            const books = await sequelize.query(
                "SELECT id, title, author, price, stock_quantity, cover_image_url FROM books WHERE id = ? AND status = 'active' FOR UPDATE",
                { replacements: [book_id], type: QueryTypes.SELECT, transaction }
            );
            if (!books.length) {
                return { error: "book-not-found" };
            }
            const book = books[0];
            const qty = Number(quantity);
            if (Number(book.stock_quantity) < qty) {
                return { error: "out-of-stock", stock: book.stock_quantity };
            }

            // 2. Store settings (currency + tax)
            const settings = await getStoreSettings(transaction);
            const unitPrice = Number(book.price);
            const subtotal = +(unitPrice * qty).toFixed(2);
            const tax = +(subtotal * (settings.tax_rate / 100)).toFixed(2);
            const shipping = 0;
            const total = +(subtotal + tax + shipping).toFixed(2);

            // 3. Upsert customer by email
            const existingCustomers = await sequelize.query(
                "SELECT id FROM customers WHERE email = ? LIMIT 1",
                { replacements: [String(email).trim().toLowerCase()], type: QueryTypes.SELECT, transaction }
            );

            let customerId;
            if (existingCustomers.length) {
                customerId = existingCustomers[0].id;
                await sequelize.query(
                    "UPDATE customers SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    {
                        replacements: [String(full_name).trim(), String(phone).trim(), customerId],
                        transaction
                    }
                );
            } else {
                const [insertedId] = await sequelize.query(
                    "INSERT INTO customers (full_name, email, phone, status) VALUES (?, ?, ?, 'active')",
                    {
                        replacements: [
                            String(full_name).trim(),
                            String(email).trim().toLowerCase(),
                            String(phone).trim()
                        ],
                        type: QueryTypes.INSERT,
                        transaction
                    }
                );
                customerId = insertedId;
            }

            // 4. Create order (shipping_address must be valid JSON per table constraint)
            const orderNumber = generateOrderNumber();
            const shippingAddressJson = address ? JSON.stringify({ text: String(address).trim() }) : null;
            const [orderId] = await sequelize.query(
                "INSERT INTO orders (order_number, customer_id, status, subtotal, shipping_amount, total_amount, currency, shipping_address) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)",
                {
                    replacements: [orderNumber, customerId, subtotal, shipping, total, settings.currency, shippingAddressJson],
                    type: QueryTypes.INSERT,
                    transaction
                }
            );

            // 5. Order items
            await sequelize.query(
                "INSERT INTO order_items (order_id, book_id, book_title, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)",
                {
                    replacements: [orderId, book.id, book.title, qty, unitPrice, subtotal],
                    type: QueryTypes.INSERT,
                    transaction
                }
            );

            // 6. Create Razorpay order (amount in smallest currency unit, e.g. paise for INR)
            const client = getRazorpayClient();
            const amountInSmallestUnit = Math.round(total * 100);
            const razorpayOrder = await client.orders.create({
                amount: amountInSmallestUnit,
                currency: settings.currency,
                receipt: orderNumber,
                notes: {
                    order_id: String(orderId),
                    book_title: book.title
                }
            });

            // 7. Create payment record (pending)
            await sequelize.query(
                "INSERT INTO payments (order_id, provider, provider_reference, amount, currency, status) VALUES (?, 'razorpay', ?, ?, ?, 'pending')",
                {
                    replacements: [orderId, razorpayOrder.id, total, settings.currency],
                    type: QueryTypes.INSERT,
                    transaction
                }
            );

            return {
                orderId,
                orderNumber,
                razorpayOrderId: razorpayOrder.id,
                amount: total,
                amountInSmallestUnit,
                currency: settings.currency,
                customerId,
                book: {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    price: unitPrice,
                    cover_image_url: book.cover_image_url
                },
                quantity: qty,
                subtotal,
                tax,
                shipping
            };
        });

        if (result.error === "book-not-found") {
            return res.status(404).json({ success: false, message: "Book not found or is no longer available." });
        }
        if (result.error === "out-of-stock") {
            return res.status(400).json({
                success: false,
                message: `Only ${result.stock} copy/copies are available in stock.`
            });
        }

        return res.status(201).json({
            success: true,
            order_id: result.orderId,
            order_number: result.orderNumber,
            razorpay_order_id: result.razorpayOrderId,
            amount: result.amount,
            amount_in_smallest_unit: result.amountInSmallestUnit,
            currency: result.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            book: result.book,
            quantity: result.quantity,
            summary: {
                subtotal: result.subtotal,
                tax: result.tax,
                shipping: result.shipping,
                total: result.amount
            }
        });
    } catch (error) {
        return sendError(res, error, "Unable to create the order. Please try again.");
    }
};

/* ------------------------------------------------------------------ */
/* Public: verify Razorpay payment signature                           */
/* ------------------------------------------------------------------ */

export const verifyPayment = async (req, res) => {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
            success: false,
            message: "Payment verification details are incomplete."
        });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
            success: false,
            message: "Razorpay secret is not configured on the server."
        });
    }

    try {
        // Verify signature: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const signatureValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(String(razorpay_signature))
        );

        if (!signatureValid) {
            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed."
            });
        }

        const result = await sequelize.transaction(async (transaction) => {
            // Load order + payment
            const orders = await sequelize.query(
                "SELECT id, order_number, total_amount, currency FROM orders WHERE id = ? LIMIT 1",
                { replacements: [order_id], type: QueryTypes.SELECT, transaction }
            );
            if (!orders.length) return { error: "order-not-found" };
            const order = orders[0];

            const payments = await sequelize.query(
                "SELECT id FROM payments WHERE order_id = ? AND provider = 'razorpay' AND provider_reference = ? LIMIT 1",
                { replacements: [order_id, razorpay_order_id], type: QueryTypes.SELECT, transaction }
            );
            if (!payments.length) return { error: "payment-not-found" };

            // Mark payment as paid
            await sequelize.query(
                "UPDATE payments SET status = 'paid', method = 'razorpay', provider_reference = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                { replacements: [razorpay_payment_id, payments[0].id], transaction }
            );

            // Mark order as confirmed
            await sequelize.query(
                "UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                { replacements: [order_id], transaction }
            );

            // Decrement stock
            await sequelize.query(
                "UPDATE books b INNER JOIN order_items oi ON oi.book_id = b.id SET b.stock_quantity = b.stock_quantity - oi.quantity, b.updated_at = CURRENT_TIMESTAMP WHERE oi.order_id = ?",
                { replacements: [order_id], transaction }
            );

            return { orderNumber: order.order_number };
        });

        if (result.error === "order-not-found") {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        if (result.error === "payment-not-found") {
            return res.status(404).json({ success: false, message: "Payment record not found." });
        }

        return res.json({
            success: true,
            message: "Payment verified successfully.",
            order_number: result.orderNumber
        });
    } catch (error) {
        if (error.code === "ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH") {
            return res.status(400).json({ success: false, message: "Payment signature verification failed." });
        }
        return sendError(res, error, "Unable to verify the payment.");
    }
};

/* ------------------------------------------------------------------ */
/* Razorpay webhook (payment.captured)                                 */
/* ------------------------------------------------------------------ */

export const razorpayWebhook = async (req, res) => {
    // Razorpay sends the raw body in the webhook. We need the raw body for
    // signature verification. app.js registers this route with express.raw.
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        // Webhook not configured; acknowledge without processing.
        return res.status(200).json({ success: true });
    }

    if (!signature) {
        return res.status(400).json({ success: false, message: "Missing webhook signature." });
    }

    const rawBody = req.body;
    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

    let signatureValid = false;
    try {
        signatureValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(String(signature))
        );
    } catch {
        signatureValid = false;
    }

    if (!signatureValid) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    let payload;
    try {
        payload = JSON.parse(rawBody.toString());
    } catch {
        return res.status(400).json({ success: false, message: "Invalid webhook payload." });
    }

    try {
        if (payload.event === "payment.captured") {
            const payment = payload.payload?.payment?.entity || {};
            const razorpayOrderId = payment.order_id;
            const razorpayPaymentId = payment.id;

            if (razorpayOrderId) {
                await sequelize.transaction(async (transaction) => {
                    const payments = await sequelize.query(
                        "SELECT p.id, p.order_id FROM payments p WHERE p.provider = 'razorpay' AND p.provider_reference = ? LIMIT 1",
                        { replacements: [razorpayOrderId], type: QueryTypes.SELECT, transaction }
                    );
                    if (!payments.length) return;

                    await sequelize.query(
                        "UPDATE payments SET status = 'paid', method = 'razorpay', provider_reference = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        { replacements: [razorpayPaymentId, payments[0].id], transaction }
                    );
                    await sequelize.query(
                        "UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        { replacements: [payments[0].order_id], transaction }
                    );
                });
            }
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Razorpay webhook processing failed:", error);
        return res.status(500).json({ success: false, message: "Webhook processing failed." });
    }
};
