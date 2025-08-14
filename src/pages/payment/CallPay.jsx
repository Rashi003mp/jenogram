import React, { useEffect, useState } from 'react';
import PaymentForm from './PaymentForm';
import { useAuth } from '../../context/AuthContext';
import { URL } from '../api';

function CallPay() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(false);

  
  const fetchUserData = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${URL}/users/${authUser.id}`);
      if (!res.ok) throw new Error('Failed to fetch user data');
      const freshUser = await res.json();
      setUser(freshUser);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [authUser?.id]);

  
  const clearCart = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: [] })
      });
      if (!res.ok) throw new Error('Failed to clear cart');
      
    
      await fetchUserData();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  if (!authUser) {
    return <div>Please login to proceed to payment</div>;
  }

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (!user || (user.cart?.length || 0) === 0) {
    return <div>Your cart is empty. Please add items before proceeding to payment.</div>;
  }

  return (
    <PaymentForm
      currentUser={user}
      cart={user.cart || []}
      clearCart={clearCart}
    />
  );
}

export default CallPay;
