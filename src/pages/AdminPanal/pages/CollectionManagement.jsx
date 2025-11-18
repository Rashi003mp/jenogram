// src/pages/CollectionsManagement.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../../../context/AuthContext";
import { useAdminRevenue } from "../Context/AdminContext";
import { URL } from "../../api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  count: "",
  category: "",
  images: [""],
  files: [],
  isActive: true,
};

export default function CollectionsManagement() {
  // Listing + paging
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [descending] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [error, setError] = useState(null);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const formRef = useRef(null);

  // sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // auth
  const { isAdmin, user, logout, token } = useAuth();
  const { todayOrdersCount } = useAdminRevenue();

  // normalize product (maps imageUrls -> images)
  const normalizeProduct = useCallback((p) => {
    if (!p) return null;
    const id = p.id ?? p.Id ?? p.productId ?? null;
    const name = p.name ?? p.Name ?? "";
    const description = p.description ?? p.Description ?? "";
    const price = Number(p.price ?? p.Price ?? 0) || 0;
    const count = Number(p.currentStock ?? p.CurrentStock ?? p.count ?? 0) || 0;

    let images = [];
    if (Array.isArray(p.imageUrls) && p.imageUrls.length) {
      images = p.imageUrls.map((u) => String(u));
    } else if (Array.isArray(p.images) && p.images.length) {
      images = p.images.map((x) => (typeof x === "string" ? x : x.imageUrl ?? ""));
    } else if (p.mainImageUrl ?? p.imageUrl) {
      images = [p.mainImageUrl ?? p.imageUrl];
    }

    const category = p.categoryName ?? p.category ?? (p.categoryId ? String(p.categoryId) : "Uncategorized");
    const isActive = p.isActive ?? p.IsActive ?? true;

    return {
      id,
      name,
      description,
      price,
      count,
      images: images.length ? images : [""],
      category,
      categoryId: p.categoryId,
      isActive,
      raw: p,
    };
  }, []);

  // single active controller ref
  const activeFetchRef = useRef(null);

  // Fetch products with proper pagination
  const fetchProducts = useCallback(
    async (pageToFetch = 1, signal = undefined) => {
      setLoading(true);
      setError(null);

      try {
        // cancel previous if present
        if (activeFetchRef.current && !activeFetchRef.current.signal.aborted) {
          activeFetchRef.current.abort();
        }

        const controller = signal instanceof AbortSignal ? null : new AbortController();
        const actualSignal = signal ?? (controller ? controller.signal : undefined);
        if (controller) activeFetchRef.current = controller;

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const endpoint = `${URL}/Product/filter?page=${pageToFetch}&pageSize=${pageSize}&descending=${descending}`;

        const res = await fetch(endpoint, { headers, signal: actualSignal });

        if (controller) activeFetchRef.current = null;

        if (!res) throw new Error("No response from server");
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          const errMsg = `Fetch failed: ${res.status} ${res.statusText}${txt ? " - " + txt : ""}`;
          setError(errMsg);
          setProducts([]);
          return false;
        }

        const body = await res.json().catch(() => null);

        // Extract items from response
        let items = [];
        if (body && body.data) {
          items = Array.isArray(body.data) ? body.data : [body.data];
        } else if (Array.isArray(body)) {
          items = body;
        } else if (body && body.items) {
          items = body.items;
        }

        // Extract total count for pagination
        const total = body?.totalCount ?? body?.TotalCount ?? body?.total ?? body?.Total ?? null;
        if (total != null) {
          setTotalCount(Number(total));
          setTotalPages(Math.max(1, Math.ceil(Number(total) / Number(pageSize))));
        } else {
          // Fallback: if returned less than pageSize, assume last page
          if (items.length < pageSize) {
            setTotalPages(pageToFetch);
          } else {
            setTotalPages(Math.max(1, pageToFetch + 1));
          }
        }

        const normalized = items.map(normalizeProduct).filter(Boolean);
        setProducts(normalized);
        return true;
      } catch (err) {
        if (err && err.name === "AbortError") {
          // ignore aborts
        } else {
          console.error("Failed to fetch products:", err);
          setError(err?.message || String(err));
          setProducts([]);
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [pageSize, descending, normalizeProduct, token]
  );

  // initial + when `page` changes -> fetch that page
  useEffect(() => {
    const c = new AbortController();
    fetchProducts(page, c.signal);
    return () => c.abort();
  }, [fetchProducts, page]);

  // form helpers
  const openAddForm = () => {
    setEditingProduct(null);
    setFormState(emptyForm);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const openEditForm = (p) => {
    setEditingProduct(p);
    
    // Extract existing image URLs properly
    let existingImages = [];
    if (p.raw?.imageUrls && Array.isArray(p.raw.imageUrls)) {
      existingImages = p.raw.imageUrls;
    } else if (p.images && Array.isArray(p.images)) {
      existingImages = p.images.filter(img => img && img !== "");
    }

    setFormState({
      name: p.name ?? "",
      description: p.description ?? "",
      price: p.price ?? "",
      count: p.count ?? 0,
      category: p.categoryId ?? p.raw?.categoryId ?? "",
      images: existingImages.length > 0 ? existingImages : [""],
      files: [],
      isActive: p.isActive ?? p.raw?.isActive ?? true,
    });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormState(emptyForm);
  };

  const onFilesSelected = (files) => {
    const arr = Array.from(files || []);
    setFormState((s) => ({ ...s, files: arr }));
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const headersBase = token ? { Authorization: `Bearer ${token}` } : {};
      const usingFiles = formState.files && formState.files.length > 0;

      if (editingProduct) {
        // UPDATE PRODUCT
        const updateUrl = `${URL}/Product/${editingProduct.id}`;
        const fd = new FormData();

        // Add basic fields
        if (formState.name) fd.append("Name", formState.name);
        if (formState.description) fd.append("Description", formState.description);
        if (formState.price !== "" && formState.price != null) {
          fd.append("Price", String(formState.price));
        }
        if (formState.count !== "" && formState.count != null) {
          fd.append("CurrentStock", String(formState.count));
        }
        if (formState.category !== "" && formState.category != null) {
          fd.append("CategoryId", String(formState.category));
        }
        fd.append("IsActive", String(Boolean(formState.isActive)));

        // Handle images
        if (usingFiles) {
          // Replace all images with new ones
          fd.append("ReplaceImages", "true");
          formState.files.forEach((f) => {
            fd.append("NewImages", f, f.name || "file");
          });
        } else {
          // Keep existing images
          fd.append("ReplaceImages", "false");
        }

        const res = await fetch(updateUrl, {
          method: "PUT",
          headers: headersBase,
          body: fd,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let errorMsg = `Status ${res.status}`;
          try {
            const json = JSON.parse(text);
            errorMsg = json?.message || json?.Message || errorMsg;
          } catch {
            errorMsg = text || errorMsg;
          }
          throw new Error(errorMsg);
        }

        alert("Product updated successfully!");
      } else {
        // CREATE PRODUCT
        const createUrl = `${URL}/Product`;
        const fd = new FormData();

        fd.append("Name", formState.name);
        fd.append("Description", formState.description ?? "");
        fd.append("Price", String(formState.price ?? 0));
        fd.append("CurrentStock", String(formState.count ?? 0));
        
        if (formState.category) {
          fd.append("CategoryId", String(formState.category));
        }

        // For create, we must use file uploads
        if (usingFiles) {
          formState.files.forEach((f, index) => {
            fd.append("Images", f, f.name || "file");
          });
          // Set first image as main
          fd.append("MainImageIndex", "0");
        } else {
          throw new Error("Please upload at least one image file for new products");
        }

        const res = await fetch(createUrl, {
          method: "POST",
          headers: headersBase,
          body: fd,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let errorMsg = `Status ${res.status}`;
          try {
            const json = JSON.parse(text);
            errorMsg = json?.message || json?.Message || errorMsg;
          } catch {
            errorMsg = text || errorMsg;
          }
          throw new Error(errorMsg);
        }

        alert("Product created successfully!");
      }

      // Refresh current page after changes
      const c = new AbortController();
      await fetchProducts(page, c.signal);

      setShowForm(false);
      setEditingProduct(null);
      setFormState(emptyForm);
    } catch (err) {
      console.error("Save error:", err);
      const msg = err?.message ?? String(err);
      setError(msg);
      alert("Save failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  // Toggle product active status
  const handleToggleActive = async (product) => {
    setLoading(true);
    setError(null);

    try {
      const headersBase = token ? { Authorization: `Bearer ${token}` } : {};
      const updateUrl = `${URL}/Product/${product.id}`;
      const fd = new FormData();

      // Send only the IsActive field update
      fd.append("IsActive", String(!product.isActive));
      fd.append("ReplaceImages", "false");

      const res = await fetch(updateUrl, {
        method: "PUT",
        headers: headersBase,
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let errorMsg = `Status ${res.status}`;
        try {
          const json = JSON.parse(text);
          errorMsg = json?.message || json?.Message || errorMsg;
        } catch {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Update local state immediately for better UX
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id ? { ...p, isActive: !p.isActive } : p
        )
      );

      // Optionally refresh from server
      const c = new AbortController();
      await fetchProducts(page, c.signal);

    } catch (err) {
      console.error("Toggle active error:", err);
      const msg = err?.message ?? String(err);
      setError(msg);
      alert("Failed to update status: " + msg);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${URL}/Product/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Delete failed: ${res.status} ${txt}`);
      }
      
      alert("Product deleted successfully!");
      
      // Refresh current page
      const c = new AbortController();
      await fetchProducts(page, c.signal);
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err?.message || String(err));
      alert(err?.message || "Delete failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  // derived & filters - use all products across all pages for stats
  const totalProducts = totalCount || products.length;
  const totalInventoryValue = products.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.count) || 0), 0);
  const lowStockCount = products.filter((p) => (Number(p.count) || 0) < 5).length;
  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;
  const topSelling = products.length ? products.reduce((prev, curr) => (Number(curr.count) > Number(prev.count) ? curr : prev), products[0]) : {};
  
  // Get unique categories from current page
  const categories = ["All", ...new Set(products.map((p) => p.category || "Uncategorized"))];

  // Sort products - low stock first
  const sortedProducts = [...products].sort((a, b) => {
    if ((Number(a.count) || 0) < 5 && (Number(b.count) || 0) >= 5) return -1;
    if ((Number(a.count) || 0) >= 5 && (Number(b.count) || 0) < 5) return 1;
    return 0;
  });

  // Filter products by search and category
  const filteredProducts = sortedProducts.filter(
    (p) =>
      (categoryFilter === "All" || p.category === categoryFilter) &&
      ((p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase()))
  );

  // pagination controls
  const goPrev = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const goNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (!isAdmin) return <div className="flex items-center justify-center min-h-screen">Access Denied</div>;

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <AdminSidebar
        user={user}
        logout={logout}
        todayOrdersCount={todayOrdersCount}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed((s) => !s)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 p-6">
        <div className="md:hidden mb-4">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 bg-[#CC9966] text-white rounded">☰</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-[#E5D9C5] p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Total Products</h3>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>
          <div className="bg-white border border-[#E5D9C5] p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Active / Inactive</h3>
            <p className="text-2xl font-bold">
              <span className="text-green-600">{activeCount}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">{inactiveCount}</span>
            </p>
          </div>
          <div className="bg-white border border-[#E5D9C5] p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Page Inventory</h3>
            <p className="text-2xl font-bold">₹{totalInventoryValue.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-[#E5D9C5] p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Low Stock</h3>
            <p className="text-2xl font-bold text-red-500">{lowStockCount}</p>
          </div>
          <div className="bg-white border border-[#E5D9C5] p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Top (Page)</h3>
            <p className="text-xl font-bold truncate">{topSelling.name || "-"}</p>
          </div>
        </div>

        {/* toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0 md:w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="pl-10 pr-4 py-2 border rounded w-full" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <select 
              className="border rounded p-2" 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { 
                const c = new AbortController(); 
                fetchProducts(page, c.signal); 
              }} 
              className="px-3 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              <ArrowPathIcon className={`w-4 h-4 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={openAddForm} 
              className="flex items-center gap-1 bg-[#CC9966] text-white px-3 py-2 rounded shadow hover:bg-[#B38658]"
            >
              <PlusIcon className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="my-4 p-3 border border-red-200 bg-red-50 text-red-800 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* form */}
        {showForm && (
          <div ref={formRef} className="bg-white border border-[#E5D9C5] p-4 rounded mb-4 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input 
                  required 
                  type="text" 
                  placeholder="Name" 
                  className="border p-2 rounded" 
                  value={formState.name} 
                  onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))} 
                />
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Price" 
                  className="border p-2 rounded" 
                  value={formState.price} 
                  onChange={(e) => setFormState((s) => ({ ...s, price: e.target.value }))} 
                />
                <input 
                  type="number" 
                  placeholder="Stock Count" 
                  className="border p-2 rounded" 
                  value={formState.count} 
                  onChange={(e) => setFormState((s) => ({ ...s, count: e.target.value }))} 
                />
                <input 
                  type="text" 
                  placeholder="CategoryId (numeric)" 
                  className="border p-2 rounded" 
                  value={formState.category} 
                  onChange={(e) => setFormState((s) => ({ ...s, category: e.target.value }))} 
                />
                
                {editingProduct && formState.images.length > 0 && formState.images[0] && (
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Current Images:</label>
                    <div className="flex gap-2 flex-wrap">
                      {formState.images.map((url, idx) => url && (
                        <img 
                          key={idx} 
                          src={url} 
                          alt={`Current ${idx}`} 
                          className="w-20 h-20 object-cover border rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">
                    {editingProduct ? "Upload new images (replaces all existing)" : "Upload images (required)"}
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => onFilesSelected(e.target.files)} 
                    className="border p-2 rounded w-full" 
                    required={!editingProduct}
                  />
                  {formState.files && formState.files.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {Array.from(formState.files).map((f, idx) => (
                        <div key={idx} className="text-xs px-2 py-1 border rounded bg-gray-50">
                          {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <textarea 
                placeholder="Description" 
                className="border p-2 rounded w-full mb-3" 
                rows="3"
                value={formState.description} 
                onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))} 
              />

              <div className="flex items-center gap-2 mb-3">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formState.isActive}
                  onChange={(e) => setFormState((s) => ({ ...s, isActive: e.target.checked }))}
                  className="w-4 h-4 text-[#CC9966] border-gray-300 rounded focus:ring-[#CC9966]"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Product is Active (visible to customers)
                </label>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="bg-[#CC9966] text-white px-4 py-2 rounded hover:bg-[#B38658]"
                  disabled={loading}
                >
                  {loading ? "Saving..." : (editingProduct ? "Save Changes" : "Add Product")}
                </button>
                <button 
                  type="button" 
                  onClick={cancelForm} 
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* listing */}
        {loading && !showForm ? (
          <div className="flex flex-col items-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-[#CC9966] animate-spin" />
            <p className="mt-2 text-sm text-[#5A5A5A]">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-[#E5D9C5] rounded shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5D9C5]">
                <thead className="bg-[#F8F5F0]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Image</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Name</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Category</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Price</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Stock</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr 
                      key={p.id ?? JSON.stringify(p.raw)} 
                      className={`hover:bg-[#FAF9F6] ${Number(p.count) < 5 ? "bg-red-50" : ""}`}
                    >
                      <td className="px-4 py-2">
                        <img 
                          src={p.images?.[0] || "/placeholder.png"} 
                          alt={p.name} 
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = "/placeholder.png"; 
                          }} 
                          className="w-12 h-12 object-cover rounded" 
                        />
                      </td>
                      <td className="px-4 py-2 text-sm">{p.name}</td>
                      <td className="px-4 py-2 text-sm">{p.category}</td>
                      <td className="px-4 py-2 text-sm">₹{Number(p.price).toFixed(2)}</td>
                      <td className={`px-4 py-2 text-sm ${Number(p.count) < 5 ? "text-red-500 font-bold" : ""}`}>
                        {p.count}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={loading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            p.isActive 
                              ? 'bg-green-600 focus:ring-green-500' 
                              : 'bg-gray-300 focus:ring-gray-400'
                          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={p.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              p.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-xs ${p.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => openEditForm(p)} 
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <PencilSquareIcon className="w-4 h-4" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)} 
                            className="flex items-center gap-1 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={goPrev} 
                  disabled={page <= 1} 
                  className="px-3 py-2 border rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeftIcon className="w-4 h-4" /> Prev
                </button>
                <span className="px-2 text-sm">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <button 
                  onClick={goNext} 
                  disabled={page >= totalPages} 
                  className="px-3 py-2 border rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="text-sm text-gray-500">
                Total: {totalCount} products
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}