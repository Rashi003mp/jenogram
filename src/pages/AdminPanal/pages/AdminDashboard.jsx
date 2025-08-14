import React, { useState, useEffect, useRef } from 'react';
import { useAdminRevenue } from '../Context/AdminContext';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom'; // ✅ Import Link for navigation
import AdminSidebar from '../components/AdminSidebar';
import RecentOrders from '../components/RecentOrders';
import UsersOrdersByMonthChart from '../components/UsersOrdersByDayChart';
import RevenueByDayChart from '../components/RevenueByDayChart';
import { ArrowPathIcon, BellIcon, ChartBarIcon, ShoppingCartIcon, CubeIcon, ClockIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false); // ✅ Added mobile sidebar state
  const { isAdmin, user, logout } = useAuth();

  // ✅ State for the notification inbox dropdown
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const inboxRef = useRef(null);

  const {
    totalRevenue,
    todayRevenue,
    orderCount,
    loading,
    todayOrdersCount,
    reloadOrders,
    todayPiecesSold,
    orders, // Assuming 'orders' is available from your context
  } = useAdminRevenue();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ✅ Toggle the inbox dropdown
  const handleAlert = () => {
    setIsInboxOpen(!isInboxOpen);
  };
  
  // ✅ Logic to get the last 4 orders of the day
  const recentDailyOrders = orders
    .filter(order => new Date(order.placed_at).toDateString() === new Date().toDateString())
    .sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at))
    .slice(0, 4);

  // ✅ Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inboxRef.current && !inboxRef.current.contains(event.target)) {
        setIsInboxOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inboxRef]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
        <h2 className="text-2xl font-light">Access Denied — Admin Only</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <AdminSidebar
        user={user}
        logout={logout}
        todayOrdersCount={todayOrdersCount}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen} // Pass state for mobile
        setIsMobileOpen={setIsMobileOpen} // Pass setter for mobile
      />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-white shadow-sm border-b border-[#E5D9C5] sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              {/* Mobile hamburger button */}
              <button onClick={() => setIsMobileOpen(true)} className="p-2 mr-4 md:hidden text-gray-500">
                ☰
              </button>
              <div>
                <h2 className="text-xl font-light">ADMINISTRATOR DASHBOARD</h2>
                <p className="text-xs text-[#5A5A5A]">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={reloadOrders}
                className="flex items-center space-x-1 text-[#5A5A5A] hover:text-[#CC9966]"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </button>
              
              {/* ✅ Notification Bell with Dropdown */}
              <div className="relative" ref={inboxRef}>
                <button onClick={handleAlert} className="p-2 text-gray-400 hover:text-[#CC9966] relative">
                  <BellIcon className="w-5 h-5" />
                  {todayOrdersCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#CC9966] rounded-full"></span>}
                </button>
                {isInboxOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[#E5D9C5] z-30">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">Today's Orders</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {recentDailyOrders.length > 0 ? (
                        recentDailyOrders.map(order => (
                          <Link to="/adminorders" key={order.id} className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                              <p className="text-sm text-gray-600">€{order.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              <span>{new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No new orders today.
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 rounded-b-lg">
                      <Link to="/adminorders" className="block w-full text-center text-sm text-[#CC9966] hover:underline">
                        View All Orders
                      </Link>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        <main className="p-6">
          {/* ... Rest of your dashboard content (stats, charts, etc.) remains the same ... */}
          <div className="bg-gradient-to-r from-[#F8F5F0] to-[#F1E9DC] rounded-lg p-6 mb-6 border border-[#E5D9C5]">
            <div className="flex justify-between">
              <div>
                <h1 className="text-2xl font-light mb-2">Welcome, {user?.name}</h1>
                <p className="text-[#5A5A5A]">Today's overview of your luxury maison.</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#5A5A5A]">TODAY</p>
                <p className="text-lg font-light">{currentDate}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded border shadow-sm">
              <ChartBarIcon className="w-6 h-6 text-[#CC9966] mb-3" />
              <p className="text-2xl font-light">€{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-[#5A5A5A]">Total Revenue</p>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <ChartBarIcon className="w-6 h-6 text-[#CC9966] mb-3" />
              <p className="text-2xl font-light">€{todayRevenue.toLocaleString()}</p>
              <p className="text-xs text-[#5A5A5A]">Today's Revenue</p>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <ShoppingCartIcon className="w-6 h-6 text-[#CC9966] mb-3" />
              <p className="text-2xl font-light">{todayOrdersCount}</p>
              <p className="text-xs text-[#5A5A5A]">Orders Today</p>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <CubeIcon className="w-6 h-6 text-[#CC9966] mb-3" />
              <p className="text-2xl font-light">{todayPiecesSold}</p>
              <p className="text-xs text-[#5A5A5A]">Pieces Sold</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <RevenueByDayChart />
              <RecentOrders />
            </div>
            <div>
              <UsersOrdersByMonthChart />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
