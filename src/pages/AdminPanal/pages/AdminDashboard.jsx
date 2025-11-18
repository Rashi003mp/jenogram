// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAdminRevenue } from '../Context/AdminContext';
import { useAuth } from '../../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import RecentOrders from '../components/RecentOrders';
import UsersOrdersByMonthChart from '../components/UsersOrdersByDayChart';
import RevenueByDayChart from '../components/RevenueByDayChart';
import {
  ArrowPathIcon,
  BellIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  CubeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAdmin, user, logout } = useAuth();
  const {
    totalRevenue = 0,
    todayRevenue = 0,
    orderCount = 0,
    loading,
    todayOrdersCount = 0,
    reloadOrders,
    todayPiecesSold = 0,
    orders = []
  } = useAdminRevenue();

  const inboxRef = useRef(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const navigate = useNavigate();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const handleAlert = () => setIsInboxOpen(!isInboxOpen);

  // helper to get a readable customer name
  const getCustomerName = (order) => {
    return (
      (order?.shipping?.fullName && order.shipping.fullName.trim()) ||
      (order?.name && order.name.toString().trim()) ||
      (order?.address?.fullName && order.address.fullName.trim()) ||
      'Unknown'
    );
  };

  // safe parse date helper
  const parseOrderDate = (order) => {
    const d = order?.createdOn ?? order?.placed_at ?? order?._raw?.createdOn ?? null;
    const date = d ? new Date(d) : null;
    return isNaN(date?.getTime?.()) ? null : date;
  };

  // last 4 orders of today (defensive: orders may be undefined)
  const recentDailyOrders = (orders || [])
    .filter(order => {
      const date = parseOrderDate(order);
      return date && date.toDateString() === new Date().toDateString();
    })
    .sort((a, b) => {
      const da = parseOrderDate(a) || new Date(0);
      const db = parseOrderDate(b) || new Date(0);
      return db - da;
    })
    .slice(0, 4);

  // click outside to close inbox dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inboxRef.current && !inboxRef.current.contains(event.target)) {
        setIsInboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inboxRef]);

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
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-white shadow-sm border-b border-[#E5D9C5] sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
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

              {/* Notification Bell with Dropdown */}
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
                        recentDailyOrders.map(order => {
                          const customerName = getCustomerName(order);
                          const orderDate = parseOrderDate(order);
                          const timeString = orderDate
                            ? orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—';
                          return (
                            <Link to="/adminorders" key={order.id} className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-gray-800">{customerName}</p>
                                <p className="text-sm text-gray-600">₹{Number(order.totalAmount || 0).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                <span>{timeString}</span>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No new orders today.
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 rounded-b-lg">
                      <button
                        onClick={() => { setIsInboxOpen(false); navigate('/adminorders'); }}
                        className="block w-full text-center text-sm text-[#CC9966] hover:underline"
                      >
                        View All Orders
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        <main className="p-6">
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
              <p className="text-2xl font-light">₹{Number(totalRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-[#5A5A5A]">Total Revenue</p>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <ChartBarIcon className="w-6 h-6 text-[#CC9966] mb-3" />
              <p className="text-2xl font-light">₹{Number(todayRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-[#5A5A5A]">Today's Revenue</p>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <ShoppingCartIcon className="w-6 h-6 text-[#CC9966] mb-3" />
              <p className="text-2xl font-light">{Number(todayOrdersCount || 0)}</p>
              <p className="text-xs text-[#5A5A5A]">Orders Today</p>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <CubeIcon className="w-6 h-6 text-[#CC9966] mb-3" />
              <p className="text-2xl font-light">{Number(todayPiecesSold || 0)}</p>
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
