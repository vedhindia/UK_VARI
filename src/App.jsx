// import './App.css'
// import { Navigate, Route, Routes } from 'react-router-dom'
// import Header from './components/Header'
// import Footer from './components/Footer'
// import Home from './pages/Home'
// import Book from './pages/Book'
// import Contact from './pages/Contact'


// function App() {
//   return (
//     <>
//     <Header />
//       <Routes>
//       <Route path="/" element={<Home />} />
//         <Route path="/Book" element={<Book />} />
//         <Route path="/Contact" element={<Contact />} />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//     <Footer />
    
//     </>
  
//   )
// }

// export default App




import './App.css';
import './admin/styles/admin.css';

import {
    Navigate,
    Route,
    Routes,
    Outlet
} from 'react-router-dom';

// Existing customer website components
import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Book from './pages/Book';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';

// Admin context
import { AdminProvider } from './admin/context/AdminContext';

// Admin pages
import AdminLogin from './admin/pages/AdminLogin';
import AdminPasswordReset from './admin/pages/AdminPasswordReset';
import AdminRegister from './admin/pages/AdminRegister';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminManagementPage from './admin/pages/AdminManagementPage';

// Admin layout
import AdminLayout from './admin/layouts/AdminLayout';


// ======================================
// CUSTOMER WEBSITE LAYOUT
// ======================================

const WebsiteLayout = () => {
    return (
        <>
            <Header />

            <Outlet />

            <Footer />
        </>
    );
};


// ======================================
// ADMIN SECTION
// ======================================

const AdminSection = () => {
    return (
        <AdminProvider>

            <Routes>

                {/* Admin Login Page */}

                <Route
                    path="login"
                    element={<AdminLogin />}
                />

                <Route
                    path="forgot-password"
                    element={<AdminPasswordReset />}
                />

                <Route
                    path="reset-password"
                    element={<AdminPasswordReset isReset />}
                />


                {/* Protected Admin Layout */}

                <Route
                    element={<AdminLayout />}
                >

                    {/* Default Admin Route */}

                    <Route
                        index
                        element={
                            <Navigate
                                to="dashboard"
                                replace
                            />
                        }
                    />

                    {/* Admin Dashboard */}

                    <Route
                        path="dashboard"
                        element={<AdminDashboard />}
                    />

                    <Route path="books" element={<AdminManagementPage resource="books" />} />
                    <Route path="orders" element={<AdminManagementPage resource="orders" />} />
                    <Route path="inventory" element={<AdminManagementPage resource="inventory" />} />
                    <Route path="customers" element={<AdminManagementPage resource="customers" />} />
                    <Route path="payments" element={<AdminManagementPage resource="payments" />} />
                    <Route path="settings" element={<AdminManagementPage resource="settings" />} />

                    {/* Admin Registration */}

                    <Route
                        path="register"
                        element={<AdminRegister />}
                    />

                </Route>


                {/* Invalid Admin Routes */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/admin/login"
                            replace
                        />
                    }
                />

            </Routes>

        </AdminProvider>
    );
};


// ======================================
// MAIN APP
// ======================================

function App() {

    return (

        <Routes>

            {/* ADMIN PANEL */}

            <Route
                path="/admin/*"
                element={<AdminSection />}
            />


            {/* CUSTOMER WEBSITE */}

            <Route
                path="/"
                element={<WebsiteLayout />}
            >

                {/* Home Page */}

                <Route
                    index
                    element={<Home />}
                />

                {/* Books Page */}

                <Route
                    path="Book"
                    element={<Book />}
                />

                {/* Checkout Page */}

                <Route
                    path="checkout"
                    element={<Checkout />}
                />

                {/* Contact Page */}

                <Route
                    path="Contact"
                    element={<Contact />}
                />

                {/* Invalid Website Routes */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Route>

        </Routes>

    );
}

export default App;
