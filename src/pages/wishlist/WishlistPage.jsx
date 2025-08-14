import React, { useEffect, useState, useContext } from 'react';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import ProductCard from '../product/ProductCard';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { WishlistContext } from '../../context/WishlistContext';
import { URL } from '../api';

function WishlistPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Shared wishlist & user from context
  const { user } = useAuth();
  const { wishlist, setWishlist, setUser } = useContext(WishlistContext);

  // ✅ Update wishlist in backend + context
  const updateWishlist = async (updatedWishlist) => {
    try {
      if (user?.id) {
        await axios.patch(`${URL}/users/${user.id}`, {
          wishlist: updatedWishlist
        });
        // Also update user in context so Products.jsx sees the change
        setUser((prev) => ({ ...prev, wishlist: updatedWishlist }));
      }
      setWishlist(updatedWishlist); // update shared state
      return true;
    } catch (err) {
      console.error('Failed to update wishlist:', err);
      toast.error('Failed to update wishlist');
      return false;
    }
  };

  // Load wishlist from backend/localStorage when page opens
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (user?.id) {
          const response = await axios.get(`${URL}/users/${user.id}`);
          const userWishlist = response.data.wishlist || [];
          setWishlist(userWishlist); // ✅ from context
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch wishlist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, setWishlist]);

  // Toggle wishlist item
  const handleWishlistToggle = async (product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    const updatedWishlist = isInWishlist
      ? wishlist.filter(item => item.id !== product.id)
      : [...wishlist, product];

    const success = await updateWishlist(updatedWishlist);
    if (success) {
      toast.success(
        isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
        { position: 'top-center', duration: 2000 }
      );
    }
  };

  // Clear entire wishlist
  const handleClearAll = async () => {
    const confirmClear = window.confirm('Are you sure you want to clear your entire wishlist?');
    if (!confirmClear) return;

    try {
      if (user?.id) {
        await axios.patch(`${URL}/users/${user.id}`, { wishlist: [] });
        setUser((prev) => ({ ...prev, wishlist: [] }));
      }
      setWishlist([]); // ✅ updates everywhere
      toast.success('Wishlist cleared successfully', { position: 'top-center', duration: 2000 });
    } catch (err) {
      console.error('Failed to clear wishlist:', err);
      toast.error('Failed to clear wishlist');
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-4">Error loading wishlist: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {wishlist.length === 0 ? (
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
            className="inline-block px-8 py-3 bg-black text-white 
                       border border-black hover:bg-white hover:text-black 
                       transition-all duration-300 uppercase text-xs 
                       tracking-widest font-medium focus:outline-none"
          >
            DISCOVER OUR COLLECTION
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleClearAll}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isInWishlist={true}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default WishlistPage;
