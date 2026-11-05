
import { useState } from "react";

import {
    UserPlus,
    User,
    Mail,
    Lock,
    Phone
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { adminApi } from "../services/adminApi";

const AdminRegister = () => {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 12) {
            setError("Password must contain at least 12 characters");
            return;
        }

        setLoading(true);

        try {

            const response = await adminApi(
                "/admin/register",
                {
                    method: "POST",

                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        password: formData.password,
                        role: "admin"
                    })
                }
            );

            setSuccess(response.message);

            setFormData({
                name: "",
                email: "",
                phone: "",
                password: "",
                confirmPassword: ""
            });

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);
        }
    };

    return (

        <div className="register-page">

            <div className="register-heading">

                <div>
                    <h1>Create Admin Account</h1>

                    <p>
                        Add a new administrator to your bookstore.
                    </p>
                </div>

            </div>

            <div className="register-card">

                <div className="register-card-heading">

                    <div className="register-icon">
                        <UserPlus size={25} />
                    </div>

                    <div>
                        <h2>Admin Information</h2>

                        <p>
                            Enter the new administrator details.
                        </p>
                    </div>

                </div>

                <form onSubmit={handleSubmit}>

                    {/* NAME */}

                    <div className="form-group">

                        <label>Full Name</label>

                        <div className="input-wrapper">

                            <User size={18} />

                            <input
                                type="text"
                                name="name"
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    </div>

                    {/* EMAIL */}

                    <div className="form-group">

                        <label>Email Address</label>

                        <div className="input-wrapper">

                            <Mail size={18} />

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    </div>

                    {/* PHONE */}

                    <div className="form-group">

                        <label>Phone Number</label>

                        <div className="input-wrapper">

                            <Phone size={18} />

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                    {/* PASSWORD */}

                    <div className="form-group">

                        <label>Password</label>

                        <div className="input-wrapper">

                            <Lock size={18} />

                            <input
                                type="password"
                                name="password"
                                placeholder="Minimum 12 characters"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                        </div>

                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div className="form-group">

                        <label>Confirm Password</label>

                        <div className="input-wrapper">

                            <Lock size={18} />

                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                        </div>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="login-error" role="alert">
                            {error}
                        </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                        <div className="register-success" role="status">
                            {success}
                        </div>
                    )}

                    <div className="register-actions">

                        <button
                            type="button"
                            className="register-cancel"
                            onClick={() => navigate("/admin/dashboard")}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Admin"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default AdminRegister;
