import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Archive,
    BookOpen,
    Check,
    CreditCard,
    Pencil,
    Plus,
    RefreshCw,
    Save,
    Search,
    Settings,
    ShoppingBag,
    Users,
    Warehouse,
    X,
    ImagePlus,
    Trash2
} from "lucide-react";
import { adminApi, adminAssetUrl } from "../services/adminApi";
import { useAdminToast } from "../context/AdminToastContext";

const resources = {
    books: {
        title: "Books",
        description: "Create and maintain the books available in your store.",
        icon: BookOpen,
        endpoint: "/admin/books",
        dataKey: "books",
        columns: [
            ["cover_image_url", "Cover", (value) => value
                ? <img className="admin-book-thumbnail" src={adminAssetUrl(value)} alt="Book cover" />
                : "—"],
            ["title", "Book"],
            ["author", "Author"],
            ["category", "Category"],
            ["price", "Price", (value) => formatMoney(value)],
            ["stock_quantity", "Stock"],
            ["status", "Status", formatStatus]
        ],
        fields: [
            { name: "title", label: "Title", required: true },
            { name: "author", label: "Author", required: true },
            { name: "isbn", label: "ISBN" },
            { name: "category", label: "Category" },
            { name: "price", label: "Price", type: "number", min: "0", step: "0.01", required: true },
            { name: "stock_quantity", label: "Opening stock", type: "number", min: "0", step: "1", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "status", label: "Catalog status", type: "select", required: true, options: ["active", "inactive"] }
        ],
        makePayload: (form) => ({
            ...form,
            price: Number(form.price),
            stock_quantity: Number(form.stock_quantity)
        }),
        searchable: ["title", "author", "isbn", "category"],
        filterValues: ["active", "inactive", "archived"],
        canCreate: true,
        canEdit: true,
        canArchive: true
    },
    orders: {
        title: "Orders",
        description: "Review customer orders and update their fulfilment status.",
        icon: ShoppingBag,
        endpoint: "/admin/orders",
        dataKey: "orders",
        columns: [
            ["order_number", "Order"],
            ["customer_name", "Customer"],
            ["created_at", "Placed", formatDate],
            ["item_count", "Items"],
            ["total_amount", "Total", (value, item) => formatMoney(value, item.currency)],
            ["status", "Status", formatStatus]
        ],
        fields: [
            {
                name: "status",
                label: "Order status",
                type: "select",
                required: true,
                options: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
            }
        ],
        searchable: ["order_number", "customer_name", "status"],
        filterValues: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
        canEdit: true
    },
    inventory: {
        title: "Inventory",
        description: "Adjust available stock. Each adjustment is recorded with its reason.",
        icon: Warehouse,
        endpoint: "/admin/inventory",
        dataKey: "inventory",
        columns: [
            ["title", "Book"],
            ["author", "Author"],
            ["isbn", "ISBN"],
            ["stock_quantity", "Available"],
            ["updated_at", "Last updated", formatDate]
        ],
        fields: [
            { name: "stock_quantity", label: "New available quantity", type: "number", min: "0", step: "1", required: true },
            { name: "reason", label: "Reason for adjustment", type: "textarea", required: true }
        ],
        searchable: ["title", "author", "isbn"],
        canEdit: true
    },
    customers: {
        title: "Customers",
        description: "Review customer accounts and control whether they can place orders.",
        icon: Users,
        endpoint: "/admin/customers",
        dataKey: "customers",
        columns: [
            ["full_name", "Customer"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["order_count", "Orders"],
            ["created_at", "Joined", formatDate],
            ["status", "Status", formatStatus]
        ],
        fields: [
            {
                name: "status",
                label: "Account status",
                type: "select",
                required: true,
                options: ["active", "inactive"]
            }
        ],
        searchable: ["full_name", "email", "phone"],
        filterValues: ["active", "inactive"],
        canEdit: true
    },
    payments: {
        title: "Payments",
        description: "View payment records and their gateway-reported status.",
        icon: CreditCard,
        endpoint: "/admin/payments",
        dataKey: "payments",
        columns: [
            ["order_number", "Order"],
            ["customer_name", "Customer"],
            ["provider", "Provider"],
            ["method", "Method"],
            ["amount", "Amount", (value, item) => formatMoney(value, item.currency)],
            ["status", "Status", formatStatus],
            ["created_at", "Recorded", formatDate]
        ],
        searchable: ["order_number", "customer_name", "provider", "method", "status"],
        filterValues: ["pending", "authorized", "paid", "failed", "refunded"],
        readOnly: true
    }
};

const settingsFields = [
    { name: "store_name", label: "Store name", required: true },
    { name: "support_email", label: "Support email", type: "email", required: true },
    { name: "support_phone", label: "Support phone" },
    { name: "currency", label: "Currency code", required: true, maxLength: 3 },
    { name: "tax_rate", label: "Tax rate (%)", type: "number", min: "0", max: "100", step: "0.01", required: true },
    { name: "low_stock_threshold", label: "Low-stock threshold", type: "number", min: "0", step: "1", required: true }
];

const MAX_BOOK_IMAGES = 8;
const MAX_BOOK_IMAGE_SIZE = 5 * 1024 * 1024;
const BOOK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function formatMoney(value, currency = "INR") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: /^[A-Z]{3}$/.test(String(currency || "").toUpperCase())
            ? String(currency).toUpperCase()
            : "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function formatStatus(value) {
    return value ? String(value).replaceAll("_", " ") : "—";
}

function emptyForm(fields) {
    return Object.fromEntries(
        fields.map(({ name, options }) => [name, options?.[0] || ""])
    );
}

const AdminManagementPage = ({ resource }) => {
    const config = resources[resource];
    const isSettings = resource === "settings";
    const showToast = useAdminToast();
    const [items, setItems] = useState([]);
    const [settings, setSettings] = useState(null);
    const [form, setForm] = useState({});
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [bookImages, setBookImages] = useState([]);
    const [pendingImages, setPendingImages] = useState([]);
    const [loadingBookImages, setLoadingBookImages] = useState(false);
    const [viewingBook, setViewingBook] = useState(null);
    const [loadingBookDetails, setLoadingBookDetails] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const Icon = isSettings ? Settings : config?.icon;

    const clearPendingImages = () => {
        pendingImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
        setPendingImages([]);
    };

    const loadData = useCallback(async (notifyOnSuccess = false) => {
        setLoading(true);

        try {
            const response = await adminApi(isSettings ? "/admin/settings" : config.endpoint);
            if (isSettings) {
                setSettings(response.settings);
                setForm(response.settings);
            } else {
                setItems(response[config.dataKey]);
            }
            if (notifyOnSuccess) showToast(`${config.title} refreshed.`);
        } catch (requestError) {
            showToast(requestError.message, "error");
        } finally {
            setLoading(false);
        }
    }, [config, isSettings, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const visibleItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return items.filter((item) => {
            const matchesQuery = !normalizedQuery || config.searchable.some((key) =>
                String(item[key] ?? "").toLowerCase().includes(normalizedQuery)
            );
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [items, query, statusFilter, config]);

    const openEditor = async (item = null) => {
        const fields = config.fields;
        setEditorOpen(true);
        setEditing(item);
        setBookImages([]);
        clearPendingImages();
        setForm(item
            ? Object.fromEntries(fields.map(({ name }) => [name, item[name] ?? ""]))
            : emptyForm(fields));
        if (resource === "books" && item) {
            setLoadingBookImages(true);
            try {
                const response = await adminApi(`${config.endpoint}/${item.id}/images`);
                setBookImages(response.images);
            } catch (requestError) {
                showToast(requestError.message, "error");
            } finally {
                setLoadingBookImages(false);
            }
        }
    };

    const openBookDetails = async (item) => {
        setViewingBook(null);
        setLoadingBookDetails(true);
        try {
            const response = await adminApi(`${config.endpoint}/${item.id}`);
            setViewingBook(response.book);
        } catch (requestError) {
            showToast(requestError.message, "error");
        } finally {
            setLoadingBookDetails(false);
        }
    };

    const closeBookDetails = () => {
        setViewingBook(null);
    };

    const closeEditor = () => {
        clearPendingImages();
        setBookImages([]);
        setEditorOpen(false);
        setEditing(null);
    };

    const handleBookImageSelection = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        event.target.value = "";
        const acceptedFiles = [];
        const rejectedFiles = [];

        selectedFiles.forEach((file) => {
            if (!BOOK_IMAGE_TYPES.includes(file.type) || file.size > MAX_BOOK_IMAGE_SIZE) {
                rejectedFiles.push(file.name);
            } else {
                acceptedFiles.push(file);
            }
        });

        const availableSlots = Math.max(
            0,
            MAX_BOOK_IMAGES - bookImages.length - pendingImages.length
        );
        const newImages = acceptedFiles.slice(0, availableSlots).map((file) => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        if (rejectedFiles.length) {
            showToast(`Unsupported or oversized image(s): ${rejectedFiles.join(", ")}. Choose JPEG, PNG, WebP, or GIF files up to 5 MB each.`, "error");
        } else if (acceptedFiles.length > availableSlots) {
            showToast(`You can upload up to ${MAX_BOOK_IMAGES} images at a time.`, "error");
        }

        if (newImages.length) {
            setPendingImages((current) => [...current, ...newImages]);
        }
    };

    const removePendingImage = (imageToRemove) => {
        URL.revokeObjectURL(imageToRemove.preview);
        setPendingImages((current) => current.filter((image) => image !== imageToRemove));
    };

    const removeBookImage = async (image) => {
        try {
            const response = await adminApi(
                `${config.endpoint}/${editing.id}/images/${image.id}`,
                { method: "DELETE" }
            );
            setBookImages(response.images);
            setItems((current) => current.map((item) =>
                item.id === editing.id
                    ? { ...item, cover_image_url: response.images.find((entry) => entry.is_primary)?.image_url || null }
                    : item
            ));
            showToast("Book image removed.");
        } catch (requestError) {
            showToast(requestError.message, "error");
        }
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            if (isSettings) {
                const payload = {
                    ...form,
                    currency: String(form.currency).trim().toUpperCase(),
                    tax_rate: Number(form.tax_rate),
                    low_stock_threshold: Number(form.low_stock_threshold)
                };
                const response = await adminApi("/admin/settings", {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
                setSettings(response.settings);
                setForm(response.settings);
                showToast("Store settings saved.");
            } else if (resource === "books") {
                const payload = config.makePayload(form);
                const response = await adminApi(
                    editing ? `${config.endpoint}/${editing.id}` : config.endpoint,
                    {
                        method: editing ? "PUT" : "POST",
                        body: JSON.stringify(payload)
                    }
                );
                let savedBook = response.book;

                if (pendingImages.length) {
                    try {
                        const imageData = new FormData();
                        pendingImages.forEach(({ file }) => imageData.append("images", file));
                        const imageResponse = await adminApi(
                            `${config.endpoint}/${savedBook.id}/images`,
                            { method: "POST", body: imageData }
                        );
                        savedBook = imageResponse.book;
                        setBookImages(imageResponse.images);
                    } catch (uploadError) {
                        setItems((current) => editing
                            ? current.map((item) => item.id === savedBook.id ? savedBook : item)
                            : [savedBook, ...current]);
                        setEditing(savedBook);
                        showToast(`Book details were saved, but the image upload failed: ${uploadError.message} Select Save changes to retry the images.`, "warning");
                        return;
                    }
                }

                setItems((current) => editing
                    ? current.map((item) => item.id === editing.id ? savedBook : item)
                    : [savedBook, ...current]);
                showToast(editing ? "Book updated." : "Book created.");
                closeEditor();
            } else if (resource === "inventory") {
                const response = await adminApi(`${config.endpoint}/${editing.book_id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        stock_quantity: Number(form.stock_quantity),
                        reason: form.reason
                    })
                });
                setItems((current) => current.map((item) =>
                    item.book_id === editing.book_id ? response.inventory : item
                ));
                showToast("Inventory updated.");
                closeEditor();
            } else {
                const response = await adminApi(`${config.endpoint}/${editing.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(form)
                });
                const key = resource === "orders" ? "order" : "customer";
                setItems((current) => current.map((item) =>
                    item.id === editing.id ? response[key] : item
                ));
                showToast(resource === "orders" ? "Order status updated." : "Customer status updated.");
                closeEditor();
            }
        } catch (requestError) {
            showToast(requestError.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const archiveBook = async (book) => {
        if (!window.confirm(`Archive "${book.title}"? It will no longer be active in the catalog.`)) return;
        try {
            await adminApi(`${config.endpoint}/${book.id}`, { method: "DELETE" });
            setItems((current) => current.map((item) =>
                item.id === book.id ? { ...item, status: "archived" } : item
            ));
            showToast("Book archived.");
        } catch (requestError) {
            showToast(requestError.message, "error");
        }
    };

    if (!isSettings && !config) return null;

    return (
        <section className="admin-management-page">
            <div className="admin-page-heading">
                <div className="admin-page-title">
                    <span className="admin-page-icon"><Icon size={24} /></span>
                    <div>
                        <h1>{isSettings ? "Store Settings" : config.title}</h1>
                        <p>{isSettings ? "Set the store contact, currency, tax, and stock-alert preferences." : config.description}</p>
                    </div>
                </div>
                <div className="admin-page-actions">
                    {!isSettings && !config.readOnly && config.canCreate && (
                        <button type="button" className="admin-primary-button" onClick={() => openEditor()}>
                            <Plus size={17} /> Add book
                        </button>
                    )}
                    <button className="admin-secondary-button" onClick={() => loadData(true)} disabled={loading} aria-label="Refresh">
                        <RefreshCw size={17} /> Refresh
                    </button>
                </div>
            </div>

            {isSettings ? (
                <form className="admin-form-card settings-form" onSubmit={handleSave}>
                    <div className="admin-card-heading">
                        <div>
                            <h2>Store profile</h2>
                            <p>These values are used by the administration system and checkout integration.</p>
                        </div>
                    </div>
                    <div className="admin-form-grid">
                        {settingsFields.map((field) => (
                            <FormField
                                key={field.name}
                                field={field}
                                value={form[field.name] ?? ""}
                                onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
                            />
                        ))}
                    </div>
                    <div className="admin-form-actions">
                        <button type="submit" className="admin-primary-button" disabled={saving || loading || !settings}>
                            <Save size={17} /> {saving ? "Saving..." : "Save settings"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="admin-table-card">
                    <div className="admin-table-toolbar">
                        <div className="admin-search">
                            <Search size={17} />
                            <input
                                type="search"
                                placeholder={`Search ${config.title.toLowerCase()}...`}
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                aria-label={`Search ${config.title}`}
                            />
                        </div>
                        {config.filterValues && (
                            <select
                                className="admin-filter"
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                aria-label="Filter by status"
                            >
                                <option value="all">All statuses</option>
                                {config.filterValues.map((status) => (
                                    <option key={status} value={status}>{formatStatus(status)}</option>
                                ))}
                            </select>
                        )}
                        <span className="admin-record-count">{visibleItems.length} records</span>
                    </div>

                    {loading ? (
                        <div className="admin-loading">Loading {config.title.toLowerCase()}...</div>
                    ) : (
                        <div className="admin-table-scroll">
                            <table className="admin-data-table">
                                <thead>
                                    <tr>
                                        {config.columns.map(([, label]) => <th key={label}>{label}</th>)}
                                        {!config.readOnly && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleItems.map((item) => (
                                        <tr key={item.id ?? item.book_id}>
                                            {config.columns.map(([key, , render]) => (
                                                <td key={key}>
                                                    {key === "status"
                                                        ? <span className={`admin-status status-${String(item[key]).replaceAll("_", "-")}`}>{formatStatus(item[key])}</span>
                                                        : resource === "books" && key === "title"
                                                            ? <button type="button" className="admin-book-title-link" onClick={() => openBookDetails(item)}>{item.title}</button>
                                                        : (render ? render(item[key], item) : item[key] ?? "—")}
                                                </td>
                                            ))}
                                            {!config.readOnly && (
                                                <td>
                                                    {!(resource === "books" && item.status === "archived") && (
                                                        <button
                                                            className="admin-icon-button"
                                                            onClick={() => openEditor(item)}
                                                            aria-label={resource === "inventory" ? `Adjust ${item.title} stock` : `Edit ${item.title || item.order_number || item.full_name}`}
                                                            title={resource === "inventory" ? "Adjust stock" : "Edit"}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                    {config.canArchive && item.status !== "archived" && (
                                                        <button
                                                            className="admin-icon-button danger"
                                                            onClick={() => archiveBook(item)}
                                                            aria-label={`Archive ${item.title}`}
                                                            title="Archive book"
                                                        >
                                                            <Archive size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {!visibleItems.length && (
                                        <tr>
                                            <td className="admin-table-empty" colSpan={config.columns.length + (config.readOnly ? 0 : 1)}>
                                                {items.length ? "No records match this search." : `No ${config.title.toLowerCase()} found.`}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {(viewingBook || loadingBookDetails) && (
                <div className="admin-modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeBookDetails();
                }}>
                    <section
                        className="admin-modal-card admin-book-details-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-book-details-title"
                    >
                        <div className="admin-modal-heading">
                            <div>
                                <h2 id="admin-book-details-title">{viewingBook?.title || "Book details"}</h2>
                                <p>Complete catalog information for the selected book.</p>
                            </div>
                            <button type="button" className="admin-icon-button" onClick={closeBookDetails} aria-label="Close book details"><X size={18} /></button>
                        </div>
                        {loadingBookDetails && <div className="admin-loading">Loading book details...</div>}
                        {viewingBook && (
                            <>
                                <div className="admin-book-detail-images">
                                    {(viewingBook.image_urls?.length
                                        ? viewingBook.image_urls
                                        : viewingBook.cover_image_url
                                            ? [viewingBook.cover_image_url]
                                            : []
                                    ).map((imageUrl, index) => (
                                        <img
                                            key={`${imageUrl}-${index}`}
                                            src={adminAssetUrl(imageUrl)}
                                            alt={`${viewingBook.title} image ${index + 1}`}
                                        />
                                    ))}
                                    {!viewingBook.image_urls?.length && !viewingBook.cover_image_url && (
                                        <div className="admin-book-no-image">No book images</div>
                                    )}
                                </div>
                                <dl className="admin-book-detail-grid">
                                    <div><dt>Book ID</dt><dd>{viewingBook.id}</dd></div>
                                    <div><dt>Author</dt><dd>{viewingBook.author || "—"}</dd></div>
                                    <div><dt>ISBN</dt><dd>{viewingBook.isbn || "—"}</dd></div>
                                    <div><dt>Category</dt><dd>{viewingBook.category || "—"}</dd></div>
                                    <div><dt>Price</dt><dd>{formatMoney(viewingBook.price)}</dd></div>
                                    <div><dt>Stock quantity</dt><dd>{viewingBook.stock_quantity ?? "—"}</dd></div>
                                    <div><dt>Status</dt><dd><span className={`admin-status status-${String(viewingBook.status || "").replaceAll("_", "-")}`}>{formatStatus(viewingBook.status)}</span></dd></div>
                                    <div><dt>Created</dt><dd>{formatDate(viewingBook.created_at)}</dd></div>
                                    <div><dt>Last updated</dt><dd>{formatDate(viewingBook.updated_at)}</dd></div>
                                    <div className="admin-book-detail-description"><dt>Description</dt><dd>{viewingBook.description || "No description provided."}</dd></div>
                                </dl>
                                <div className="admin-form-actions">
                                    {viewingBook.status !== "archived" && (
                                        <button
                                            type="button"
                                            className="admin-primary-button"
                                            onClick={() => {
                                                const book = viewingBook;
                                                closeBookDetails();
                                                openEditor(book);
                                            }}
                                        >
                                            <Pencil size={16} /> Edit book
                                        </button>
                                    )}
                                    <button type="button" className="admin-secondary-button" onClick={closeBookDetails}>Close</button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            )}

            {editorOpen && (
                <div className="admin-modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeEditor();
                }}>
                    <form
                        className="admin-modal-card"
                        onSubmit={handleSave}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-editor-title"
                    >
                        <div className="admin-modal-heading">
                            <div>
                                <h2 id="admin-editor-title">{resource === "books" ? (editing ? "Edit book" : "Add book") : resource === "inventory" ? `Adjust stock: ${editing.title}` : resource === "orders" ? `Update order ${editing.order_number}` : `Update ${editing.full_name}'s account`}</h2>
                                <p>{resource === "books" && !editing
                                    ? "Enter the book details. The book will be saved to your database."
                                    : resource === "inventory"
                                        ? "Enter the new total stock quantity and explain the adjustment."
                                        : "Update the fields below and save your changes."}</p>
                            </div>
                            <button type="button" className="admin-icon-button" onClick={closeEditor} disabled={saving} aria-label="Close form"><X size={18} /></button>
                        </div>
                        <div className="admin-form-grid">
                            {config.fields.map((field) => (
                                <FormField
                                    key={field.name}
                                    field={field}
                                    value={form[field.name] ?? ""}
                                    onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
                                />
                            ))}
                        </div>
                        {resource === "books" && (
                            <div className="admin-book-images">
                                <div className="admin-book-images-heading">
                                    <div>
                                        <h3>Book images</h3>
                                        <p>Choose up to {MAX_BOOK_IMAGES} JPEG, PNG, WebP, or GIF images (5 MB each). Images upload when you save the book.</p>
                                    </div>
                                    <label className="admin-secondary-button admin-image-picker">
                                        <ImagePlus size={17} /> Browse images
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            multiple
                                            onChange={handleBookImageSelection}
                                            disabled={saving || loadingBookImages || bookImages.length + pendingImages.length >= MAX_BOOK_IMAGES}
                                            aria-label="Browse book images"
                                        />
                                    </label>
                                </div>
                                {loadingBookImages && <p className="admin-image-loading">Loading saved images...</p>}
                                {!loadingBookImages && bookImages.length > 0 && (
                                    <div className="admin-image-gallery">
                                        {bookImages.map((image) => (
                                            <div className="admin-image-preview" key={image.id}>
                                                <img src={adminAssetUrl(image.image_url)} alt="Saved book cover" />
                                                {image.is_primary && <span className="admin-image-primary">Primary cover</span>}
                                                <button
                                                    type="button"
                                                    className="admin-image-remove"
                                                    onClick={() => removeBookImage(image)}
                                                    disabled={saving}
                                                    aria-label="Remove saved image"
                                                    title="Remove image"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {pendingImages.length > 0 && (
                                    <>
                                        <h4 className="admin-image-pending-title">Selected for upload ({pendingImages.length})</h4>
                                        <div className="admin-image-gallery">
                                            {pendingImages.map((image) => (
                                                <div className="admin-image-preview" key={image.preview}>
                                                    <img src={image.preview} alt={`Selected ${image.file.name}`} />
                                                    <span className="admin-image-file-name" title={image.file.name}>{image.file.name}</span>
                                                    <button
                                                        type="button"
                                                        className="admin-image-remove"
                                                        onClick={() => removePendingImage(image)}
                                                        disabled={saving}
                                                        aria-label={`Remove ${image.file.name}`}
                                                        title="Remove selected image"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        <div className="admin-form-actions">
                            <button type="button" className="admin-secondary-button" onClick={closeEditor} disabled={saving}>Cancel</button>
                            <button type="submit" className="admin-primary-button" disabled={saving}>
                                <Check size={17} /> {saving
                                    ? (resource === "books" && !editing ? "Adding book..." : "Saving...")
                                    : resource === "books" && !editing ? "Add book" : "Save changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
};

const FormField = ({ field, value, onChange }) => (
    <div className={`admin-form-field ${field.type === "textarea" ? "field-wide" : ""}`}>
        <label htmlFor={`admin-${field.name}`}>{field.label}{field.required && <span> *</span>}</label>
        {field.type === "select" ? (
            <select
                id={`admin-${field.name}`}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={field.required}
            >
                {field.options.map((option) => <option key={option} value={option}>{formatStatus(option)}</option>)}
            </select>
        ) : field.type === "textarea" ? (
            <textarea
                id={`admin-${field.name}`}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={field.required}
                rows={4}
            />
        ) : (
            <input
                id={`admin-${field.name}`}
                type={field.type || "text"}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={field.required}
                min={field.min}
                max={field.max}
                maxLength={field.maxLength}
                step={field.step}
            />
        )}
    </div>
);

export default AdminManagementPage;
