// src/pages/CartPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export default function CartPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const {
    items = [],
    loading: cartLoading,
    error: cartError,
    loadCart,
    removeFromCart,
    updateCartQuantity,
  } = useCart();

  // Local copy for optimistic UI updates
  const [localItems, setLocalItems] = useState(items);
  const [processingIds, setProcessingIds] = useState([]); // single unified tracker

  const startProcessing = (id) =>
    setProcessingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const stopProcessing = (id) =>
    setProcessingIds((prev) => prev.filter((x) => x !== id));

  // Sync context items -> localItems when context updates
  useEffect(() => setLocalItems(items || []), [items]);

  useEffect(() => {
    if (typeof loadCart === "function") loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // CHANGE THIS if backend limit changes
  const MAX_QTY = 5;

  const handleRemove = async (cartItemId) => {
    if (!token) return toast.error("Please login to modify your cart");
    if (processingIds.includes(cartItemId)) return;

    const prev = localItems;
    setLocalItems((cur) =>
      cur.filter((it) => (it.id ?? it.cartItemId ?? it._id) !== cartItemId)
    );

    startProcessing(cartItemId);
    try {
      const updated = await removeFromCart(cartItemId);
      if (Array.isArray(updated)) setLocalItems(updated);
      toast.success("Item removed from cart");
    } catch (err) {
      console.error("Error removing item:", err);
      toast.error("Failed to remove item — reverted");
      setLocalItems(prev);
    } finally {
      stopProcessing(cartItemId);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    if (!token) return toast.error("Please login to modify your cart");
    // enforce backend limits client-side
    if (newQty < 1 || newQty > MAX_QTY) {
      // If user tries to go above max, show a friendly toast and return early
      if (newQty > MAX_QTY) {
        toast("Maximum quantity per item is " + MAX_QTY, { icon: "⚠️" });
      }
      return;
    }
    if (processingIds.includes(cartItemId)) return;

    const prev = localItems;
    setLocalItems((cur) =>
      cur.map((it) => {
        const id = it.id ?? it.cartItemId ?? it._id;
        if (id !== cartItemId) return it;
        return { ...it, quantity: newQty, qty: newQty };
      })
    );

    startProcessing(cartItemId);
    try {
      const updated = await updateCartQuantity(cartItemId, newQty);
      if (Array.isArray(updated)) setLocalItems(updated);
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("Failed to update quantity — reverted");
      setLocalItems(prev);
    } finally {
      stopProcessing(cartItemId);
    }
  };

  const displayImage = (item) =>
    item.imageUrl || item.mainImageUrl || item.images?.[0] || item.image || "/placeholder.png";

  // show loader only for first load
  if (cartLoading && (!items || items.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4">Loading cart...</div>
          <p className="text-sm text-gray-600">Please wait while we fetch your cart.</p>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center text-red-600">
          <p className="mb-2">Failed to load cart.</p>
          <button
            className="px-4 py-2 bg-black text-white rounded-md"
            onClick={() => typeof loadCart === "function" && loadCart()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const list = localItems || [];
  if (!list.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 bg-gray-50">
        <div className="text-7xl mb-8 text-gray-300">🛒</div>
        <h2 className="text-3xl font-light tracking-wider mb-4 text-gray-800 uppercase">
          Your Cart is Empty
        </h2>
        <p className="text-gray-600 mb-10 text-sm tracking-wider max-w-md">
          Looks like you haven't added anything to your cart yet
        </p>
        <button
          onClick={() => navigate("/products")}
          className="px-10 py-4 bg-black text-white uppercase text-xs tracking-widest font-medium border border-black hover:bg-white hover:text-black transition-all duration-300"
        >
          Discover Collections
        </button>
      </div>
    );
  }

  const subtotal = list.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity ?? item.qty ?? 0),
    0
  );
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
            {list.map((item) => {
              const id = item.id ?? item.cartItemId ?? item._id;
              const name = item.name || item.product?.name || "Product";
              const price = item.price ?? item.product?.price ?? 0;
              const qty = item.quantity ?? item.qty ?? 1;
              const isProcessing = processingIds.includes(id);

              return (
                <div
                  key={id}
                  className="flex flex-col md:grid md:grid-cols-12 gap-4 border-b pb-6"
                >
                  <div className="md:col-span-5 flex items-start gap-4">
                    <img
                      src={displayImage(item)}
                      alt={name}
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                    <div>
                      <h3 className="font-medium">{name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.category || item.product?.category}
                      </p>
                      <button
                        onClick={() => handleRemove(id)}
                        className="mt-2 text-sm text-red-600 hover:underline"
                        disabled={isProcessing}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center">
                    <p className="text-gray-800">₹{(price || 0).toLocaleString()}</p>
                  </div>

                  <div className="md:col-span-3 flex items-center">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleUpdateQuantity(id, qty - 1)}
                        className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                        disabled={qty <= 1 || isProcessing}
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-center border-x border-gray-300">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(id, qty + 1)}
                        className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                        disabled={qty >= MAX_QTY || isProcessing}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end">
                    <p className="font-medium">
                      ₹{(((price || 0) * (qty || 0)) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
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
              onClick={() => navigate("/payment")}
              className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
              disabled={cartLoading || list.length === 0}
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
