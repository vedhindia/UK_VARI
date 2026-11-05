
import { useEffect, useState } from "react";
import {
    BookOpen,
    ShoppingBag,
    Users,
    CreditCard,
    Warehouse,
    Settings,
    ArrowUpRight
} from "lucide-react";

import { Link } from "react-router-dom";

import { useAdmin } from "../context/AdminContext";

import StatCard from "../components/StatCard";
import { adminApi } from "../services/adminApi";

const AdminDashboard = () => {

    const { admin } = useAdmin();
    const [summary, setSummary] = useState(null);
    const [summaryError, setSummaryError] = useState("");

    useEffect(() => {
        const loadSummary = async () => {
            try {
                const response = await adminApi("/admin/summary");
                setSummary(response.summary);
            } catch (error) {
                setSummaryError(error.message);
            }
        };

        loadSummary();
    }, []);

    const numberValue = (value) => value == null
        ? "—"
        : Number(value).toLocaleString("en-IN");

    const stats = [
        {
            title: "Total Books",
            value: numberValue(summary?.total_books),
            subtitle: "Book management",
            icon: BookOpen
        },
        {
            title: "Total Orders",
            value: numberValue(summary?.total_orders),
            subtitle: "Order management",
            icon: ShoppingBag
        },
        {
            title: "Customers",
            value: numberValue(summary?.total_customers),
            subtitle: "Customer management",
            icon: Users
        },
        {
            title: "Revenue",
            value: summary?.total_revenue == null
                ? "—"
                : new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: /^[A-Z]{3}$/.test(String(summary.currency || "").toUpperCase())
                        ? String(summary.currency).toUpperCase()
                        : "INR",
                    maximumFractionDigits: 2
                }).format(Number(summary.total_revenue)),
            subtitle: "Payment management",
            icon: CreditCard
        }
    ];

    const modules = [
        {
            title: "Book Management",
            description:
                "Add, edit and manage bookstore books.",
            icon: BookOpen,
            path: "/admin/books"
        },
        {
            title: "Order Management",
            description:
                "View and manage customer orders.",
            icon: ShoppingBag,
            path: "/admin/orders"
        },
        {
            title: "Inventory Management",
            description:
                "Manage available books and stock.",
            icon: Warehouse,
            path: "/admin/inventory"
        },
        {
            title: "Customer Management",
            description:
                "View and manage customer accounts.",
            icon: Users,
            path: "/admin/customers"
        },
        {
            title: "Store Settings",
            description:
                "Manage store contact and operational preferences.",
            icon: Settings,
            path: "/admin/settings"
        },
        {
            title: "Payment Management",
            description:
                "Review payments reported by the payment gateway.",
            icon: CreditCard,
            path: "/admin/payments"
        }
    ];

    return (

        <div className="dashboard-page">

            {/* WELCOME SECTION */}

            <div className="dashboard-welcome">

                <div>

                    <span className="welcome-label">
                        OVERVIEW
                    </span>

                    <h1>
                        Welcome back, {admin?.name}!
                    </h1>

                    <p>
                        Manage your bookstore from one place.
                    </p>

                </div>

                <div className="welcome-icon">
                    <BookOpen size={40} />
                </div>

            </div>

            {/* STATISTICS */}

            <div className="dashboard-section-heading">

                <div>
                    <h2>Business Overview</h2>

                    <p>
                        Your bookstore management summary
                    </p>
                </div>

            </div>

            {summaryError && (
                <div className="admin-error dashboard-summary-error" role="alert">
                    {summaryError}
                </div>
            )}

            <div className="stats-grid">

                {stats.map((stat) => (

                    <StatCard
                        key={stat.title}
                        {...stat}
                    />

                ))}

            </div>

            {/* MANAGEMENT MODULES */}

            <div className="dashboard-section-heading module-heading">

                <div>
                    <h2>Management Modules</h2>

                    <p>
                        Access your bookstore operations
                    </p>
                </div>

            </div>

            <div className="modules-grid">

                {modules.map((module) => {

                    const Icon = module.icon;

                    return (

                        <Link
                            to={module.path}
                            className="module-card"
                            key={module.title}
                        >

                            <div className="module-icon">
                                <Icon size={24} />
                            </div>

                            <h3>{module.title}</h3>

                            <p>{module.description}</p>

                            <span>
                                Open management page

                                <ArrowUpRight size={16} />
                            </span>

                        </Link>
                    );
                })}

            </div>

            <div className="dashboard-footer">
                BookStore Admin Management System
            </div>

        </div>
    );
};

export default AdminDashboard;
