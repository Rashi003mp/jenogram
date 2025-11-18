import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { WishlistService } from "../Services/WishlistService";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load wishlist when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user?.id]);

  // ✅ Fetch wishlist from backend
  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await WishlistService.getWishlist();

      // Normalize all items to a consistent structure
      const normalized = Array.isArray(data)
        ? data.map((item) => ({
            id: item.productId, // convert productId -> id for consistency
            name: item.name,
            price: item.price,
            mainImageUrl: item.mainImageUrl,
          }))
        : [];

      setWishlistItems(normalized);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to fetch wishlist");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle add/remove wishlist item
  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.warning("Please log in first!");
      return;
    }

    const pid = Number(productId);

    // Check if product already in wishlist
    const exists = wishlistItems.some((item) => Number(item.id) === pid);

    // Optimistic update (update immediately before API finishes)
    const prevItems = wishlistItems;
    setWishlistItems((prev) =>
      exists
        ? prev.filter((item) => Number(item.id) !== pid) // remove
        : [...prev, { id: pid }] // add placeholder
    );

    try {
      await WishlistService.toggleWishlist(pid);
      toast.success(exists ? "Removed from wishlist!" : "Added to wishlist!");
    } catch (error) {
      setWishlistItems(prevItems); // rollback on failure
      toast.error("Failed to update wishlist");
      console.error("Error toggling wishlist:", error);
    }
  };

  // ✅ Check if a product is in wishlist
  const isInWishlist = (productId) =>
    wishlistItems.some((item) => Number(item.id) === Number(productId));

  // ✅ Clear all wishlist items
  const clearWishlist = async () => {
    if (!user) return;
    if (!wishlistItems.length) {
      toast.info("Wishlist is already empty.");
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        wishlistItems.map((item) => WishlistService.toggleWishlist(item.id))
      );
      setWishlistItems([]);
      toast.success("Wishlist cleared!");
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      toast.error("Failed to clear wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        toggleWishlist,
        isInWishlist,
        fetchWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
