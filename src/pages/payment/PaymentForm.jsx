// src/pages/Payment.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { URL } from "../api";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { CartService } from "../../Services/cartservice";

const PAYMENT_ENUM = { cod: 0, razorpay: 1 };

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Razorpay SDK failed to load"));
    document.body.appendChild(s);
  });

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const { token: ctxToken, user: authUserFromCtx, setCartLength } = useAuth() ?? {};
  const cartContext = useCart?.() ?? null;
  const cartItemsFromContext = cartContext?.items ?? null;
  const contextClearCart = cartContext?.clearCart ?? null;

  const buyNow = location.state?.buyNow ?? null;

  const [user, setUser] = useState(authUserFromCtx || null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("razorpay");
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    phoneNumber: "",
    country: "India",
  });

  const getAuthTokenOrNotify = () => {
    const t = ctxToken ?? user?.token ?? null;
    console.log("getAuthTokenOrNotify token:", t);
    if (!t) {
      toast.error("Session expired or not logged in. Please login.");
      return null;
    }
    return t;
  };

  const fetchUserData = async () => {
    const id = authUserFromCtx?.id ?? user?.id;
    if (!id) return;
    setLoadingUser(true);
    try {
      const res = await fetch(`${URL}/user/${id}`);
      if (!res.ok) {
        console.warn("fetchUserData non-ok:", res.status);
        return;
      }
      const fresh = await res.json();
      setUser(fresh);
      if (fresh?.shippingAddress) setBillingAddress(prev => ({ ...prev, ...fresh.shippingAddress }));
    } catch (err) {
      console.error("fetchUserData error", err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (authUserFromCtx && (!user || authUserFromCtx.id !== user.id)) setUser(authUserFromCtx);
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserFromCtx?.id, ctxToken]);

  useEffect(() => {
    const loadCart = async () => {
      if (buyNow) {
        setCart([{
          productId: buyNow.productId,
          name: buyNow.name ?? buyNow.productName ?? "Product",
          price: buyNow.price,
          quantity: buyNow.quantity ?? 1,
          imageUrl: buyNow.imageUrl,
        }]);
        return;
      }

      if (Array.isArray(cartItemsFromContext) && cartItemsFromContext.length > 0) {
        setCart(cartItemsFromContext);
        return;
      }

      const t = ctxToken ?? user?.token ?? null;
      if (t) {
        try {
          const cartItems = await CartService.getCart(t);
          if (Array.isArray(cartItems) && cartItems.length > 0) {
            setCart(cartItems);
            return;
          }
        } catch (err) {
          console.warn("CartService.getCart failed:", err);
        }
      }

      if (user?.cart && Array.isArray(user.cart)) {
        setCart(user.cart);
      } else {
        setCart([]);
      }
    };

    loadCart();
  }, [buyNow, cartItemsFromContext, user, ctxToken]);

  const clearCart = async () => {
    // try context clear first (if available)
    if (typeof contextClearCart === "function") {
      try {
        await contextClearCart();
        setCart([]);
        await fetchUserData();
        if (typeof setCartLength === "function") setCartLength(0);
        return;
      } catch (e) {
        console.warn("contextClearCart failed", e);
      }
    }

    // fallback: patch user cart to empty
    if (!user && !authUserFromCtx) return;
    const userId = user?.id ?? authUserFromCtx?.id;

    try {
      const res = await fetch(`${URL}/user/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: [] }),
      });
      if (!res.ok) throw new Error("Failed to clear cart");
      setCart([]);
      await fetchUserData();
      if (typeof setCartLength === "function") setCartLength(0);
      return;
    } catch (err) {
      console.warn("patch user cart failed", err);
    }

    try {
      const t = ctxToken ?? user?.token ?? null;
      if (t) {
        await CartService.clearCart(t);
        setCart([]);
        if (typeof setCartLength === "function") setCartLength(0);
      }
    } catch (err) {
      console.warn("CartService.clearCart failed", err);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  const handlePayment = async () => {
    if (!authUserFromCtx && !user) {
      toast.error("Please login to proceed");
      return;
    }
    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }
    if (!billingAddress.street || !billingAddress.city || !billingAddress.state || !billingAddress.zip) {
      toast.error("Please complete your billing address");
      return;
    }

    const t = getAuthTokenOrNotify();
    if (!t) return;

    setIsProcessing(true);
    const headers = { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };

    try {
      const paymentMethodEnum = PAYMENT_ENUM[selectedPaymentMethod];
      if (paymentMethodEnum === undefined) throw new Error("Invalid payment method selected.");

      const basePayload = {
        addressId: 0,
        newAddress: {
          id: 0,
          fullName: (user?.name ?? authUserFromCtx?.name ?? "Customer"),
          phoneNumber: billingAddress.phoneNumber || user?.phone || authUserFromCtx?.phone || "",
          addressLine1: billingAddress.street,
          addressLine2: "",
          city: billingAddress.city,
          state: billingAddress.state,
          country: billingAddress.country ?? "India",
          postalCode: billingAddress.zip,
          isDefault: false,
        },
        paymentMethod: paymentMethodEnum,
        items: cart.map(it => ({ productId: it.productId, quantity: it.quantity, price: it.price })),
      };

      // ---------- Razorpay path ----------
      if (selectedPaymentMethod === "razorpay") {
        console.log("Creating order on backend (razorpay):", basePayload);
        const createRes = await axios.post(`${URL}/Order/create`, basePayload, { headers, validateStatus: () => true });
        console.log("Order.create response:", createRes.status, createRes.data);

        if (createRes.status === 401 || createRes.status === 403) {
          toast.error("Authentication failed. Please login again.");
          setIsProcessing(false);
          return;
        }
        if (!(createRes.status >= 200 && createRes.status < 300)) {
          const msg = createRes.data?.message ?? `Create order failed: ${createRes.status}`;
          toast.error(msg);
          setIsProcessing(false);
          return;
        }

        const backend = createRes.data?.data ?? createRes.data;
        const key = backend?.key;
        const razorpayOrderId = backend?.razorpayOrderId ?? backend?.orderId ?? backend?.razorpay_order_id;
        const localOrderId = backend?.localOrderId ?? backend?.orderIdLocal ?? backend?.localOrderId;

        if (!key || !razorpayOrderId) {
          console.error("Missing key/orderId from backend", backend);
          toast.error("Payment setup failed. Try again.");
          setIsProcessing(false);
          return;
        }

        // load SDK
        try {
          await loadRazorpayScript();
        } catch (e) {
          console.error("Razorpay SDK load failed", e);
          toast.error("Payment SDK failed to load. Refresh and try again.");
          setIsProcessing(false);
          return;
        }

        const options = {
          key,
          amount: Math.round(cartTotal * 100),
          currency: backend.currency ?? "INR",
          order_id: razorpayOrderId,
          name: backend?.name ?? "ShoeCart",
          description: backend?.description ?? "Order Payment",
          prefill: { name: (user?.name ?? authUserFromCtx?.name) || "", email: (user?.email ?? authUserFromCtx?.email) || "" },
          theme: { color: "#F75555" },

          handler: async (razorpayResp) => {
            try {
              console.log("Razorpay handler response:", razorpayResp);
              // Verify at backend first
              const verifyRes = await axios.post(
                `${URL}/Order/razorpay/verify`,
                {
                  localOrderId: localOrderId ?? backend?.localOrderId ?? null,
                  razorpayOrderId: razorpayResp.razorpay_order_id,
                  razorpayPaymentId: razorpayResp.razorpay_payment_id,
                  razorpaySignature: razorpayResp.razorpay_signature,
                },
                { headers, validateStatus: () => true }
              );

              console.log("Verify response:", verifyRes.status, verifyRes.data);

              if (verifyRes.status === 401 || verifyRes.status === 403) {
                toast.error("Verification failed due to authentication. Please login again.");
                setIsProcessing(false);
                return;
              }
              if (!(verifyRes.status >= 200 && verifyRes.status < 300)) {
                const msg = verifyRes.data?.message ?? `Verify failed: ${verifyRes.status}`;
                console.error("Verify failed:", verifyRes.data);
                toast.error(msg);
                setIsProcessing(false);
                return;
              }

              // verification success => now clear cart and navigate
              try {
                await clearCart();
              } catch (e) {
                console.warn("clearCart after verify failed (non-fatal)", e);
              }
              if (typeof setCartLength === "function") {
                try { setCartLength(0); } catch (e) { console.warn("setCartLength failed", e); }
              }

              toast.success("Payment verified and order placed 🎉");
              setIsProcessing(false);
              navigate("/order-list");
            } catch (verifyErr) {
              console.error("Payment verification error:", verifyErr);
              toast.error("Payment verification failed. Contact support.");
              setIsProcessing(false);
            }
          },

          modal: {
            ondismiss: () => {
              // user closed checkout window before completing payment
              console.info("Razorpay modal dismissed");
              setIsProcessing(false);
              toast.info("Payment cancelled");
            },
          },
        };

        // open checkout
        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
          // handle failed payment event (user attempted payment but it failed)
          rzp.on("payment.failed", (err) => {
            console.error("Razorpay payment.failed:", err);
            // don't clear cart here
            toast.error("Payment failed ❌");
            setIsProcessing(false);
          });
        } catch (err) {
          console.error("Error opening Razorpay:", err);
          toast.error("Unable to open payment window. Try again.");
          setIsProcessing(false);
        }
      }
      // ---------- COD path ----------
      else {
        const createRes = await axios.post(`${URL}/Order/create`, basePayload, { headers, validateStatus: () => true });
        console.log("COD create response:", createRes.status, createRes.data);

        if (createRes.status === 401 || createRes.status === 403) {
          toast.error("Authentication failed. Please login again.");
          setIsProcessing(false);
          return;
        }
        if (!(createRes.status >= 200 && createRes.status < 300)) {
          const msg = createRes.data?.message ?? `Failed to place order: ${createRes.status}`;
          toast.error(msg);
          setIsProcessing(false);
          return;
        }

        const created = createRes.data?.data ?? createRes.data;
        const orderId = created?.id ?? created?.orderId ?? null;

        // clear cart immediately for COD
        try {
          await clearCart();
        } catch (e) {
          console.warn("clearCart after COD failed (non-fatal)", e);
        }

        if (typeof setCartLength === "function") {
          try {
            setCartLength(0);
          } catch (e) {
            console.warn("setCartLength failed", e);
          }
        }

        toast.success("Order placed successfully ✅");
        setIsProcessing(false);

        // Navigate to order list without replace flag to preserve history
        navigate("/order-list");
        return;
      }
    } catch (err) {
      console.error("Payment error (outer):", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(err?.message || "Payment failed. Try again!");
      }
      setIsProcessing(false);
    }
  };

  const paymentButtonType = "button";

  if (!authUserFromCtx && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">Please login to proceed</div>
          <button onClick={() => navigate("/login")} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  if (loadingUser) return <div>Loading user data...</div>;

  // billing input fields - use keys that match billingAddress object
  const billingFields = [
    { key: "street", label: "Street" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip", label: "ZIP Code" },
    { key: "phoneNumber", label: "Phone Number" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Secure Payment</h1>
          <p className="text-gray-600">Complete your purchase with confidence</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "razorpay", name: "Razorpay", icon: "https://razorpay.com/assets/razorpay-glyph.svg", description: "Pay securely with Razorpay" },
                  { id: "cod", name: "Cash on Delivery", icon: "https://cdn-icons-png.flaticon.com/128/11181/11181299.png", description: "Pay when you receive your order" },
                ].map((method) => (
                  <button key={method.id} type="button" onClick={() => setSelectedPaymentMethod(method.id)} className={`p-6 border-2 rounded-xl flex flex-col items-start transition-all duration-200 ${selectedPaymentMethod === method.id ? "border-red-500 bg-red-50 shadow-md transform scale-105" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                    <div className="flex items-center mb-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${selectedPaymentMethod === method.id ? "border-red-500 bg-red-500" : "border-gray-300"}`}>
                        {selectedPaymentMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <img src={method.icon} alt={method.name} className="h-8 object-contain" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{method.name}</h3>
                    <p className="text-gray-600 text-sm">{method.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-900">Billing Address</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {billingFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                    <input
                      placeholder={`Enter your ${field.label}`}
                      value={billingAddress[field.key]}
                      onChange={(e) => setBillingAddress({ ...billingAddress, [field.key]: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">{billingAddress.country}</div>
              </div>
            </div>
          </div>

          {/* right */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8 h-fit">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
            </div>

            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-22 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-red-600">${cartTotal.toFixed(2)}</span>
              </div>
              {selectedPaymentMethod === "cod" && <p className="text-sm text-gray-600 mt-2 text-center">+ Cash handling charges may apply</p>}
            </div>

            <button type={paymentButtonType} onClick={handlePayment} disabled={isProcessing || !cart.length} className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${isProcessing || !cart.length ? "bg-gray-400 cursor-not-allowed text-gray-700" : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105"}`}>
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </div>
              ) : selectedPaymentMethod === "cod" ? (
                `Place Order - $${cartTotal.toFixed(2)}`
              ) : (
                `Pay Now  $${cartTotal.toFixed(2)}`
              )}
            </button>

            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>Secure SSL Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
