import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Minus, Plus, ShoppingBag, CheckCircle2, Loader2 } from "lucide-react";
import { bookAssetUrl, createOrder, getBook, verifyPayment } from "../services/checkoutApi";
import bookCoverFallback from "../assets/vithobabook.png";

const MIN_QTY = 1;

function formatMoney(value, currency = "INR") {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    } catch {
        return `${currency} ${Number(value) || 0}`;
    }
}

export default function Checkout() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bookId = searchParams.get("bookId");

    const [book, setBook] = useState(null);
    const [bookError, setBookError] = useState("");
    const [loadingBook, setLoadingBook] = useState(true);

    // Customer form
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        address: ""
    });
    const [quantity, setQuantity] = useState(MIN_QTY);
    const [formError, setFormError] = useState("");

    // Payment flow
    const [submitting, setSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState("");
    const [paymentSuccess, setPaymentSuccess] = useState(null); // { orderNumber, ... }

    useEffect(() => {
        if (!bookId) {
            setBookError("No book selected. Please go back and choose a book.");
            setLoadingBook(false);
            return;
        }

        const controller = new AbortController();
        setLoadingBook(true);
        getBook(bookId, { signal: controller.signal })
            .then((b) => setBook(b))
            .catch((error) => {
                if (error.name !== "AbortError") setBookError(error.message);
            })
            .finally(() => setLoadingBook(false));

        return () => controller.abort();
    }, [bookId]);

    const unitPrice = Number(book?.price) || 0;
    const stock = Number(book?.stock_quantity) || 0;
    const subtotal = useMemo(() => +(unitPrice * quantity).toFixed(2), [unitPrice, quantity]);

    const updateField = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setFormError("");
        setPaymentError("");
    };

    const validateForm = () => {
        if (!form.full_name.trim()) return "Please enter your full name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email address.";
        if (!form.phone.trim()) return "Please enter your phone number.";
        if (!form.address.trim()) return "Please enter your shipping address.";
        if (quantity < MIN_QTY) return `Quantity must be at least ${MIN_QTY}.`;
        if (stock > 0 && quantity > stock) return `Only ${stock} copy/copies are available in stock.`;
        return "";
    };

    const handleQuantityChange = (delta) => {
        setQuantity((prev) => {
            const next = prev + delta;
            if (next < MIN_QTY) return MIN_QTY;
            if (stock > 0 && next > stock) return stock;
            return next;
        });
    };

    const handlePayment = async () => {
        const error = validateForm();
        if (error) {
            setFormError(error);
            return;
        }

        setSubmitting(true);
        setPaymentError("");

        try {
            // 1. Create the order + Razorpay order on the backend
            const orderData = await createOrder({
                book_id: bookId,
                quantity,
                full_name: form.full_name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address.trim()
            });

            // 2. Open Razorpay checkout
            if (typeof window.Razorpay === "undefined") {
                throw new Error("Razorpay checkout could not be loaded. Please refresh the page and try again.");
            }

            const options = {
                key: orderData.key_id,
                amount: orderData.amount_in_smallest_unit,
                currency: orderData.currency,
                name: "Shyamchi Aai",
                description: `Order ${orderData.order_number}`,
                order_id: orderData.razorpay_order_id,
                prefill: {
                    name: form.full_name.trim(),
                    email: form.email.trim(),
                    contact: form.phone.trim()
                },
                notes: {
                    order_id: String(orderData.order_id)
                },
                theme: { color: "#17203a" },
                handler: async (response) => {
                    try {
                        // 3. Verify the payment signature on the backend
                        const verifyResult = await verifyPayment({
                            order_id: orderData.order_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        setPaymentSuccess({
                            orderNumber: verifyResult.order_number || orderData.order_number
                        });
                    } catch (verifyErr) {
                        setPaymentError(verifyErr.message || "Payment verification failed. Please contact support.");
                    } finally {
                        setSubmitting(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (response) => {
                setSubmitting(false);
                const reason = response?.error?.description || "Payment was not completed.";
                setPaymentError(reason);
            });
            rzp.open();
        } catch (err) {
            setSubmitting(false);
            setPaymentError(err.message || "Unable to start the payment. Please try again.");
        }
    };

    // ---- Loading state ----
    if (loadingBook) {
        return (
            <div className="checkout-page">
                <div className="checkout-loading">Loading book details…</div>
            </div>
        );
    }

    // ---- Error / no book state ----
    if (bookError || !book) {
        return (
            <div className="checkout-page">
                <div className="checkout-empty">
                    <p className="checkout-empty-msg">{bookError || "Book not found."}</p>
                    <button className="checkout-back-btn" onClick={() => navigate("/Book")}>
                        Back to Books
                    </button>
                </div>
            </div>
        );
    }

    // ---- Success state ----
    if (paymentSuccess) {
        return (
            <div className="checkout-page">
                <div className="checkout-success">
                    <CheckCircle2 size={56} className="checkout-success-icon" />
                    <h2>Payment Successful!</h2>
                    <p>Thank you for your order. Your payment has been confirmed.</p>
                    <p className="checkout-order-num">
                        Order Number: <strong>{paymentSuccess.orderNumber}</strong>
                    </p>
                    <p className="checkout-success-note">
                        A confirmation will be sent to {form.email}. Please keep your order number for reference.
                    </p>
                    <button className="checkout-back-btn" onClick={() => navigate("/")}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // ---- Checkout form ----
    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <h1 className="checkout-heading">Checkout</h1>

                <div className="checkout-grid">
                    {/* Left: book + quantity */}
                    <div className="checkout-col">
                        <div className="checkout-book-card">
                            <img
                                src={book.cover_image_url ? bookAssetUrl(book.cover_image_url) : bookCoverFallback}
                                alt={book.title}
                                className="checkout-book-cover"
                            />
                            <div className="checkout-book-info">
                                <h2 className="checkout-book-title">{book.title}</h2>
                                {book.author && <p className="checkout-book-author">by {book.author}</p>}
                                <p className="checkout-book-price">{formatMoney(unitPrice)}</p>
                                {stock > 0 ? (
                                    <p className="checkout-stock in-stock">{stock} in stock</p>
                                ) : (
                                    <p className="checkout-stock out-of-stock">Currently unavailable</p>
                                )}
                            </div>
                        </div>

                        <div className="checkout-qty">
                            <label className="checkout-qty-label">Quantity</label>
                            <div className="qty-stepper">
                                <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= MIN_QTY}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    className="qty-input"
                                    value={quantity}
                                    min={MIN_QTY}
                                    max={stock > 0 ? stock : undefined}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        if (Number.isNaN(v)) return setQuantity(MIN_QTY);
                                        if (v < MIN_QTY) return setQuantity(MIN_QTY);
                                        if (stock > 0 && v > stock) return setQuantity(stock);
                                        setQuantity(v);
                                    }}
                                />
                                <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={stock > 0 && quantity >= stock}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Customer details */}
                        <div className="checkout-form">
                            <h3>Your Details</h3>
                            <div className="form-row">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={form.full_name}
                                    onChange={updateField("full_name")}
                                    placeholder="Enter your full name"
                                    disabled={submitting}
                                />
                            </div>
                            <div className="form-row two-col">
                                <div>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={updateField("email")}
                                        placeholder="you@example.com"
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={updateField("phone")}
                                        placeholder="+44 7xxx xxxxxx"
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <label>Shipping Address</label>
                                <textarea
                                    value={form.address}
                                    onChange={updateField("address")}
                                    placeholder="House number, street, city, postcode"
                                    rows={3}
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: order summary */}
                    <div className="checkout-col">
                        <div className="checkout-summary">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>{book.title} × {quantity}</span>
                                <span>{formatMoney(subtotal)}</span>
                            </div>
                            <div className="summary-row muted">
                                <span>Shipping</span>
                                <span>Calculated at payment</span>
                            </div>
                            <div className="summary-row muted">
                                <span>Tax</span>
                                <span>Calculated at payment</span>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-row total">
                                <span>Subtotal</span>
                                <span>{formatMoney(subtotal)}</span>
                            </div>

                            {formError && <p className="checkout-error" role="alert">{formError}</p>}
                            {paymentError && <p className="checkout-error" role="alert">{paymentError}</p>}

                            <button
                                type="button"
                                className="checkout-pay-btn"
                                onClick={handlePayment}
                                disabled={submitting || stock === 0}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="spin" /> Processing…
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag size={18} /> Pay {formatMoney(subtotal)}
                                    </>
                                )}
                            </button>

                            <p className="checkout-secure-note">
                                Secured by Razorpay. You will be redirected to the payment gateway.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
