
import { NavLink, useNavigate } from "react-router-dom";

import {
    LayoutDashboard,
    BookOpen,
    ShoppingBag,
    Users,
    CreditCard,
    Warehouse,
    Settings,
    LogOut,
    X,
    UserPlus
} from "lucide-react";

import { useAdmin } from "../context/AdminContext";

const AdminSidebar = ({ open, onClose }) => {

    const { logout, admin } = useAdmin();

    const navigate = useNavigate();

    const links = [
        {
            title: "Dashboard",
            path: "/admin/dashboard",
            icon: LayoutDashboard
        },
        {
            title: "Books",
            path: "/admin/books",
            icon: BookOpen
        },
        {
            title: "Orders",
            path: "/admin/orders",
            icon: ShoppingBag
        },
        {
            title: "Inventory",
            path: "/admin/inventory",
            icon: Warehouse
        },
        {
            title: "Customers",
            path: "/admin/customers",
            icon: Users
        },
        {
            title: "Payments",
            path: "/admin/payments",
            icon: CreditCard
        },
        {
            title: "Settings",
            path: "/admin/settings",
            icon: Settings
        },

        ...(admin?.role === "super_admin" ? [
            {
                title: "Add Admin",
                path: "/admin/register",
                icon: UserPlus
            }
        ] : [])
    ];

    const handleLogout = async () => {

        try {
            await logout();
        } finally {
            navigate("/admin/login", {
                replace: true
            });
        }
    };

    return (
        <>
            {open && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                />
            )}

            <aside
                className={`admin-sidebar ${
                    open ? "sidebar-open" : ""
                }`}
            >

                {/* BRAND */}

                <div className="sidebar-brand">

                    <BookOpen size={27} />

                    <span>BookStore Admin</span>

                    <button
                        className="sidebar-close"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>

                </div>

                <div className="sidebar-section">
                    MAIN MENU
                </div>

                {/* NAVIGATION */}

                <nav className="sidebar-navigation">

                    {links.map((link) => {

                        const Icon = link.icon;

                        return (

                            <NavLink
                                key={link.path}
                                to={link.path}
                                end
                                className={({ isActive }) =>
                                    isActive
                                        ? "sidebar-link active"
                                        : "sidebar-link"
                                }
                                onClick={onClose}
                            >

                                <Icon size={19} />

                                <span>{link.title}</span>

                            </NavLink>
                        );
                    })}

                </nav>

                {/* LOGOUT */}

                <div className="sidebar-bottom">

                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={19} />

                        <span>Logout</span>
                    </button>

                </div>

            </aside>
        </>
    );
};

export default AdminSidebar;
