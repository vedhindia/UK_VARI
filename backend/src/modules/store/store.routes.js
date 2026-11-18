import express from "express";
import {
    createOrder,
    getPublicBook,
    razorpayWebhook,
    verifyPayment
} from "./store.controller.js";

const router = express.Router();

// Public book details (for the checkout page)
router.get("/books/:id", getPublicBook);

// Customer order creation + Razorpay order
router.post("/orders", createOrder);

// Verify Razorpay payment after the customer completes the checkout
router.post("/orders/verify", verifyPayment);

export default router;
