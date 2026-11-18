const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const API_ORIGIN = new URL(
    API_URL,
    globalThis.location?.origin || "http://localhost"
).origin;

export const bookAssetUrl = (assetPath) =>
    new URL(assetPath, `${API_ORIGIN}/`).toString();

const request = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
};

/* Fetch a single active book for the checkout page */
export const getBook = async (bookId, { signal } = {}) => {
    const response = await fetch(`${API_URL}/books/${bookId}`, { signal });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Unable to load book details.");
    }

    return data.book;
};

/* Create a pending order and a Razorpay order */
export const createOrder = (payload) =>
    request("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
    });

/* Verify the Razorpay payment signature after checkout */
export const verifyPayment = (payload) =>
    request("/orders/verify", {
        method: "POST",
        body: JSON.stringify(payload)
    });
