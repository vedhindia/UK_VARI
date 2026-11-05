
import { useState } from "react";

import {
    Menu,
    ChevronDown
} from "lucide-react";

import { useAdmin } from "../context/AdminContext";

const AdminHeader = ({ onMenuClick }) => {

    const { admin } = useAdmin();

    const [showProfile, setShowProfile] = useState(false);

    return (

        <header className="admin-header">

            {/* MOBILE MENU */}

            <button
                className="menu-button"
                onClick={onMenuClick}
                aria-label="Open sidebar"
            >
                <Menu size={23} />
            </button>

            {/* ADMIN PROFILE */}

            <div className="header-right">

                <div className="admin-profile">

                    <div className="profile-avatar">
                        {admin?.name?.charAt(0).toUpperCase()}
                    </div>

                    <button
                        className="profile-button"
                        onClick={() =>
                            setShowProfile(!showProfile)
                        }
                    >

                        <span>
                            <strong>{admin?.name}</strong>

                            <small>{admin?.role}</small>
                        </span>

                        <ChevronDown size={16} />

                    </button>

                    {showProfile && (

                        <div className="profile-dropdown">

                            <strong>{admin?.name}</strong>

                            <small>{admin?.email}</small>

                        </div>

                    )}

                </div>

            </div>

        </header>
    );
};

export default AdminHeader;
