
const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api/v1";

const API_ORIGIN = new URL(
    API_URL,
    globalThis.location?.origin || "http://localhost"
).origin;

export const adminAssetUrl = (assetPath) =>
    new URL(assetPath, `${API_ORIGIN}/`).toString();

export const adminApi = async (endpoint, options = {}) => {
    const isFormData =
        typeof FormData !== "undefined" &&
        options.body instanceof FormData;
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,

        credentials: "include",

        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Something went wrong"
        );
    }

    return data;
};
