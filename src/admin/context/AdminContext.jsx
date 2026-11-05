
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { adminApi } from "../services/adminApi";

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check whether admin is already logged in
    const checkAuth = async () => {
        try {
            const response = await adminApi("/admin/me");

            setAdmin(response.admin);

        } catch (error) {
            setAdmin(null);

        } finally {
            setLoading(false);
        }
    };

    // Check authentication when admin section loads
    useEffect(() => {
        checkAuth();
    }, []);

    // Admin login
    const login = async (email, password) => {

        const response = await adminApi("/admin/login", {
            method: "POST",

            body: JSON.stringify({
                email,
                password
            })
        });

        setAdmin(response.admin);

        return response;
    };

    // Admin logout
    const logout = async () => {

        try {
            await adminApi("/admin/logout", {
                method: "POST"
            });

        } finally {
            setAdmin(null);
        }
    };

    return (
        <AdminContext.Provider
            value={{
                admin,
                loading,
                login,
                logout,
                checkAuth
            }}
        >
            {children}
        </AdminContext.Provider>
    );
};

// Custom hook
export const useAdmin = () => {

    const context = useContext(AdminContext);

    if (!context) {
        throw new Error(
            "useAdmin must be used inside AdminProvider"
        );
    }

    return context;
};
