import { createContext, useContext } from "react";

export const AdminToastContext = createContext(null);

export const useAdminToast = () => {
    const showToast = useContext(AdminToastContext);
    if (!showToast) {
        throw new Error("useAdminToast must be used inside AdminProvider");
    }
    return showToast;
};
