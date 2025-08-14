import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    } else {
      refreshUser();
    }
  }, [orderId, navigate, refreshUser]);

  const order = user?.orders?.find(order => order.id === orderId);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p>Loading order details...</p>
      </div>
    );
  }

  const orderDate = new Date(order.placed_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light mb-4">THANK YOU FOR YOUR ORDER</h1>
        <p className="text-sm text-gray-600">Order #{orderId}</p>
        <p className="text-sm text-gray-600">Placed on {orderDate}</p>
      </div>

      <div className="border-b border-gray-200 pb-8 mb-8">
        <h2 className="text-xl font-medium mb-6">ORDER SUMMARY</h2>

        <div className="space-y-6">
          {order.cart.map(item => (
            <div key={item.id} className="flex items-start border-b border-gray-100 pb-6">
              <div className="w-24 h-24 bg-gray-50 flex-shrink-0">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-6 flex-grow">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.category}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm">Qty: {item.quantity}</span>
                  <span className="font-medium">₹{item.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-md ml-auto">
          <div className="flex justify-between py-2">
            <span>Subtotal</span>
            <span>₹{(order.totalAmount - 200).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Shipping</span>
            <span>₹200</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
            <span className="font-medium">Total</span>
            <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-xl font-medium mb-4">SHIPPING ADDRESS</h2>
          <address className="not-italic text-gray-700">
            {order.shipping.firstName} {order.shipping.lastName}<br />
            {order.shipping.address}<br />
            {order.shipping.city}, {order.shipping.state}<br />
            {order.shipping.pincode}<br />
            {order.shipping.country}<br />
            Phone: {order.shipping.phone}
          </address>
        </div>

        <div>
          <h2 className="text-xl font-medium mb-4">PAYMENT METHOD</h2>
          <p className="text-gray-700 capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>

          <h2 className="text-xl font-medium mt-6 mb-4">CONTACT INFORMATION</h2>
          <p className="text-gray-700">{order.contact.email}</p>
          <p className="text-gray-700 mt-2">
            {order.contact.news ? 'Subscribed to newsletter' : 'Not subscribed to newsletter'}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6">
        <h2 className="text-xl font-medium mb-4">WHAT HAPPENS NEXT?</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 text-gray-400 mr-3 mt-1">2</div>
            <div>
              <h3 className="font-medium">Order Processing</h3>
              <p className="text-gray-600 text-sm mt-1">
                We're preparing your items for shipment. Expected dispatch within 1-2 business days.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 text-gray-400 mr-3 mt-1">3</div>
            <div>
              <h3 className="font-medium">Delivery</h3>
              <p className="text-gray-600 text-sm mt-1">
                Your order will be delivered within 3-5 business days after dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
        >
          CONTINUE SHOPPING
        </button>
        <button
          onClick={() => navigate('/order-list')}
          className="px-8 py-3 border border-black text-black hover:bg-gray-50 transition-colors"
        >
          VIEW ORDER HISTORY
        </button>
      </div>

      <div className="mt-12 text-center text-sm text-gray-600">
        <p>Need help with your order?</p>
        <p className="mt-2">
          Contact us at <a href="mailto:customer.service@example.com" className="underline">customer.service@example.com</a>
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmation;