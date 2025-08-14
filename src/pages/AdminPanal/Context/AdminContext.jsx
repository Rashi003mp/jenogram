import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${URL}/users`);
      const users = await res.json();
      setOrders(users.flatMap(u => u.orders || []));
    } catch (err) {
      console.error('Failed to fetch users or orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchOrders();

    // Listen for global "ordersUpdated" events
    const handleOrdersUpdated = () => {
      fetchOrders();
    };
    window.addEventListener('ordersUpdated', handleOrdersUpdated);

    // Cleanup the listener
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdated);
    };
  }, []);

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
      const placed = new Date(order.placed_at);

      totalRevenue += amount;
      totalPiecesSold += order.cart?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

      if (isToday(placed)) {
        todayRevenue += amount;
        todayOrdersCount++;
        todayPiecesSold += order.cart?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
      }
      if (isThisWeek(placed)) weekRevenue += amount;
      if (isThisMonth(placed)) monthRevenue += amount;
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
        reloadOrders: fetchOrders // in case you want manual reload too
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
