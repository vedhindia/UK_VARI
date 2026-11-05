
import { useState } from "react";

import {
    Navigate,
    useNavigate
} from "react-router-dom";

import {
    BookOpen,
    Eye,
    EyeOff,
    Lock,
    Mail
} from "lucide-react";

import { useAdmin } from "../context/AdminContext";
import { useAdminToast } from "../context/AdminToastContext";


const AdminLogin = () => {

    // ======================================
    // ADMIN AUTHENTICATION
    // ======================================

    const {
        admin,
        login,
        loading
    } = useAdmin();
    const showToast = useAdminToast();


    // ======================================
    // ROUTER
    // ======================================

    const navigate = useNavigate();


    // ======================================
    // FORM STATES
    // ======================================

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);


    // ======================================
    // LOGIN STATES
    // ======================================

    const [submitting, setSubmitting] = useState(false);


    // ======================================
    // CHECK AUTHENTICATION LOADING
    // ======================================

    if (loading) {

        return (

            <div className="login-loading">

                <div className="login-loader"></div>

                <p>Checking session...</p>

            </div>

        );

    }


    // ======================================
    // REDIRECT IF ALREADY LOGGED IN
    // ======================================

    if (admin) {

        return (

            <Navigate
                to="/admin/dashboard"
                replace
            />

        );

    }


    // ======================================
    // HANDLE LOGIN SUBMISSION
    // ======================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        // Prevent duplicate submissions

        if (submitting) {
            return;
        }

        // Validate input

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {

            showToast("Please enter your email address and password.", "error");

            return;

        }

        setSubmitting(true);

        try {

            // Call AdminContext login function

            await login(
                normalizedEmail,
                password
            );
            showToast("Signed in successfully.", "success");

            // Redirect after successful login

            navigate("/admin/dashboard", {
                replace: true
            });

        } catch (err) {

            console.error("Admin Login Error:", err);

            showToast(
                err?.message ||
                "Login failed. Please check your email and password.",
                "error"
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ======================================
    // ADMIN LOGIN UI
    // ======================================

    return (

        <div className="login-page">

            <div className="login-card">


                {/* ======================================
                    BRANDING
                ====================================== */}

                <div className="login-brand">

                    <div className="brand-icon">

                        <BookOpen size={30} />

                    </div>

                    <h1>BookStore</h1>

                    <p>
                        Admin Management Portal
                    </p>

                </div>


                {/* ======================================
                    LOGIN HEADING
                ====================================== */}

                <div className="login-heading">

                    <h2>Welcome Back!</h2>

                    <p>
                        Sign in to manage your bookstore.
                    </p>

                </div>


                {/* ======================================
                    LOGIN FORM
                ====================================== */}

                <form onSubmit={handleSubmit} noValidate={false}>


                    {/* EMAIL ADDRESS */}

                    <div className="form-group">

                        <label htmlFor="admin-email">

                            Email Address

                        </label>


                        <div className="input-wrapper">

                            <Mail size={18} />

                            <input
                                id="admin-email"
                                name="email"
                                type="email"
                                placeholder="Enter admin email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                autoComplete="username"
                                required
                                disabled={submitting}
                            />

                        </div>

                    </div>


                    {/* PASSWORD */}

                    <div className="form-group">

                        <label htmlFor="admin-password">

                            Password

                        </label>


                        <div className="input-wrapper">

                            <Lock size={18} />

                            <input
                                id="admin-password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                                autoComplete="current-password"
                                required
                                disabled={submitting}
                            />


                            {/* SHOW / HIDE PASSWORD */}

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword((prev) => !prev)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                disabled={submitting}
                            >

                                {showPassword ? (

                                    <EyeOff size={18} />

                                ) : (

                                    <Eye size={18} />

                                )}

                            </button>

                        </div>

                    </div>


                    {/* SUBMIT BUTTON */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={submitting}
                    >

                        {submitting
                            ? "Signing in..."
                            : "Sign In"
                        }

                    </button>


                </form>


                {/* ======================================
                    LOGIN FOOTER
                ====================================== */}

                <div className="login-footer">

                    <Lock size={14} />

                    <span>
                        Secure Bookstore Administration
                    </span>

                </div>


            </div>

        </div>

    );

};


export default AdminLogin;
