import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL } from '../api';
import { ChevronLeft } from 'lucide-react';

const PaymentForm = ({ currentUser, cart, clearCart }) => {
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState(() => {
    const lastOrder = currentUser.orders?.[currentUser.orders.length - 1];
    return lastOrder?.shipping || {
      country: 'India',
      firstName: currentUser.name.split(' ')[0] || '',
      lastName: currentUser.name.split(' ')[1] || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
    };
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({ ...shippingAddress });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 100;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    if (sameAsShipping) setBillingAddress(shippingAddress);
  }, [shippingAddress, sameAsShipping]);

  const validateForm = () => {
    const newErrors = {};

    ['firstName', 'lastName', 'address', 'city', 'state', 'pincode', 'phone'].forEach((field) => {
      if (!shippingAddress[field]?.trim()) newErrors[`shipping_${field}`] = 'Required';
    });

    if (!sameAsShipping) {
      ['firstName', 'lastName', 'address', 'city', 'state', 'pincode', 'phone'].forEach((field) => {
        if (!billingAddress[field]?.trim()) newErrors[`billing_${field}`] = 'Required';
      });
    }


    if (paymentMethod === 'card') {
      if (!/^\d{16}$/.test(cardDetails.cardNumber.replace(/\s+/g, ''))) newErrors.cardNumber = 'Invalid card number';
      if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) newErrors.expiry = 'Invalid expiry date (MM/YY)';
      if (!/^\d{3,4}$/.test(cardDetails.cvv)) newErrors.cvv = 'Invalid CVV';
      if (!cardDetails.nameOnCard.trim()) newErrors.nameOnCard = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;

    setIsSubmitting(true);

    const orderData = {
      id: `order_${Date.now()}`,
      userId: currentUser.id,
      contact: {
        email: currentUser.email,
        news: true,
      },
      shipping: shippingAddress,
      billing: sameAsShipping ? { sameAsShipping: true } : billingAddress,
      cart: cart.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        count: item.count,
        category: item.category,
        images: item.images,
        isActive: item.isActive,
        created_at: item.created_at,
        quantity: item.quantity,
      })),
      paymentMethod,
      totalAmount: total,
      status: paymentMethod === 'cod' ? 'pending' : 'paid',
      placed_at: new Date().toISOString(),
    };

    try {
      const updatedOrders = [...(currentUser.orders || []), orderData];

      const userResponse = await fetch(`${URL}/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: updatedOrders,
          cart: [],
        }),
      });

      if (!userResponse.ok) throw new Error('Failed to update user');

      await Promise.all(
        cart.map(item => {
          const newCount = item.count - item.quantity;
          return fetch(`${URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: newCount }),
          });
        })
      );

      await clearCart();

      navigate('/order-confirmation', { state: { orderId: orderData.id } });
    } catch (error) {
      console.error(error);
      setSubmitError('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
 <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 px-4 py-2 border border-black rounded-full
                 text-sm font-medium tracking-wide hover:bg-black hover:text-white 
                 transition-all duration-300"
      style={{
        fontFamily: "'Didot', serif", 
        letterSpacing: "0.05em",
      }}
    >
      <ChevronLeft size={18} />
      BACK
    </button>
      <h2 className="text-2xl font-bold mb-6">Complete Your Purchase</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg">
          <h3 className="font-medium text-lg mb-4">Order Summary</h3>
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between py-2 border-b">
              <div>
                <p>{item.name}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
              <p>₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{shippingCost.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Tax (5%)</span><span>₹{tax.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold mt-4 pt-2 border-t"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} noValidate>
            <fieldset className="mb-8">
              <legend className="font-medium text-lg mb-4">Shipping Address</legend>
              <div className="grid grid-cols-2 gap-4">
                {['firstName', 'lastName', 'address', 'city', 'state', 'pincode', 'phone'].map(field => (
                  <div key={field}>
                    <label htmlFor={`shipping_${field}`} className="block text-sm font-semibold mb-1 capitalize">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type={field === 'phone' ? 'tel' : 'text'}
                      id={`shipping_${field}`}
                      name={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={shippingAddress[field]}
                      onChange={handleShippingChange}
                      className={`p-2 border rounded w-full ${errors[`shipping_${field}`] ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {errors[`shipping_${field}`] && (
                      <p className="text-red-600 text-sm mt-1">{errors[`shipping_${field}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-8">
              <label className="flex items-center mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={() => setSameAsShipping(prev => !prev)}
                  className="mr-2"
                />
                Billing address same as shipping
              </label>
              {!sameAsShipping && (
                <div className="grid grid-cols-2 gap-4">
                  {['firstName', 'lastName', 'address', 'city', 'state', 'pincode', 'phone'].map(field => (
                    <div key={field}>
                      <label htmlFor={`billing_${field}`} className="block text-sm font-semibold mb-1 capitalize">
                        {field.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type={field === 'phone' ? 'tel' : 'text'}
                        id={`billing_${field}`}
                        name={field}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        value={billingAddress[field]}
                        onChange={handleBillingChange}
                        className={`p-2 border rounded w-full ${errors[`billing_${field}`] ? 'border-red-500' : 'border-gray-300'}`}
                        required
                      />
                      {errors[`billing_${field}`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`billing_${field}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset className="mb-8">
              <legend className="font-medium text-lg mb-4">Payment Method</legend>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mr-2"
                  />
                  Cash on Delivery (COD)
                </label>
                <label className="flex items-center p-3 border rounded cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mr-2"
                  />
                  Credit/Debit Card
                </label>

                {paymentMethod === 'card' && (
                  <div className="mt-4 space-y-4 p-4 border rounded bg-white">
                    <div>
                      <label htmlFor="cardNumber" className="block text-sm font-semibold mb-1">Card Number</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        maxLength={19}
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={handleCardChange}
                        className={`p-2 border rounded w-full ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                        required
                      />
                      {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiry" className="block text-sm font-semibold mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          id="expiry"
                          name="expiry"
                          maxLength={5}
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={handleCardChange}
                          className={`p-2 border rounded w-full ${errors.expiry ? 'border-red-500' : 'border-gray-300'}`}
                          required
                        />
                        {errors.expiry && <p className="text-red-600 text-sm mt-1">{errors.expiry}</p>}
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-semibold mb-1">CVV</label>
                        <input
                          type="password"
                          id="cvv"
                          name="cvv"
                          maxLength={4}
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          className={`p-2 border rounded w-full ${errors.cvv ? 'border-red-500' : 'border-gray-300'}`}
                          required
                        />
                        {errors.cvv && <p className="text-red-600 text-sm mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="nameOnCard" className="block text-sm font-semibold mb-1">Name on Card</label>
                      <input
                        type="text"
                        id="nameOnCard"
                        name="nameOnCard"
                        placeholder="Name on Card"
                        value={cardDetails.nameOnCard}
                        onChange={handleCardChange}
                        className={`p-2 border rounded w-full ${errors.nameOnCard ? 'border-red-500' : 'border-gray-300'}`}
                        required
                      />
                      {errors.nameOnCard && <p className="text-red-600 text-sm mt-1">{errors.nameOnCard}</p>}
                    </div>
                  </div>
                )}
              </div>
            </fieldset>

            {submitError && (
              <p className="mb-4 text-red-700 text-center font-semibold">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded text-white ${isSubmitting ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} transition`}
            >
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
