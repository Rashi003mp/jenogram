import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { URL } from '../api';

const OrderList = () => {
  const navigate = useNavigate();
  const { user, refreshUser, isLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        await refreshUser();
      })();
    }
  }, [isAuthenticated]); // Note: refreshUser removed from deps to avoid potential loops

  useEffect(() => {
    if (user?.orders) {
      setOrders(user.orders);
    }
  }, [user]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancellingOrderId(orderId);

      const cancelledOrder = user.orders.find(order => order.id === orderId);
      if (!cancelledOrder) {
        alert("Order not found");
        setCancellingOrderId(null);
        return;
      }

      // Restore stock counts for each item in the cancelled order
      for (const item of cancelledOrder.cart) {
        try {
          const productRes = await fetch(`${URL}/products/${item.id}`);
          const productData = await productRes.json();
          const updatedCount = (productData.count || 0) + (item.quantity || 0);
          await fetch(`${URL}/products/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ count: updatedCount }),
          });
        } catch (err) {
          console.error(`Failed to restore stock for product ${item.id}:`, err);
        }
      }

      // Create a new orders array without the cancelled one
      const updatedOrders = user.orders.filter(order => order.id !== orderId);

      // Update the user object on the backend
      const res = await fetch(`${URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: updatedOrders,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update user data on the server');
      }

      // Refresh user data in the UI to reflect the change
      await refreshUser();
      
      // Notify other components (like admin panel) that orders have changed
      window.dispatchEvent(new Event('ordersUpdated'));

      alert('Order cancelled successfully and stock has been restored.');
    } catch (error) {
      console.error('Cancel order error:', error);
      alert('Could not cancel the order. Please try again.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <p className="text-brown-800 font-serif">Loading your orders...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-serif text-brown-900 mb-4">Access Denied</h2>
          <p className="text-brown-700 mb-6">Please log in to view your orders.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-brown-900 text-cream-50 hover:bg-brown-800 transition duration-300 font-serif uppercase tracking-wider"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-cream-50 text-center p-6">
        <div className="max-w-md">
          <h3 className="text-xl font-serif text-brown-900 mb-2">Your Order Collection</h3>
          <p className="text-brown-600 mb-6 font-serif">
            You have no orders yet. Begin your luxury journey with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-3 bg-brown-900 text-cream-50 hover:bg-brown-800 transition duration-300 font-serif uppercase tracking-wider text-sm"
            >
              Discover Collection
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 border border-brown-900 text-brown-900 hover:bg-brown-50 transition duration-300 font-serif uppercase tracking-wider text-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-brown-900 tracking-wider">YOUR ORDERS</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-brown-900 hover:text-brown-700 transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
        </div>

        <div className="space-y-8">
          {orders.slice().reverse().map((order) => (
            <div key={order.id} className="border border-brown-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-brown-900 text-cream-50 px-6 py-4 flex flex-wrap justify-between items-center">
                <div className="mb-2 sm:mb-0">
                  <h3 className="font-serif text-lg tracking-wider">ORDER #{order.id}</h3>
                  <p className="text-cream-200 text-sm">
                    {new Date(order.placed_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-lg font-serif">₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-serif text-brown-900 uppercase tracking-wider text-sm mb-3">SHIPPING ADDRESS</h4>
                    <address className="not-italic text-brown-700">
                      <p className="font-medium">{order.shipping.firstName} {order.shipping.lastName}</p>
                      <p>{order.shipping.address}</p>
                      <p>{order.shipping.city}, {order.shipping.state} {order.shipping.pincode}</p>
                      <p>{order.shipping.country}</p>
                      <p className="mt-2">Phone: {order.shipping.phone}</p>
                    </address>
                  </div>
                  {/* Billing Address */}
                  <div>
                    <h4 className="font-serif text-brown-900 uppercase tracking-wider text-sm mb-3">BILLING ADDRESS</h4>
                    {order.billing.sameAsShipping ? (
                      <p className="text-brown-700">Same as shipping address</p>
                    ) : (
                      <address className="not-italic text-brown-700">
                        <p className="font-medium">{order.billing.firstName} {order.billing.lastName}</p>
                        <p>{order.billing.address}</p>
                        <p>{order.billing.city}, {order.billing.state} {order.billing.pincode}</p>
                        <p>{order.billing.country}</p>
                        <p className="mt-2">Phone: {order.billing.phone}</p>
                      </address>
                    )}
                  </div>
                  {/* Contact & Payment */}
                  <div>
                    <h4 className="font-serif text-brown-900 uppercase tracking-wider text-sm mb-3">CONTACT & PAYMENT</h4>
                    <p className="text-brown-700 mb-2">{order.contact.email}</p>
                    <p className="text-brown-700">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid with Card'}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h4 className="font-serif text-brown-900 uppercase tracking-wider text-sm mb-4">ITEMS</h4>
                  <div className="divide-y divide-brown-100">
                    {order.cart.map((item) => (
                      <div key={item.id} className="py-4 flex">
                        <div className="flex-shrink-0 w-24 h-24 bg-brown-50 overflow-hidden">
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="ml-4 flex-grow">
                          <h5 className="font-serif text-brown-900">{item.name}</h5>
                          <p className="text-sm text-brown-600 mb-1">{item.description}</p>
                          <p className="text-xs text-brown-500 uppercase">Category: {item.category}</p>
                          <p className="text-xs text-brown-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-brown-900">₹{item.price.toLocaleString()}</p>
                          <p className="text-sm text-brown-600">
                            Subtotal: ₹{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ✅ Conditional Cancel Button */}
                  {(order.status === 'pending' || order.status === 'paid') && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={cancellingOrderId === order.id}
                        className={`relative inline-flex items-center px-6 py-2 text-sm font-serif uppercase tracking-wider transition-transform duration-300 ease-out rounded-2xl shadow-lg transform ${cancellingOrderId === order.id
                          ? 'bg-gray-900 text-yellow-300 opacity-70 cursor-not-allowed border border-yellow-800'
                          : 'bg-black text-[#F5E9C8] hover:scale-[1.03] hover:shadow-2xl border-2 border-transparent hover:border-yellow-500'
                        }`}
                      >
                        {cancellingOrderId === order.id ? 'Processing...' : 'Cancel Order'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
