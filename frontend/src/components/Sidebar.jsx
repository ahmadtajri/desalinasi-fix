import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ChevronLeft, ChevronRight, Activity, X } from 'lucide-react';
import logoIcon from '../assets/icons/icon-x192.png';
import useBackendStatus from '../hooks/useBackendStatus';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const { isOnline, isChecking } = useBackendStatus(5000); // Check every 5 seconds

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/report', label: 'Report', icon: FileText },
    ];

    // Determine status color and text based on backend connection
    const statusColor = isOnline ? 'green' : 'red';
    const statusText = isChecking ? 'Checking...' : (isOnline ? 'System Online' : 'System Offline');
    const statusSubtext = isOnline ? 'Connected' : 'Not Running';

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            setIsMobileOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div
                className={`
                    fixed md:relative inset-y-0 left-0 z-50
                    bg-white border-r border-gray-200 flex flex-col 
                    transition-all duration-300 ease-in-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    ${isCollapsed ? 'md:w-20' : 'md:w-72'}
                    w-72
                `}
            >
                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-9 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors z-10"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden absolute right-4 top-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                    <X size={20} />
                </button>

                {/* Header / Logo */}
                <div className={`p-6 border-b border-gray-100 flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-4'}`}>
                    <div className="shrink-0">
                        <img src={logoIcon} alt="Logo" className="w-16 h-16 rounded-xl shadow-md" />
                    </div>

                    <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
                        <h2 className="text-xl font-bold text-gray-800">IoT Monitor</h2>
                        <p className="text-xs text-gray-500">Sistem Desalinasi</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 mt-2 overflow-y-auto">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={handleLinkClick}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${isActive(item.path)
                                        ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        } ${isCollapsed ? 'md:justify-center' : ''}`}
                                >
                                    <item.icon
                                        size={22}
                                        className={`shrink-0 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}
                                    />

                                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
                                        {item.label}
                                    </span>

                                    {/* Tooltip for collapsed mode */}
                                    {isCollapsed && (
                                        <div className="hidden md:block absolute left-full ml-4 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl">
                                            {item.label}
                                            {/* Arrow */}
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                                        </div>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer Status - Dynamic based on backend connection */}
                <div className="p-4 border-t border-gray-100 mt-auto">
                    <div className={`bg-gray-50 rounded-xl transition-all duration-300 ${isCollapsed ? 'md:p-3 md:flex md:justify-center' : 'p-4'}`}>
                        <div className={`${isCollapsed ? 'md:hidden' : 'block'}`}>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-3">System Status</p>
                            <div className={`flex items-center gap-3 bg-white p-2.5 rounded-lg border shadow-sm transition-colors ${isOnline ? 'border-green-100' : 'border-red-100'
                                }`}>
                                <div className="relative shrink-0">
                                    <div className={`w-3 h-3 bg-${statusColor}-500 rounded-full`}></div>
                                    {isOnline && (
                                        <div className={`w-3 h-3 bg-${statusColor}-500 rounded-full animate-ping absolute top-0 left-0 opacity-75`}></div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isOnline ? 'text-gray-700' : 'text-red-600'}`}>
                                        {statusText}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate">{statusSubtext}</p>
                                </div>
                            </div>
                        </div>

                        {/* Collapsed Icon Mode (Desktop Only) */}
                        <div className={`hidden ${isCollapsed ? 'md:block' : ''} relative group cursor-help`}>
                            <Activity size={20} className={`text-${statusColor}-500`} />
                            <div className={`w-2 h-2 bg-${statusColor}-500 rounded-full absolute -top-0.5 -right-0.5 ${isOnline ? 'animate-pulse' : ''}`}></div>

                            {/* Tooltip */}
                            <div className="absolute left-full ml-4 bottom-0 px-3 py-2 bg-white border border-gray-100 text-gray-700 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl">
                                <p className={`font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>{statusText}</p>
                                <p className="text-gray-400">{statusSubtext}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
