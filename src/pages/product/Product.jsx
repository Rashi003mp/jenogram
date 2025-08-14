// src/pages/Products/Products.jsx
import React, { useEffect, useState, useContext } from 'react';
import ProductCard from './ProductCard';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {SubNav} from '../../components/Subnav';
import Footer from '../../components/Footer';
import { WishlistContext } from '../../context/WishlistContext';
import { URL } from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const { user, setUser, wishlist, setWishlist } = useContext(WishlistContext);

  // ✅ Fetch products and derive categories (no "all" here)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await axios.get(`${URL}/products`);
        const productList = productsRes.data;

        setProducts(productList);
        setFilteredProducts(productList);

        // ✅ Extract unique categories only
        const uniqueCategories = [...new Set(productList.map(product => product.category))];
        setCategories(uniqueCategories);

      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Filter products when category changes
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === activeCategory));
    }
  }, [activeCategory, products]);

  // ✅ Wishlist toggle
  const handleWishlistToggle = async (product) => {
    if (!user) {
      toast('Please login to manage your wishlist', {
        icon: '🔒',
        style: { background: '#ffebee', color: '#d32f2f' }
      });
      return;
    }

    const isInWishlist = wishlist.some(item => item.id === product.id);
    const updatedWishlist = isInWishlist
      ? wishlist.filter(item => item.id !== product.id)
      : [...wishlist, product];

    try {
      await axios.patch(`${URL}/users/${user.id}`, {
        wishlist: updatedWishlist
      });

      const updatedUser = { ...user, wishlist: updatedWishlist };
      setUser(updatedUser);
      setWishlist(updatedWishlist);

      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      toast.error('Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <>
      <SubNav
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories} // ✅ no "all" here
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl mt-10 font-bold mb-6 text-gray-900">
          {activeCategory === 'all' ? 'All Products' : activeCategory}
        </h1>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {activeCategory === 'all' ? 'products' : activeCategory.toLowerCase()} found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onWishlistToggle={handleWishlistToggle}
                isInWishlist={wishlist.some(item => item.id === product.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
