import { useEffect } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const toastIcons = {
    success: CircleCheck,
    error: CircleAlert,
    warning: CircleAlert,
    info: Info
};

const AdminToast = ({ toast, onDismiss }) => {
    useEffect(() => {
        if (!toast) return undefined;
        const timeout = window.setTimeout(onDismiss, 4500);
        return () => window.clearTimeout(timeout);
    }, [toast, onDismiss]);

    if (!toast) return null;

    const Icon = toastIcons[toast.type] || Info;

    return (
        <div
            className={`admin-toast admin-toast-${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
        >
            <span className="admin-toast-icon"><Icon size={21} /></span>
            <span className="admin-toast-message">{toast.message}</span>
            <button type="button" className="admin-toast-dismiss" onClick={onDismiss} aria-label="Dismiss notification">
                <X size={17} />
            </button>
            <span className="admin-toast-progress" />
        </div>
    );
};

export default AdminToast;
