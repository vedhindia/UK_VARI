const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const API_ORIGIN = new URL(
    API_URL,
    globalThis.location?.origin || "http://localhost"
).origin;

export const bookAssetUrl = (assetPath) =>
    new URL(assetPath, `${API_ORIGIN}/`).toString();

export const fetchBooks = async ({ signal } = {}) => {
    const response = await fetch(`${API_URL}/books`, { signal });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Unable to load books.");
    }

    return data.books;
};
