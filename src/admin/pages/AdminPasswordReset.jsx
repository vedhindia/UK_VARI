import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, KeyRound, Lock, Mail } from "lucide-react";

import { adminApi } from "../services/adminApi";

const AdminPasswordReset = ({ isReset = false }) => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(
        isReset && !token
            ? "This password reset link is invalid. Request a new one."
            : ""
    );
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;
        setError("");

        if (isReset) {
            if (!token) {
                setError("This password reset link is invalid. Request a new one.");
                return;
            }
            if (password.length < 12) {
                setError("Your new password must contain at least 12 characters.");
                return;
            }
            if (password !== confirmPassword) {
                setError("The passwords do not match.");
                return;
            }
        } else if (!email.trim()) {
            setError("Please enter your admin email address.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await adminApi(
                isReset ? "/admin/password/reset" : "/admin/password/forgot",
                {
                    method: "POST",
                    body: JSON.stringify(
                        isReset
                            ? { token, password }
                            : { email: email.trim().toLowerCase() }
                    )
                }
            );
            setSuccess(response.message);
        } catch (requestError) {
            setError(requestError.message || "Unable to process your request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="brand-icon">
                        <BookOpen size={30} />
                    </div>
                    <h1>BookStore</h1>
                    <p>Admin Management Portal</p>
                </div>

                <div className="login-heading">
                    <h2>{isReset ? "Create a new password" : "Forgot your password?"}</h2>
                    <p>
                        {isReset
                            ? "Choose a new password for your admin account."
                            : "Enter your admin email and we will send you a reset link."}
                    </p>
                </div>

                {success ? (
                    <div className="login-success" role="status">
                        <p>{success}</p>
                        <Link to="/admin/login" className="login-link">
                            Return to sign in
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                                {isReset && !token && (
                                    <div>
                                        <Link to="/admin/forgot-password" className="login-link">
                                            Request a new reset link
                                        </Link>
                                    </div>
                                )}
                                {isReset && token && error.includes("expired") && (
                                    <div>
                                        <Link to="/admin/forgot-password" className="login-link">
                                            Request a new reset link
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {isReset ? (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="admin-new-password">New password</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} />
                                            <input
                                                id="admin-new-password"
                                                name="new-password"
                                                type="password"
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                autoComplete="new-password"
                                                minLength={12}
                                                required
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="admin-confirm-password">Confirm new password</label>
                                        <div className="input-wrapper">
                                            <KeyRound size={18} />
                                            <input
                                                id="admin-confirm-password"
                                                name="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                autoComplete="new-password"
                                                minLength={12}
                                                required
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="admin-reset-email">Email address</label>
                                    <div className="input-wrapper">
                                        <Mail size={18} />
                                        <input
                                            id="admin-reset-email"
                                            name="email"
                                            type="email"
                                            placeholder="Enter admin email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            autoComplete="email"
                                            required
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="login-button"
                                disabled={submitting || (isReset && !token)}
                            >
                                {submitting
                                    ? "Please wait..."
                                    : isReset
                                        ? "Reset password"
                                        : "Send reset link"}
                            </button>
                        </form>

                        <div className="login-back-link">
                            <Link to="/admin/login" className="login-link">
                                Back to sign in
                            </Link>
                        </div>
                    </>
                )}

                <div className="login-footer">
                    <Lock size={14} />
                    <span>Secure Bookstore Administration</span>
                </div>
            </div>
        </div>
    );
};

export default AdminPasswordReset;
