// src/components/RecentOrders.jsx
import React from "react";
import { useAdminRevenue } from "../Context/AdminContext";

// helper - get initials from a name
const getInitials = (name) => {
  return name
    ? name.split(" ").map(n => n[0]?.toUpperCase()).join("")
    : "?";
};

// helper - time ago
const timeAgo = (dateString) => {
  if (!dateString) return "unknown";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  return `${Math.floor(diffHrs / 24)} days ago`;
};

// helper - status styling
const getStatusStyle = (status) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return { text: "#5A8F5E", bg: "#E8F5E9" };
    case "processing":
      return { text: "#FFA000", bg: "#FFF8E1" };
    case "pending":
      return { text: "#1976D2", bg: "#E3F2FD" };
    case "cancelled":
    case "canceled":
      return { text: "#D32F2F", bg: "#FFEBEE" };
    default:
      return { text: "#555", bg: "#EEE" };
  }
};

export default function RecentOrders({ limit = 5 }) {
  const { orders, loading } = useAdminRevenue();
console.log(orders);

  if (loading) return <div>Loading recent orders...</div>;
  if (!orders || orders.length === 0) return <div>No orders found.</div>;

  // sort latest first (use createdOn or placed_at)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdOn ?? b.placed_at) - new Date(a.createdOn ?? a.placed_at))
    .slice(0, limit);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-light tracking-wider text-gray-900">
              Recent Orders
            </h3>
            <p className="text-xs text-gray-600 tracking-wider">
              Latest haute couture purchases
            </p>
          </div>
          <button className="text-xs font-light text-[#CC9966] hover:text-[#B38658] tracking-wider">
            VIEW ALL
          </button>
        </div>
      </div>

      {/* Orders list */}
      <div className="divide-y divide-gray-100">
        {recentOrders.map((order) => {
          // build customer name (prefer address fullName, then order.name)
          const customerName =order.name

            

          const firstProduct =order.items?.[0] ?? null;
          const productDisplay =
            (order.cart?.length === 1 || order.items?.length === 1)
              ? firstProduct?.name ?? firstProduct?.productName ?? "Item"
              : `${firstProduct?.name ?? firstProduct?.productName ?? "Item"} +${(order.cart?.length ?? order.items?.length) - 1} more`;

          const statusStyle = getStatusStyle(order.status ?? order.orderStatus ?? "");

          return (
            <div
              key={order.id}
              className="p-6 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {/* Avatar initials */}
                <div className="w-10 h-10 bg-[#F8F5F0] rounded-full flex items-center justify-center">
                  <span className="text-[#CC9966] text-xs font-medium tracking-wider">
                    {getInitials(customerName)}
                  </span>
                </div>

                {/* Customer + order info */}
                <div>
                  <p className="font-light tracking-wider text-gray-900">
                    {customerName}
                  </p>
                  <p className="text-xs text-gray-600 tracking-wider">
                    {productDisplay}
                  </p>
                  <p className="text-xs text-gray-400 tracking-wider">
                    #{order.id} • {timeAgo(order.createdOn ?? order.placed_at)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-light tracking-wider text-gray-900">
                  ₹{Number(order.totalAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <span
                  className="inline-block px-2 py-1 text-xs font-medium rounded tracking-wider"
                  style={{
                    color: statusStyle.text,
                    backgroundColor: statusStyle.bg,
                  }}
                >
                  {(order.status ?? order.orderStatus ?? "UNKNOWN").toString().toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
