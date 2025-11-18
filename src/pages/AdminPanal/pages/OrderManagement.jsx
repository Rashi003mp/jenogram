// src/pages/OrdersManagement.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
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

  // dropdown state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // auth + admin
  const { isAdmin, user, logout, token } = useAuth();
  const { todayOrdersCount } = useAdminRevenue();

  // ---- Enum mapping (must match backend's enum order, kept for potential numeric use) ----
  const OrderStatusEnum = {
    Pending: 0,
    Processing: 1,
    Shipped: 2,
    Delivered: 3,
    Cancelled: 4,
  };

  // normalize a single order DTO to UI-friendly shape
  const normalizeOrder = (o) => {
    if (!o) return null;
    const createdOn = o.createdOn ?? o.CreatedOn ?? o.placed_at ?? o.PlacedAt ?? o.created ?? null;
    const status = (o.orderStatus ?? o.OrderStatus ?? o.status ?? "").toString();
    const totalAmount = Number(o.totalAmount ?? o.TotalAmount ?? o.Total ?? 0);
    const items = o.items ?? o.Items ?? [];
    const customerName = (o.name && o.name.toString()) ||
                         (o.address?.fullName && o.address.fullName.toString()) ||
                         (o.shipping?.fullName && o.shipping.fullName.toString()) ||
                         "Unknown";

    return {
      id: o.id ?? o.Id ?? null,
      userId: o.userId ?? o.UserId ?? null,
      customerName,
      customerEmail: o.contact?.email ?? o.email ?? o.contactEmail ?? null,
      placed_at: createdOn,
      createdOn,
      status,
      totalAmount,
      items,
      raw: o,
    };
  };

  // fetch from admin endpoint (paged)
  const fetchOrders = async (pageNumber = 1, limit = 10) => {
    setLoading(true);
    try {
      const adminUrl = `${URL}/Order/all?pageNumber=${pageNumber}&limit=${limit}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let res = await fetch(adminUrl, { headers });

      // if restricted, try /Order fallback
      if (res.status === 401 || res.status === 403) {
        const fallback = `${URL}/Order`;
        res = await fetch(fallback, { headers });
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Failed to fetch orders:", res.status, txt);
        setOrders([]);
        return;
      }

      const body = await res.json().catch(() => null);

      // extract array from common ApiResponse<PagedResult<OrderResponseDTO>>
      let orderDtos = [];
      if (body) {
        if (body.data) {
          const inner = body.data;
          if (Array.isArray(inner.items)) orderDtos = inner.items;
          else if (Array.isArray(inner.Items)) orderDtos = inner.Items;
          else if (Array.isArray(inner)) orderDtos = inner;
          else if (Array.isArray(body.data)) orderDtos = body.data;
          else orderDtos = inner.Items ?? inner.items ?? [];
        } else if (Array.isArray(body.items)) {
          orderDtos = body.items;
        } else if (Array.isArray(body.Items)) {
          orderDtos = body.Items;
        } else if (Array.isArray(body)) {
          orderDtos = body;
        } else {
          orderDtos = body.Items ?? body.items ?? [];
        }
      }

      if (!Array.isArray(orderDtos)) orderDtos = [];

      const normalized = orderDtos.map(normalizeOrder).filter(Boolean);
      setOrders(normalized);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // search + sort
  const filteredOrders = (orders || [])
    .filter((order) => {
      if (!order) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        order.id?.toString().includes(q) ||
        (order.customerName && order.customerName.toLowerCase().includes(q)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const ka = a[sortConfig.key];
      const kb = b[sortConfig.key];

      if (sortConfig.key === "placed_at" || sortConfig.key === "createdOn") {
        const da = ka ? new Date(ka) : new Date(0);
        const db = kb ? new Date(kb) : new Date(0);
        return sortConfig.direction === "asc" ? da - db : db - da;
      }

      if (ka == null && kb == null) return 0;
      if (ka == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (kb == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (ka < kb) return sortConfig.direction === "asc" ? -1 : 1;
      if (ka > kb) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  // ---- update order status using the exact controller route ----
  // POST /admin/update-status/{orderId}?newStatus=Shipped
  const updateOrderStatus = async (orderId, newStatusName) => {
    if (!orderId || !newStatusName) return;

    setLoading(true);
    try {
      // Construct the exact route your controller exposes
      const url = `${URL}/Order/admin/update-status/${orderId}?newStatus=${encodeURIComponent(newStatusName)}`;

      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // no body required; server reads newStatus from query param
      };

      const res = await fetch(url, {
        method: "POST",
        headers,
      });

      if (res.ok) {
        // success - refresh orders
        await fetchOrders();
        console.log(`Order ${orderId} updated to ${newStatusName}`);
      } else {
        // log server response for debugging
        const text = await res.text().catch(() => "");
        console.error("Failed to update order status", res.status, text);
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setLoading(false);
      setOpenDropdownId(null);
    }
  };

  // format helper for currency
  const formatCurrency = (v) => {
    const n = Number(v || 0);
    return `₹${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
        <h2 className="text-xl text-red-500">Access Denied</h2>
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
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer"
                      onClick={() => requestSort("id")}
                    >
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A]">Customer</th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A] cursor-pointer"
                      onClick={() => requestSort("placed_at")}
                    >
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A]">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A]">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5D9C5]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id ?? JSON.stringify(order.raw)} className="hover:bg-[#FAF9F6]">
                      <td className="px-6 py-4">{order.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium">{order.customerName}</div>
                          {order.customerEmail && <div className="text-xs text-gray-500">{order.customerEmail}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-600" :
                          order.status?.toLowerCase() === "shipped" ? "bg-blue-100 text-blue-600" :
                          order.status?.toLowerCase() === "delivered" ? "bg-green-100 text-green-600" :
                          order.status?.toLowerCase() === "cancelled" ? "bg-red-100 text-red-600" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {order.status?.toString() ? order.status.toString().toUpperCase() : "UNKNOWN"}
                        </span>
                      </td>

                      {/* Action Dropdown */}
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block text-left" ref={openDropdownId === order.id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                            disabled={loading}
                          >
                            Actions
                            <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" />
                          </button>

                          {openDropdownId === order.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                  onClick={() => updateOrderStatus(order.id, "Shipped")}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  disabled={loading}
                                >
                                  Mark as Shipped
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order.id, "Delivered")}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  disabled={loading}
                                >
                                  Mark as Delivered
                                </button>
                                {/* <button
                                  onClick={() => updateOrderStatus(order.id, "Cancelled")}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  disabled={loading}
                                >
                                  Cancel Order
                                </button> */}
                                {/* <button
                                  onClick={() => {
                                    const id = order.id;
                                    window.open(`/admin/orders/${id}`, "_blank");
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  disabled={loading}
                                >
                                  View Details
                                </button> */}
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
