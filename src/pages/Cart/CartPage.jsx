import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { URL } from '../api';

export default function CartPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch cart from server
    const fetchCart = async () => {
        try {
            const res = await axios.get(`${URL}/users/${user.id}`);
            setCart(res.data.cart || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    // Remove item from cart
   const handleRemove = async (productId) => {
  try {
    // 1️⃣ Find the product in cart first (to get quantity for stock restore)
    const removedItem = cart.find((item) => item.id === productId);
    if (!removedItem) {
      toast.error("Item not found in cart.");
      return;
    }

    // 2️⃣ Remove the product from the cart array
    const updatedCart = cart.filter((item) => item.id !== productId);

    // 3️⃣ Update the user's cart in backend
    await axios.patch(`${URL}/users/${user.id}`, {
      cart: updatedCart,
    });

    // 4️⃣ Restore stock count in products list backend
    const productRes = await axios.get(`${URL}/products/${productId}`);
    const productData = productRes.data;

    const restoredCount = productData.count + removedItem.quantity;

    await axios.patch(`${URL}/products/${productId}`, {
      count: restoredCount,
    });

    // 5️⃣ Update cart state in frontend
    setCart(updatedCart);

    // 6️⃣ Update localStorage
    const localUser = JSON.parse(localStorage.getItem("user")) || {};
    localUser.cart = updatedCart;
    localStorage.setItem("user", JSON.stringify(localUser));

    // 7️⃣ Trigger cartUpdated event for navbar/cart icon
    window.dispatchEvent(new Event("cartUpdated"));

    // 8️⃣ Success toast
    toast.success("Item removed from cart & stock restored");
  } catch (error) {
    console.error("Error removing item:", error);
    toast.error("Failed to remove item");
  }
};

    // Update item quantity
    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1 || newQuantity > 10) return;

        try {
            const updatedCart = cart.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            );

            // Update server
            await axios.patch(`${URL}/users/${user.id}`, {
                cart: updatedCart,
            });

            // Update local state
            setCart(updatedCart);

            // Update localStorage
            const localUser = JSON.parse(localStorage.getItem('user')) || {};
            localUser.cart = updatedCart;
            localStorage.setItem('user', JSON.stringify(localUser));

            // Notify Navbar instantly
            window.dispatchEvent(new Event('cartUpdated'));

        } catch (error) {
            console.error("Error updating quantity:", error);
            toast.error("Failed to update quantity");
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchCart();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-pulse text-xl">Loading your cart...</div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 bg-gray-50">
                <div className="text-7xl mb-8 text-gray-300">🛒</div>
                <h2 className="text-3xl font-light tracking-wider mb-4 text-gray-800 uppercase">
                    Your Cart is Empty
                </h2>
                <p className="text-gray-600 mb-10 text-sm tracking-wider max-w-md">
                    Looks like you haven't added anything to your cart yet
                </p>
                <a
                    href="/products"
                    className="px-10 py-4 bg-black text-white uppercase 
                               text-xs tracking-widest font-medium border border-black
                               hover:bg-white hover:text-black transition-all duration-300"
                >
                    Discover Collections
                </a>
            </div>
        );
    }

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal > 2000 ? 0 : 99;
    const total = subtotal + shipping;

    return (
        <div className="max-w-6xl mt-20 mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items */}
                <div className="lg:w-2/3">
                    <div className="hidden md:grid grid-cols-12 gap-4 border-b pb-2 mb-4">
                        <div className="col-span-5 font-medium text-gray-600">PRODUCT</div>
                        <div className="col-span-2 font-medium text-gray-600">PRICE</div>
                        <div className="col-span-3 font-medium text-gray-600">QUANTITY</div>
                        <div className="col-span-2 font-medium text-gray-600">TOTAL</div>
                    </div>

                    <div className="space-y-6">
                        {cart.map((item) => (
                            <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 border-b pb-6">
                                {/* Product Info */}
                                <div className="md:col-span-5 flex items-start gap-4">
                                    <img
                                        src={item.images?.[0]}
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded-md border"
                                    />
                                    <div>
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-sm text-gray-600">{item.category}</p>
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="mt-2 text-sm text-red-600 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="md:col-span-2 flex items-center">
                                    <p className="text-gray-800">₹{item.price.toLocaleString()}</p>
                                </div>

                                {/* Quantity Controls */}
                                <div className="md:col-span-3 flex items-center">
                                    <div className="flex items-center border border-gray-300 rounded-md">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="px-4 py-1 text-center border-x border-gray-300">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                                            disabled={item.quantity >= 10}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="md:col-span-2 flex items-center justify-end">
                                    <p className="font-medium">
                                        ₹{(item.price * item.quantity).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:w-1/3">
                    <div className="bg-gray-50 p-6 rounded-md border">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span>
                                    {shipping === 0 ? (
                                        <span className="text-green-600">Free</span>
                                    ) : (
                                        `₹${shipping}`
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-medium">Total</span>
                                <span className="font-bold">₹{total.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/payment')}
                            className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                        >
                            Proceed to Checkout
                        </button>

                        <div className="mt-4 text-sm text-gray-500 text-center">
                            Free shipping on orders over ₹2000
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
