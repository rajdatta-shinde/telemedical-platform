import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    RiDashboardLine,
    RiUserHeartLine,
    RiCalendarCheckLine,
    RiUserAddLine,
    RiUserUnfollowLine,
    RiStethoscopeLine,
    RiLogoutBoxLine,
    RiMenuFoldLine,
    RiMenuUnfoldLine,
    RiArrowDownSLine,
    RiArrowRightSLine,
} from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { assets } from "../assets/assets";

const AdminSidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(true);

    // Doctor Management is a grouped section. Keep it expanded by default when
    // the active route already lives inside it so the admin can see where they are.
    const doctorMgmtPaths = ["/admin/add-doctor", "/admin/doctors", "/admin/remove-doctor"];
    const [doctorMgmtOpen, setDoctorMgmtOpen] = useState(
        doctorMgmtPaths.includes(location.pathname)
    );

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
        if (doctorMgmtPaths.includes(location.pathname)) {
            setDoctorMgmtOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const toggleSidebar = () => setIsOpen((prev) => !prev);

    const topItems = [
        { path: "/admin", icon: RiDashboardLine, label: "Dashboard" },
        { path: "/admin/appointments", icon: RiCalendarCheckLine, label: "All Appointments" },
    ];

    const doctorMgmtItems = [
        { path: "/admin/add-doctor", icon: RiUserAddLine, label: "Add Doctor" },
        { path: "/admin/remove-doctor", icon: RiUserUnfollowLine, label: "Remove Doctor" },
        { path: "/admin/doctors", icon: RiUserHeartLine, label: "Doctors List" },
    ];

    const renderLink = (item, extraClass = "") => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
            <Link
                to={item.path}
                className={`flex items-center space-x-4 px-5 py-4 rounded-lg transition-all ${extraClass} ${
                    isActive
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                }`}
            >
                <Icon className="text-2xl" />
                <span className="font-medium text-base">{item.label}</span>
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-300 lg:hidden ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={toggleSidebar}
            />

            {/* Sidebar panel — slides fully off-screen when collapsed */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Logo and Collapse Button */}
                <div className="py-8 px-6 flex items-center justify-between border-b border-gray-200">
                    <Link to="/admin" className="flex items-center gap-3">
                        <img src={assets.logo} alt="Logo" className="h-14 w-auto max-w-[220px]" />
                        <span className="text-xs font-medium text-gray-500 border border-gray-400 rounded-full px-3 py-0.5">
                            Admin
                        </span>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Collapse sidebar"
                    >
                        <RiMenuFoldLine size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6">
                    <ul className="px-4 space-y-2">
                        {topItems.map((item) => (
                            <li key={item.path}>{renderLink(item)}</li>
                        ))}

                        {/* Doctor Management group */}
                        <li>
                            <button
                                type="button"
                                onClick={() => setDoctorMgmtOpen((prev) => !prev)}
                                className={`w-full flex items-center justify-between px-5 py-4 rounded-lg transition-all ${
                                    doctorMgmtPaths.includes(location.pathname)
                                        ? "text-primary bg-primary/5"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                                }`}
                                aria-expanded={doctorMgmtOpen}
                            >
                                <span className="flex items-center space-x-4">
                                    <RiStethoscopeLine className="text-2xl" />
                                    <span className="font-medium text-base">Doctor Management</span>
                                </span>
                                {doctorMgmtOpen ? (
                                    <RiArrowDownSLine className="text-xl" />
                                ) : (
                                    <RiArrowRightSLine className="text-xl" />
                                )}
                            </button>

                            {doctorMgmtOpen && (
                                <ul className="mt-2 ml-4 space-y-1 border-l-2 border-gray-100 pl-3">
                                    {doctorMgmtItems.map((item) => (
                                        <li key={item.path}>{renderLink(item, "py-3")}</li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary transition-all"
                    >
                        <RiLogoutBoxLine className="text-xl" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Floating Open Button — stays reachable when the sidebar is hidden */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="fixed top-4 left-4 z-30 h-11 w-11 flex items-center justify-center bg-white shadow-md border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Open sidebar"
                >
                    <RiMenuUnfoldLine size={20} />
                </button>
            )}
        </>
    );
};

export default AdminSidebar;
