import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAdminRevenue } from "../Context/AdminContext";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function RevenueByDayChart() {
  const { orders, loading } = useAdminRevenue();

  // Aggregate revenue by full date (day)
  const dailyRevenueData = useMemo(() => {
    const revenueMap = {};

    orders.forEach(order => {
      const date = new Date(order.placed_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      const key = `${year}-${month}-${day}`; // Key by full date

      // Sum totalAmount for each day
      const amount = Number(order.totalAmount) || 0;
      revenueMap[key] = (revenueMap[key] || 0) + amount;
    });

    // Convert to array for charting and sort chronologically
    const result = Object.entries(revenueMap)
      .map(([key, total]) => {
        const [year, monthIndex, day] = key.split("-");
        return {
          label: `${monthNames[parseInt(monthIndex)]} ${day}, ${year}`, // e.g. "Aug 11, 2025"
          revenue: total,
          fullDate: new Date(year, parseInt(monthIndex), day)
        };
      })
      .sort((a, b) => a.fullDate - b.fullDate);

    return result;
  }, [orders]);

  if (loading) {
    return <p>Loading daily revenue chart...</p>;
  }

  if (!dailyRevenueData.length) {
    return <p>No revenue data available for chart.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue by Day</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={dailyRevenueData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
          <Bar dataKey="revenue" fill="#CC9966" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
