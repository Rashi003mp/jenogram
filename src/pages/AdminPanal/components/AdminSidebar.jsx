import React from "react";
import { Link } from "react-router-dom";
import {
  ChartBarIcon,
  ShoppingCartIcon,
  RectangleStackIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowLeftOnRectangleIcon // Logout icon
} from '@heroicons/react/24/outline';

const AdminSidebar = ({
  user,
  todayOrdersCount,
  isSidebarCollapsed,
  toggleSidebar,
  isMobileOpen,
  setIsMobileOpen,
  logout // Receive logout function as a prop
}) => {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <div
        className={`
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
          bg-[#1A1A1A] text-white transition-all duration-300
          flex-shrink-0 h-screen sticky top-0
          z-40 flex flex-col
          ${isMobileOpen ? 'fixed left-0 top-0 h-full' : 'hidden md:flex'}
        `}
      >
        {/* Main Nav Section */}
        <div className="flex-1 overflow-y-auto">
          {/* Logo & admin info */}
          <div className="p-4 border-b border-[#333333]">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-[#CC9966] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-semibold text-[#CC9966] text-sm truncate">
                    {user?.name || 'Admin'}
                  </h1>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Nav links */}
          <nav className="mt-6">
            <div className="space-y-1 px-2">
              <Link
                to="/admindashboard"
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3'} text-gray-300 hover:bg-[#333333] hover:text-[#CC9966] rounded-md transition-colors duration-200`}
              >
                <ChartBarIcon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="ml-3 text-sm tracking-wider">Dashboard</span>}
              </Link>
              <Link
                to="/admincollection"
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3'} text-gray-300 hover:bg-[#333333] hover:text-[#CC9966] rounded-md transition-colors duration-200`}
              >
                <RectangleStackIcon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="ml-3 text-sm tracking-wider">Collections</span>}
              </Link>
              <Link
                to="/adminorders"
                className={`relative flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3'} text-gray-300 hover:bg-[#333333] hover:text-[#CC9966] rounded-md transition-colors duration-200`}
              >
                <ShoppingCartIcon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between w-full ml-3">
                    <span className="text-sm tracking-wider">Orders</span>
                    {todayOrdersCount > 0 && (
                      <span className="bg-[#CC9966] text-white text-xs px-2 py-0.5 rounded-full">
                        {todayOrdersCount}
                      </span>
                    )}
                  </div>
                )}
                 {isSidebarCollapsed && todayOrdersCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#CC9966] rounded-full" />
                )}
              </Link>
              <Link
                to="/adminclient"
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3'} text-gray-300 hover:bg-[#333333] hover:text-[#CC9966] rounded-md transition-colors duration-200`}
              >
                <UserGroupIcon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="ml-3 text-sm tracking-wider">Clients</span>}
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom section: Logout and Collapse */}
        <div className="p-2 border-t border-[#333333]">
          {/* Logout Button */}
          <button
            onClick={logout}
            className={`flex items-center w-full ${isSidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3'} text-gray-300 hover:bg-[#333333] hover:text-red-500 rounded-md transition-colors duration-200`}
            aria-label="Logout"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <span className="ml-3 text-sm tracking-wider">Logout</span>
            )}
          </button>
          
          {/* Collapse toggle */}
          <div className={`flex mt-2 ${isSidebarCollapsed ? 'justify-center' : 'justify-end pr-2'}`}>
            <button
              onClick={toggleSidebar}
              className="bg-[#CC9966] text-white p-1 rounded-full shadow-md hover:bg-[#B38658] transition-colors duration-200"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronDoubleRightIcon className="w-4 h-4" />
              ) : (
                <ChevronDoubleLeftIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
