import React, { useEffect, useState, useRef } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChevronUpDownIcon,
  EyeIcon,
  ChevronDownIcon, // Added for dropdown
} from "@heroicons/react/24/outline";

import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../../../context/AuthContext";
import { useAdminRevenue } from "../Context/AdminContext";
import { URL } from "../../api";

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  
  // ✅ State for the action dropdown
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auth + admin data
  const { isAdmin, user, logout } = useAuth();
  const { todayOrdersCount } = useAdminRevenue();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${URL}/users`);
      const users = await res.json();
      let allOrders = [];
      users.forEach((u) => {
        if (u.orders && u.orders.length) {
          u.orders.forEach((o) =>
            allOrders.push({
              ...o,
              customerName: u.name,
              customerEmail: u.email,
            })
          );
        }
      });
      setOrders(allOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  
  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredOrders = orders
    .filter(
      (order) =>
        order.id?.toString().includes(search) ||
        order.customerName?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  const updateOrderStatus = async (orderId, customerEmail, newStatus) => {
    try {
      const res = await fetch(`${URL}/users?email=${customerEmail}`);
      const users = await res.json();
      if (!users.length) return;

      const userData = users[0];
      const updatedOrders = userData.orders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      );

      await fetch(`${URL}/users/${userData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: updatedOrders }),
      });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <AdminSidebar
        user={user}
        logout={logout}
        todayOrdersCount={todayOrdersCount}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex-1 p-6">
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-[#CC9966] text-white rounded"
          >
            ☰
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D9C5] p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-light tracking-wider text-[#1A1A1A]">Orders Management</h2>
              <p className="text-xs text-[#5A5A5A] tracking-wider">Manage and track all customer orders</p>
            </div>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-[#5A5A5A]" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-[#E5D9C5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#CC9966] focus:border-[#CC9966]"
              />
            </div>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 text-[#CC9966] animate-spin" />
              <p className="mt-2 text-sm text-[#5A5A5A]">Loading orders...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5D9C5]">
                <thead className="bg-[#F8F5F0]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer" onClick={() => requestSort("id")}>Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A]">Customer</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A] cursor-pointer" onClick={() => requestSort("placed_at")}>Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A]">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A]">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5D9C5]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF9F6]">
                      <td className="px-6 py-4">{order.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium">{order.customerName}</div>
                          <div className="text-xs text-gray-500">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">€{order.totalAmount}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "pending" ? "bg-yellow-100 text-yellow-600" :
                          order.status === "shipped" ? "bg-blue-100 text-blue-600" :
                          order.status === "delivered" ? "bg-green-100 text-green-600" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      {/* ✅ Action Dropdown */}
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block text-left" ref={openDropdownId === order.id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                          >
                            Actions
                            <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" />
                          </button>
                          {openDropdownId === order.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                  onClick={() => {
                                    updateOrderStatus(order.id, order.customerEmail, "shipped");
                                    setOpenDropdownId(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Mark as Shipped
                                </button>
                                <button
                                  onClick={() => {
                                    updateOrderStatus(order.id, order.customerEmail, "delivered");
                                    setOpenDropdownId(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Mark as Delivered
                                </button>
                                <button
                                  onClick={() => {
                                    updateOrderStatus(order.id, order.customerEmail, "cancelled");
                                    setOpenDropdownId(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  Cancel Order
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
