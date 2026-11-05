import express from "express";
import {
    archiveBook,
    createBook,
    deleteBookImage,
    getAdminSummary,
    getBook,
    getStoreSettings,
    listBooks,
    listBookImages,
    listCustomers,
    listInventory,
    listOrders,
    listPayments,
    updateBook,
    uploadBookImagesForBook,
    updateCustomer,
    updateInventory,
    updateOrder,
    updateStoreSettings
} from "./admin.operations.controller.js";
import { verifyAdmin } from "../auth/auth.middleware.js";
import { removeUploadedFiles, uploadBookImages } from "./bookImageUpload.js";

const router = express.Router();

router.get("/summary", verifyAdmin, getAdminSummary);
router.get("/books", verifyAdmin, listBooks);
router.get("/books/:id", verifyAdmin, getBook);
router.post("/books", verifyAdmin, createBook);
router.put("/books/:id", verifyAdmin, updateBook);
router.delete("/books/:id", verifyAdmin, archiveBook);
router.get("/books/:id/images", verifyAdmin, listBookImages);
router.post("/books/:id/images", verifyAdmin, (req, res, next) => {
    uploadBookImages.array("images", 8)(req, res, (error) => {
        if (error) {
            removeUploadedFiles(req.files).then(() => {
                res.status(400).json({
                    success: false,
                    message: error.code === "LIMIT_FILE_SIZE"
                        ? "Each image must be 5 MB or smaller."
                        : error.code === "LIMIT_FILE_COUNT"
                            ? "You can upload up to 8 images at a time."
                            : error.message
                });
            }).catch((cleanupError) => {
                console.error("Unable to clean up rejected book images:", cleanupError);
                res.status(500).json({ success: false, message: "Unable to process the uploaded images." });
            });
            return;
        }
        next();
    });
}, uploadBookImagesForBook);
router.delete("/books/:id/images/:imageId", verifyAdmin, deleteBookImage);

router.get("/inventory", verifyAdmin, listInventory);
router.patch("/inventory/:id", verifyAdmin, updateInventory);

router.get("/orders", verifyAdmin, listOrders);
router.patch("/orders/:id", verifyAdmin, updateOrder);

router.get("/customers", verifyAdmin, listCustomers);
router.patch("/customers/:id", verifyAdmin, updateCustomer);

router.get("/payments", verifyAdmin, listPayments);

router.get("/settings", verifyAdmin, getStoreSettings);
router.put("/settings", verifyAdmin, updateStoreSettings);

export default router;
