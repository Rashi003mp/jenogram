// src/pages/ProductDetails.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { URL } from '../api';
import { useCart } from '../../context/CartContext';

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { items = [], addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local "optimistic" marker to toggle button instantly after add
  const [addedLocally, setAddedLocally] = useState(false);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${URL}/product/${id}`);
      setProduct(res.data?.data ?? res.data ?? null);
    } catch (err) {
      toast.error('Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    setSelectedImage(0);
    setQuantity(1);
    // reset optimistic marker when product changes
    setAddedLocally(false);
  }, [id]);

  const cartItemMatchesProduct = (cartItem, prod) => {
    if (!cartItem || !prod) return false;
    const prodId = prod.id ?? prod._id;
    return (
      cartItem.productId === prodId ||
      cartItem.product?.id === prodId ||
      cartItem.product?._id === prodId
    );
  };

  // how many of this product are already in cart (from context)
  const cartQtyAlready = useMemo(() => {
    if (!product || !Array.isArray(items)) return 0;
    const found = items.find((it) => cartItemMatchesProduct(it, product));
    return (found?.quantity) ?? 0;
  }, [items, product]);

  // is it already in the cart (context) OR we added it just now locally?
  const isInCart = useMemo(() => {
    if (!product) return false;
    const inContext = Array.isArray(items) && items.some(it => cartItemMatchesProduct(it, product));
    return inContext || addedLocally;
  }, [items, product, addedLocally]);

  // keep addedLocally in sync: if items in context show product present, set optimistic flag
  useEffect(() => {
    if (!product) return;
    const inContext = Array.isArray(items) && items.some(it => cartItemMatchesProduct(it, product));
    if (inContext) {
      setAddedLocally(true);
    }
  }, [items, product]);

  const handleQuantityChange = (delta) => {
    const newVal = quantity + delta;
    if (newVal >= 1 && newVal <= 5) setQuantity(newVal);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add to cart.');
      // optionally: navigate('/login');
      return;
    }
    if (!product) return;

    const prodId = product.id ?? product._id;
    const totalDesired = cartQtyAlready + quantity;

    if (product.currentStock && totalDesired > product.currentStock) {
      const available = Math.max(0, product.currentStock - cartQtyAlready);
      toast.error(`Only ${available} item(s) left in stock.`);
      return;
    }

    setSaving(true);
    try {
      await addToCart(prodId, quantity);
      toast.success('Added to cart');
      setAddedLocally(true); // toggle UI
    } catch (err) {
      console.error('Add to cart error', err);
      toast.error('Failed to add to cart');
    } finally {
      setSaving(false);
    }
  };

  // NEW: Buy Now -> go to checkout route and pass buyNow in location.state
  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to continue');
      // optionally: navigate('/login');
      return;
    }
    if (!product) return;

    const prodId = product.id ?? product._id;
    const totalDesired = cartQtyAlready + quantity;

    if (product.currentStock && totalDesired > product.currentStock) {
      const available = Math.max(0, product.currentStock - cartQtyAlready);
      toast.error(`Only ${available} item(s) left in stock.`);
      return;
    }

    // optionally set saving so user can't spam the button
    setSaving(true);
    try {
      // Navigate to your checkout/payment page and pass buyNow data
      // CallPay (checkout) expects location.state.buyNow
      navigate('/payment', {
        state: {
          buyNow: {
            productId: prodId,
            quantity,
            price: product.price ?? 0,
            name: product.name
          }
        }
      });
    } catch (err) {
      console.error('Buy now error', err);
      toast.error('Could not proceed to checkout');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-xl">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Product not found.</div>
      </div>
    );
  }

  const images = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  const displaySrc = images[selectedImage] ?? product.imageUrl;

  return (
    <div className="max-w-7xl mt-12 mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <div className="bg-white rounded-lg overflow-hidden mb-4">
            <img
              src={displaySrc}
              alt={product.name}
              className="w-full max-h-[500px] object-contain p-2"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded border p-1 ${selectedImage === idx ? 'ring-2 ring-black' : ''}`}
                  type="button"
                >
                  <img src={src} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          <div className="mb-4">
            <span className="text-2xl font-bold text-gray-900">₹{product.price ?? '—'}</span>
          </div>

          <div className="mb-4 text-sm text-gray-700">
            <strong>Category:</strong> {product.categoryName ?? '—'}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900">Description</h3>
            <p className="mt-2 text-gray-600">{product.description}</p>
          </div>

          {!isInCart && (
            <div className="flex items-center mb-6">
              <span className="mr-3 text-sm font-medium text-gray-900">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                  type="button"
                >
                  -
                </button>
                <span className="px-4 py-1 text-center border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {isInCart ? (
              <button
                onClick={() => navigate('/cart')}
                className="flex-1 bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors"
                type="button"
              >
                Go to Cart
              </button>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
                  disabled={saving}
                  type="button"
                >
                  {saving ? 'Adding...' : 'Add to Cart'}
                </button>

                {/* <button
                  onClick={handleBuyNow}
                  className="flex-1 border border-black text-black py-3 px-6 rounded-md font-medium hover:bg-gray-100 transition-colors disabled:opacity-60"
                  disabled={saving}
                  type="button"
                >
                  {saving ? 'Processing...' : 'Buy Now'}
                </button> */}
              </>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            {product.currentStock ? (
              <span>{Math.max(0, product.currentStock - cartQtyAlready)} left in stock</span>
            ) : (
              <span>Stock info not available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
