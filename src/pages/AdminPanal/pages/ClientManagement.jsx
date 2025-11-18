// src/pages/ClientManagement.jsx
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

import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../../../context/AuthContext";
import { useAdminRevenue } from "../Context/AdminContext";
import { URL } from "../../api";

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Sidebar UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auth + admin info + order count for badge
  const { isAdmin, user, logout, token } = useAuth();
  const { todayOrdersCount } = useAdminRevenue();

  // Helper: normalize single user DTO to consistent shape
  const normalizeUser = (u) => {
    if (!u) return null;
    // detect common property names
    const id = u.id ?? u.Id ?? u.userId ?? u.UserId;
    const name = u.name ?? u.fullName ?? u.FullName ?? u.Name ?? "";
    const email = u.email ?? u.Email ?? u.userEmail ?? "";
    const role = u.role ?? u.Role ?? "user";
    const isBlocked = (u.isBlocked ?? u.IsBlocked ?? u.isBlock ?? u.IsBlock ?? u.IsBlocked) === true;
    // createdOn variants
    const createdOn =
      u.createdOn ??
      u.created_at ??
      u.createdAt ??
      u.CreatedOn ??
      u.CreatedAt ??
      u.created ??
      null;

    return {
      id,
      name,
      email,
      role,
      isBlocked,
      createdOn,
      _raw: u,
    };
  };

  // Fetch all users (uses token, and handles ApiResponse wrapper)
  const fetchClients = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${URL}/user`, { headers });
      if (!res.ok) {
        console.error("Failed to fetch clients:", res.status);
        setClients([]);
        return;
      }

      const body = await res.json();
      // body may be: ApiResponse<IEnumerable<User>> => { statusCode, message, data: [...] }
      // or it could be raw array. Normalize both.
      let usersArray = [];

      if (body && typeof body === "object") {
        if (Array.isArray(body.data)) usersArray = body.data;
        else if (Array.isArray(body)) usersArray = body;
        else if (Array.isArray(body.items)) usersArray = body.items;
        else if (Array.isArray(body.Items)) usersArray = body.Items;
        else if (Array.isArray(body.data?.items)) usersArray = body.data.items;
        else usersArray = [];
      }

      // Filter out admins and map to normalized shape
      const onlyUsers = usersArray
        .map(normalizeUser)
        .filter((u) => u && (u.role?.toString().toLowerCase() !== "admin"));

      setClients(onlyUsers);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // refetch on token change

  // Block / Unblock Toggle
  // Server toggles block state server-side; here we call the API and refresh
  const toggleBlockStatus = async (id) => {
    try {
      setLoading(true);
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // PATCH to server endpoint that toggles block/unblock (server decides)
      // Many servers implement: PATCH /user/block/{id} or PATCH /users/{id}
      // Your backend service method is BlockUnblockUserAsync(int id) — try conventional route:
      const endpointCandidates = [
        `${URL}/User/block-unblock/${id}`,
        `${URL}/user/${id}/block`,
        `${URL}/users/${id}`, // original attempt, kept as fallback
      ];

      let res = null;
      for (const ep of endpointCandidates) {
        try {
          res = await fetch(ep, { method: "PUT", headers });
          // if server responded with 404/403/200 etc we break and inspect
          if (res) break;
        } catch (err) {
          // try next candidate
          res = null;
        }
      }

      if (!res) {
        console.error("Failed to call block/unblock endpoint (no response).");
      } else {
        const body = await res.json().catch(() => null);
        // if server returned 200, refresh clients
        if (res.ok) {
          await fetchClients();
        } else {
          console.error("Block/unblock failed:", res.status, body);
          // still refresh list in case server toggled anyway
          await fetchClients();
        }
      }
    } catch (error) {
      console.error("Error updating block status:", error);
    } finally {
      setLoading(false);
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

  // Filter + Sort (use normalized fields)
  const filteredClients = clients
    .filter(
      (client) =>
        client.name?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const ka = a[sortConfig.key];
      const kb = b[sortConfig.key];

      // If sorting by createdOn convert to date
      if (sortConfig.key === "createdOn") {
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

  // Restrict to admins
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
        <h2 className="text-xl text-red-500">Access Denied</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        logout={logout}
        todayOrdersCount={todayOrdersCount}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Mobile hamburger */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-[#CC9966] text-white rounded"
          >
            ☰
          </button>
        </div>

        {/* Header */}
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
              <p className="text-[#5A5A5A]">No clients found matching your search</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5D9C5]">
                <thead className="bg-[#F8F5F0]">
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
                      onClick={() => requestSort("isBlocked")}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-[#5A5A5A] tracking-wider cursor-pointer"
                      onClick={() => requestSort("createdOn")}
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
                      key={client.id ?? client._raw?.Id ?? client._raw?.id}
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
                          {client.role ===1?"Admin" : "user"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {client.isBlocked ? (
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
                        {client.createdOn
                          ? new Date(client.createdOn).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleBlockStatus(client.id ?? client._raw?.Id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wider transition-colors duration-200 ${
                            client.isBlocked
                              ? "bg-[#CC9966] text-white hover:bg-[#B38658]"
                              : "bg-white text-[#CC9966] border border-[#CC9966] hover:bg-[#F8F5F0]"
                          }`}
                        >
                          {client.isBlocked ? "Unblock Client" : "Block Client"}
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
