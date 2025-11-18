// src/pages/WishlistPage.jsx
import React, { useEffect, useState } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import ProductCard from "../product/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";

function WishlistPage() {
  const { user, setUser } = useAuth(); // setUser is optional; left here if you need to sync user object
  const {
    wishlistItems,
    loading,
    fetchWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
  } = useWishlist();

  const [error, setError] = useState(null);

  // ensure wishlist is loaded for current user
  useEffect(() => {
    const load = async () => {
      try {
        if (user?.id) {
          await fetchWishlist();
        }
      } catch (err) {
        console.error("Failed to fetch wishlist:", err);
        setError(err?.message ?? "Failed to load wishlist");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleWishlistToggle = async (product) => {
    if (!user) {
      toast('Please login to manage your wishlist', {
        icon: '🔒',
        style: { background: '#ffebee', color: '#d32f2f' },
      });
      return;
    }

    try {
      await toggleWishlist(product.productId); // context handles optimistic updates + API
      // toggleWishlist already shows success/warning/failure toasts in your context
    } catch (err) {
      // Just in case context throws — show fallback error
      console.error('Wishlist toggle failed in Products component:', err);
      toast.error('Failed to update wishlist');
    }
  };


  const handleClearAll = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear your entire wishlist?"
    );
    if (!confirmClear) return;
    await clearWishlist();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-4">Error loading wishlist: {error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchWishlist();
          }}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  const list = Array.isArray(wishlistItems) ? wishlistItems : [];
  console.log(wishlistItems);


  return (
    <div className="container mx-auto px-4 py-8">
      {list.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <HeartSolid className="w-16 h-16 mx-auto text-gray-400 mb-6" />
          <h2 className="text-2xl font-light text-gray-800 mb-3 tracking-wide">
            YOUR WISHLIST IS EMPTY
          </h2>
          <p className="text-gray-600 mb-8 text-sm font-light tracking-wider">
            Save your favorite items here for later
          </p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-black text-white border border-black hover:bg-white hover:text-black transition-all duration-300 uppercase text-xs tracking-widest font-medium focus:outline-none"
          >
            DISCOVER OUR COLLECTION
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div />
            <button
              onClick={handleClearAll}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {list.map((item) => {
              return (
                <ProductCard
                  key={item.id}
                  product={item}
                  onWishlistToggle={() => toggleWishlist(item.id)}
                  isInWishlist={isInWishlist(item.id)}
                />

              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default WishlistPage;
