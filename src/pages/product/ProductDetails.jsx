import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { URL } from '../api';

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false); // ✅ New state

  // Fetch product
  useEffect(() => {
    axios.get(`${URL}/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => console.error('Error fetching product:', err));
  }, [id]);

  // Check if product already exists in cart
  useEffect(() => {
    if (user && product) {
      axios.get(`${URL}/users/${user.id}`)
        .then(res => {
          const cart = res.data.cart || [];
          const alreadyInCart = cart.some(item => item.id === product.id);
          setIsInCart(alreadyInCart);
        })
        .catch(err => console.error("Error checking cart:", err));
    }
  }, [user, product]);

  const handleQuantityChange = (value) => {
    const newValue = quantity + value;
    if (newValue >= 1 && newValue <= 10) {
      setQuantity(newValue);
    }
  };

  const handleAddToCart = async () => {
  if (!user) {
    toast.error("Please login to add to cart.");
    return;
  }

  try {
    // Fetch user and product from backend for latest data
    const userRes = await axios.get(`${URL}/users/${user.id}`);
    const userData = userRes.data;

    const productRes = await axios.get(`${URL}/products/${product.id}`);
    const productData = productRes.data;

    // Check remaining stock
    const cartQtyAlready = userData.cart?.find(item => item.id === product.id)?.quantity || 0;
    const totalDesired = cartQtyAlready + quantity;

    if (totalDesired > productData.count) {
      toast.error(`Only ${productData.count - cartQtyAlready} item(s) left in stock.`);
      return;
    }

    // Update user cart
    const isAlreadyInCart = userData.cart?.some(item => item.id === product.id);
    const updatedCart = isAlreadyInCart
      ? userData.cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [...(userData.cart || []), { ...productData, quantity }];

    await axios.patch(`${URL}/users/${user.id}`, { cart: updatedCart });
    const updatedUser = { ...userData, cart: updatedCart };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsInCart(true);

    // Update product stock count (subtract only what's being newly added)
    const newCount = productData.count - quantity;
    await axios.patch(`http://localhost:3001/products/${product.id}`, { count: newCount });

    toast.success("Added to cart!");
  } catch (err) {
    console.error("Cart or stock update failed:", err);
    toast.error("Failed to add to cart.");
  }

  window.dispatchEvent(new Event('cartUpdated'));
};


  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mt-25 mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Image */}
        <div className="md:w-1/2">
          <div className="bg-white rounded-lg overflow-hidden mb-4">
            <img
              src={product.images?.[selectedImage]}
              alt={product.name}
              className="w-full max-h-[500px] object-contain p-2"
            />
          </div>
        </div>

        {/* Right Info */}
        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="mb-6">
            <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900">Description</h3>
            <p className="mt-2 text-gray-600">{product.description}</p>
          </div>

          {/* Quantity Selector */}
          {!isInCart && (
            <div className="flex items-center mb-8">
              <span className="mr-3 text-sm font-medium text-gray-900">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                >-</button>
                <span className="px-4 py-1 text-center border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                >+</button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            {isInCart ? (
              <button
                onClick={() => navigate('/cart')} // ✅ Go to Cart
                className="flex-1 bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Go to Cart
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
