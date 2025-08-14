import React, { useEffect, useState } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";

// ✅ Import your AdminSidebar
import AdminSidebar from "../components/AdminSidebar"; 
import { useAuth } from "../../../context/AuthContext";
import { useAdminRevenue } from "../Context/AdminContext";
import { URL } from "../../api";

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ✅ Sidebar UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ✅ Logged in admin info + order count for badge
  const { isAdmin, user,logout } = useAuth();
  const { todayOrdersCount } = useAdminRevenue();

  // Fetch all users
    // Fetch all users
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${URL}/users`);
      const data = await res.json();
      // ✅ Only keep non-admin users
      const onlyUsers = data.filter(client => client.role === "user");
      setClients(onlyUsers);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchClients();
  }, []);

  // Block / Unblock Toggle
  const toggleBlockStatus = async (id, currentStatus) => {
    try {
      await fetch(`${URL}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlock: !currentStatus }),
      });
      fetchClients();
    } catch (error) {
      console.error("Error updating block status:", error);
    }
  };

  // Sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter + Sort
  const filteredClients = clients
    .filter(
      (client) =>
        client.name?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase())
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

  // ✅ Restrict to admins
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
        <h2 className="text-xl text-red-500">Access Denied</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      {/* ✅ Sidebar */}
      <AdminSidebar
        user={user}
        logout={logout}
        todayOrdersCount={todayOrdersCount}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* ✅ Main Content */}
      <div className="flex-1 p-6">
        {/* Mobile hamburger button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-[#CC9966] text-white rounded"
          >
            ☰
          </button>
        </div>

        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D9C5] p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-light tracking-wider text-[#1A1A1A]">
                Client Management
              </h2>
              <p className="text-xs text-[#5A5A5A] tracking-wider">
                Manage your luxury clientele
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-[#5A5A5A]" />
              </div>
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-[#E5D9C5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#CC9966] focus:border-[#CC9966]"
              />
            </div>
          </div>

          {/* Loading / Empty / Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 text-[#CC9966] animate-spin" />
              <p className="mt-2 text-sm text-[#5A5A5A]">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#5A5A5A]">
                No clients found matching your search
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5D9C5]">
                <thead className="bg-[#F8F5F0]">
                  {/* Table header row */}
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer"
                      onClick={() => requestSort("name")}
                    >
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Name
                        <ChevronUpDownIcon className="h-3 w-3 ml-1" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer"
                      onClick={() => requestSort("email")}
                    >
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        Email
                        <ChevronUpDownIcon className="h-3 w-3 ml-1" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer"
                      onClick={() => requestSort("role")}
                    >
                      Role
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer"
                      onClick={() => requestSort("isBlock")}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer"
                      onClick={() => requestSort("created_at")}
                    >
                      <div className="flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Joined
                        <ChevronUpDownIcon className="h-3 w-3 ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A] tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5D9C5]">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-[#FAF9F6] transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-[#F8F5F0] rounded-full flex items-center justify-center">
                            <span className="text-[#CC9966] text-sm font-medium">
                              {client.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-light text-[#1A1A1A]">
                              {client.name || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5A5A5A]">{client.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-[#F8F5F0] text-[#5A5A5A]">
                          {client.role || "user"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {client.isBlock ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <NoSymbolIcon className="h-3 w-3 mr-1" />
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-[#5A5A5A]">
                        {client.created_at
                          ? new Date(client.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            toggleBlockStatus(client.id, client.isBlock)
                          }
                          className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wider transition-colors duration-200 ${
                            client.isBlock
                              ? "bg-[#CC9966] text-white hover:bg-[#B38658]"
                              : "bg-white text-[#CC9966] border border-[#CC9966] hover:bg-[#F8F5F0]"
                          }`}
                        >
                          {client.isBlock ? "Unblock Client" : "Block Client"}
                        </button>
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
