// src/context/AdminRevenueContext.jsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { URL } from '../../api';

const AdminRevenueContext = createContext();

const isToday = date => new Date().toDateString() === date.toDateString();
const isThisWeek = date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek && date <= now;
};
const isThisMonth = date => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

export function AdminRevenueProvider({ children }) {
  const { token } = useAuth(); // assumes your AuthContext provides token
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize order DTO to shape expected by UI
  const normalizeOrders = (orderDtos = []) => {
    return orderDtos.map(o => {
      const createdOn = o.createdOn ?? o.CreatedOn ?? o.created_at ?? o.createdAt ?? null;
      const items = (o.items ?? o.Items ?? []).map(i => ({
        productId: i.productId ?? i.ProductId ?? i.ProductID ?? i.productId,
        name: i.productName ?? i.ProductName ?? i.name ?? '',
        images: i.images ?? i.Images ?? [],
        quantity: Number(i.quantity ?? i.Quantity ?? 0),
        price: Number(i.price ?? i.Price ?? 0)
      }));

      const address = o.address ?? o.Address ?? null;

      return {
        // basic identifiers
        id: o.id ?? o.Id ?? null,
        userId: o.userId ?? o.UserId ?? null,
        name: o.name ?? o.Name ?? (address?.fullName ?? '') ?? '',
        // amounts & payment
        totalAmount: Number(o.totalAmount ?? o.TotalAmount ?? 0),
        paymentStatus: o.paymentStatus ?? o.PaymentStatus ?? '',
        paymentMethod: o.paymentMethod ?? o.PaymentMethod ?? '',
        // status mapping
        status: (o.orderStatus ?? o.order_state ?? o.OrderStatus ?? '').toString(),
        // timestamps
        createdOn,
        // compatibility alias used in some components
        placed_at: createdOn,
        // cart & shipping
        cart: items,
        items,
        address,
        shipping: address,
        // original raw DTO (helpful for debugging)
        _raw: o
      };
    });
  };

  // Fetch orders from backend
  const fetchOrders = async (pageNumber = 1, limit = 10) => {
    setLoading(true);
    try {
      const adminUrl = `${URL}/Order/all?pageNumber=${pageNumber}&limit=${limit}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let res = await fetch(adminUrl, { headers });

      // fallback if admin endpoint restricted
      if (res.status === 401 || res.status === 403) {
        const userUrl = `${URL}/Order`;
        res = await fetch(userUrl, { headers });
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Failed to fetch orders:', res.status, errText);
        setOrders([]);
        return;
      }

      const data = await res.json();

      // extract array of DTOs from common ApiResponse shapes
      let orderDtos = [];

      if (data && typeof data === 'object') {
        // ApiResponse with data: { items: [...] } or data: { Items: [...] }
        if (data.data) {
          const inner = data.data;
          if (Array.isArray(inner.items)) orderDtos = inner.items;
          else if (Array.isArray(inner.Items)) orderDtos = inner.Items;
          else if (Array.isArray(inner)) orderDtos = inner;
          else orderDtos = inner.Items ?? inner.items ?? inner ?? [];
        } else if (Array.isArray(data.items)) {
          orderDtos = data.items;
        } else if (Array.isArray(data.Items)) {
          orderDtos = data.Items;
        } else if (Array.isArray(data)) {
          orderDtos = data;
        } else {
          // last attempt: top-level properties
          orderDtos = data.Items ?? data.items ?? data.data ?? [];
        }
      }

      if (!Array.isArray(orderDtos)) orderDtos = [];

      const normalized = normalizeOrders(orderDtos);
      setOrders(normalized);
    } catch (err) {
      console.error('Failed to fetch users or orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleOrdersUpdated = () => {
      fetchOrders();
    };
    window.addEventListener('ordersUpdated', handleOrdersUpdated);

    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdated);
    };
  }, [token]);

  const revenueData = useMemo(() => {
    let totalRevenue = 0,
      todayRevenue = 0,
      weekRevenue = 0,
      monthRevenue = 0;

    let todayOrdersCount = 0;
    let todayPiecesSold = 0;
    let totalPiecesSold = 0;

    orders.forEach(order => {
      const amount = Number(order.totalAmount) || 0;
      const created = order.createdOn ? new Date(order.createdOn) : new Date();

      totalRevenue += amount;
      totalPiecesSold += (order.items?.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0) || 0);

      if (isToday(created)) {
        todayRevenue += amount;
        todayOrdersCount++;
        todayPiecesSold += (order.items?.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0) || 0);
      }
      if (isThisWeek(created)) weekRevenue += amount;
      if (isThisMonth(created)) monthRevenue += amount;
    });

    return {
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      orderCount: orders.length,
      orders,
      todayOrdersCount,
      todayPiecesSold,
      totalPiecesSold
    };
  }, [orders]);

  return (
    <AdminRevenueContext.Provider
      value={{
        ...revenueData,
        loading,
        reloadOrders: fetchOrders
      }}
    >
      {children}
    </AdminRevenueContext.Provider>
  );
}

export function useAdminRevenue() {
  const ctx = useContext(AdminRevenueContext);
  if (!ctx) throw new Error('useAdminRevenue must be used within AdminRevenueProvider');
  return ctx;
}
