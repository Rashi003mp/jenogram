// src/pages/Products.jsx
import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import SubNav from '../../components/Filter';
import Footer from '../../components/Footer';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { URL } from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // ['Men', 'Jeans', 'Accessories', ...]
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' or categoryName string

  const { wishlistItems, toggleWishlist, isInWishlist, fetchWishlist } = useWishlist();
  const { user } = useAuth();

  // Fetch products and derive categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await axios.get(
          `${URL}/Product/filter?page=1&pageSize=20&descending=false`
        );

        const productList = productsRes?.data?.data || [];
        console.log('Products:', productList);

        setProducts(productList);
        setFilteredProducts(productList);

        // 🔹 Use categoryName from API, not product.category
        const uniqueCategories = [
          ...new Set(
            productList
              .map((p) => p.categoryName) // <- ⬅️ from your backend
              .filter(Boolean) // remove null/undefined
          ),
        ];
        setCategories(uniqueCategories); // e.g. ['Men', 'Jeans', 'Accessories']
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

  // Optionally refresh wishlist when products/user changes (if you want fresh data)
  useEffect(() => {
    if (user?.id) {
      fetchWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 🔧 Filter products when category changes (using categoryName)
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((product) => product.categoryName === activeCategory)
      );
    }
  }, [activeCategory, products]);

  // Wishlist toggle — delegates to context's toggleWishlist
  const handleWishlistToggle = async (product) => {
    if (!user) {
      toast('Please login to manage your wishlist', {
        icon: '🔒',
        style: { background: '#ffebee', color: '#d32f2f' },
      });
      return;
    }

    try {
      await toggleWishlist(product.id); // productId is not in sample, so use id
    } catch (err) {
      console.error('Wishlist toggle failed in Products component:', err);
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
      {/* 🔹 Pass category names to SubNav */}
      <SubNav
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories} // ['Men', 'Jeans', 'Accessories']
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
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onWishlistToggle={() => handleWishlistToggle(product)}
                isInWishlist={isInWishlist(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
