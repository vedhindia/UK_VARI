
import { useState } from "react";

import {
    Navigate,
    Outlet
} from "react-router-dom";

import { useAdmin } from "../context/AdminContext";

import AdminSidebar from "../components/AdminSidebar";

import AdminHeader from "../components/AdminHeader";

const AdminLayout = () => {

    const {
        admin,
        loading
    } = useAdmin();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Authentication loading
    if (loading) {

        return (
            <div className="login-loading">
                Checking authentication...
            </div>
        );
    }

    // Protect admin pages
    if (!admin) {

        return (
            <Navigate
                to="/admin/login"
                replace
            />
        );
    }

    return (

        <div className="admin-layout">

            <AdminSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="admin-main">

                <AdminHeader
                    onMenuClick={() =>
                        setSidebarOpen(true)
                    }
                />

                <main className="admin-content">

                    <Outlet />

                </main>

            </div>

        </div>
    );
};

export default AdminLayout;
