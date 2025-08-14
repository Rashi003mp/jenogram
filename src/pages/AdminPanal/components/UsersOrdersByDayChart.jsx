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

export default function UsersOrdersByDayChart() {
    const { orders, loading } = useAdminRevenue();

    // Aggregate orders count by full date (day)
    const dailyData = useMemo(() => {
        const countsMap = {};

        orders.forEach(order => {
            const date = new Date(order.placed_at);
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            const key = `${year}-${month}-${day}`; // e.g., "2025-7-11"

            countsMap[key] = (countsMap[key] || 0) + 1;
        });

        // Convert map to sorted array with labels formatted as "Aug 11, 2025"
        const result = Object.entries(countsMap)
            .map(([key, count]) => {
                const [year, monthIndex, day] = key.split("-");
                return {
                    label: `${monthNames[parseInt(monthIndex)]} ${day}, ${year}`, // e.g., "Aug 11, 2025"
                    orders: count,
                    // Store full date for sorting
                    fullDate: new Date(year, parseInt(monthIndex), day)
                };
            })
            .sort((a, b) => a.fullDate - b.fullDate); // sort by date ascending

        return result;
    }, [orders]);

    if (loading) {
        return <p>Loading daily orders chart...</p>;
    }

    if (!dailyData.length) {
        return <p>No orders data available for chart.</p>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">User Orders by Day</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#CC9966" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
