// src/pages/FetchOrderList.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const USER_ORDERS_URL = "https://localhost:7255/api/Order";
const CANCEL_ORDER_URL = (orderId) => `https://localhost:7255/api/Order/cancel/${orderId}`;

const formatDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

const money = (n) => {
  if (n == null) return "₹0";
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

const StatusPill = ({ status = "" }) => {
  const s = (status || "unknown").toString().toLowerCase();
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const cls = map[s] || "bg-gray-100 text-gray-800";
  const label = (status || "Unknown").toString();
  return (
    <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
};

const SkeletonOrder = () => (
  <div className="animate-pulse border border-gray-100 bg-white rounded-lg p-6">
    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-40 bg-gray-200 rounded" />
    </div>
  </div>
);

/*
  If your backend returns numeric enums, set the mapping here.
  Example mapping (adjust to your actual enum values):
    0 => Pending
    1 => Processing
    2 => Paid
    3 => Shipped
    4 => Delivered
    5 => Cancelled
*/
const statusEnumMap = {
  0: "Pending",
  1: "Processing",
  2: "Paid",
  3: "Shipped",
  4: "Delivered",
  5: "Cancelled",
};

const normalizeStatus = (status) => {
  // Accept strings like "Pending" or numbers like 0
  if (status == null) return "unknown";
  if (typeof status === "number") {
    return statusEnumMap[status] ?? String(status);
  }
  // sometimes backend sends objects like { value: 0 } - handle common cases defensively
  if (typeof status === "object") {
    if ("value" in status) return normalizeStatus(status.value);
    if ("name" in status) return String(status.name);
    return "unknown";
  }
  return String(status);
};

// now allows pending or processing (case-insensitive) whether status is string or mapped number
const isCancellable = (statusRaw) => {
  const status = normalizeStatus(statusRaw).toString().toLowerCase();
  return status === "pending" || status === "processing";
};

const getOrderId = (order) => order.id ?? order.orderId ?? order.idValue ?? 0;

const FetchOrderList = () => {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const abortRef = useRef(null);

  const fetchOrders = useCallback(async (opts = {}) => {
    setLoading(true);
    setError("");
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      if (!isAuthenticated || !token) {
        setError("You must be logged in to view your orders.");
        setOrders([]);
        return;
      }

      const res = await fetch(USER_ORDERS_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      if (!res.ok) {
        let errBody = null;
        try { errBody = await res.json(); } catch {}
        const message = errBody?.message || `Failed to fetch orders (status ${res.status})`;
        throw new Error(message);
      }

      const payload = await res.json().catch(() => null);
      const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("fetchOrders error:", err);
      setError(err?.message || "Could not fetch orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchOrders();
    const handler = () => fetchOrders();
    window.addEventListener("ordersUpdated", handler);
    return () => {
      window.removeEventListener("ordersUpdated", handler);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchOrders]);

  const cancelOrder = async (rawOrder) => {
    const orderId = getOrderId(rawOrder);
    if (!orderId) return;

    const ok = window.confirm("Cancel this order? This action cannot be undone.");
    if (!ok) return;

    if (!token || !isAuthenticated) {
      toast.error("You must be logged in to cancel an order.");
      return;
    }

    const statusRaw = rawOrder.orderStatus ?? rawOrder.status ?? rawOrder.order_status ?? rawOrder.statusId ?? null;
    if (!isCancellable(statusRaw)) {
      toast.error("Only pending or processing orders can be cancelled.");
      return;
    }

    setCancellingOrderId(orderId);

    try {
      const res = await fetch(CANCEL_ORDER_URL(orderId), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      let payload = null;
      try { payload = await res.json(); } catch {}

      if (!res.ok) {
        const msg = payload?.message || `Cancel failed (status ${res.status})`;
        throw new Error(msg);
      }

      const okResp = payload?.data === true || payload?.statusCode === 200 || res.status === 200;
      if (!okResp) {
        throw new Error(payload?.message || "Cancel failed");
      }

      // reflect cancellation locally
      setOrders((prev) =>
        prev.map((o) => {
          if (getOrderId(o) === orderId) {
            return {
              ...o,
              orderStatus: "Cancelled",
              status: "Cancelled",
            };
          }
          return o;
        })
      );

      toast.success(payload?.message ?? "Order cancelled.");
      window.dispatchEvent(new Event("ordersUpdated"));
    } catch (err) {
      console.error("cancelOrder error:", err);
      if (err?.message?.toLowerCase().includes("401") || err?.message?.toLowerCase().includes("unauthorized")) {
        toast.error("You are not authorized to cancel this order.");
      } else {
        toast.error(err?.message || "Could not cancel order. Try again.");
      }
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="w-full max-w-4xl space-y-4">
          <SkeletonOrder />
          <SkeletonOrder />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-700 mb-4">{error}</p>
          <button onClick={() => fetchOrders()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-neutral-50 p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-xl">
          <h3 className="text-2xl font-semibold mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">Looks like you haven't placed any orders. Discover something you love.</p>
          <button onClick={() => (window.location.href = "/products")} className="px-6 py-3 bg-black text-cream-50 rounded-md hover:opacity-95">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Your Orders</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchOrders()} className="text-sm px-3 py-2 border rounded-md hover:bg-white/60">Refresh</button>
          </div>
        </header>

        <div className="space-y-6">
          {orders.slice().reverse().map((order) => {
            const id = getOrderId(order);
            const rawStatus = order.orderStatus ?? order.status ?? order.order_status ?? order.statusId ?? null;
            const status = normalizeStatus(rawStatus);
            const items = order.cart ?? order.items ?? order.orderItems ?? [];
            const canCancel = isCancellable(rawStatus) && isAuthenticated;

            return (
              <article key={id} className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
                  <div>
                    <div className="text-sm text-gray-500">ORDER #{id}</div>
                    <div className="text-xs text-gray-400">{formatDate(order.placed_at ?? order.createdAt ?? order.created_at)}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusPill status={status} />
                    <div className="text-lg font-medium">{money(order.totalAmount ?? order.total ?? order.amount)}</div>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Items</h4>
                  <div className="divide-y">
                    {items.map((it, idx) => {
                      const idKey = it.id ?? it.productId ?? idx;
                      const name = it.productName ?? it.name ?? it.title ?? "Product";
                      const qty = it.quantity ?? it.qty ?? 1;
                      const price = it.price ?? it.unitPrice ?? it.amount ?? 0;
                      const img = it.imageUrl ?? it.images?.[0] ?? it.thumbnail ?? null;

                      return (
                        <div key={idKey} className="py-3 flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                            {img ? <img src={img} alt={name} className="w-full h-full object-cover" /> : <div className="text-gray-400 text-sm">No image</div>}
                          </div>

                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500 mt-1">Qty: {qty}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-medium">{money(price * qty)}</div>
                            <div className="text-xs text-gray-500">unit {money(price)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {canCancel && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => cancelOrder(order)}
                        disabled={cancellingOrderId === id}
                        className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition ${
                          cancellingOrderId === id ? "bg-gray-300 text-gray-700 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                        aria-disabled={cancellingOrderId === id}
                      >
                        {cancellingOrderId === id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6">
                  <h5 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shipping</h5>
                  <address className="not-italic text-sm text-gray-700">
                    <div>{order.address?.fullName ?? order.shipping?.firstName ?? ""} {order.address?.lastName ?? order.shipping?.lastName ?? ""}</div>
                    <div>{order.address?.addressLine1 ?? order.shipping?.address ?? ""}</div>
                    <div>{order.address?.city ?? order.shipping?.city ?? ""}, {order.address?.state ?? order.shipping?.state ?? ""} {order.address?.postalCode ?? order.shipping?.pincode ?? ""}</div>
                    <div>{order.address?.country ?? order.shipping?.country ?? ""}</div>
                    <div className="mt-1 text-xs text-gray-500">Phone: {order.address?.phoneNumber ?? order.shipping?.phone}</div>
                  </address>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FetchOrderList;
