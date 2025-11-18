import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// Adjust this import path to where your CartService lives in your project
// If you have an Auth context that provides the user's token, import it here
import { useAuth } from './AuthContext';
import { CartService } from '../Services/cartservice';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const { token } = useAuth() || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cart from server
  const loadCart = useCallback(async () => {
    if (!token) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await CartService.getCart(token);
      // assume CartService.getCart returns an array of items
      setItems(data);
    } catch (err) {
      setError(err);
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Add an item and refresh cart (CartService already returns updated cart)
  const addToCart = async (productId, quantity = 1) => {
    if (!token) throw new Error('No auth token');
    setLoading(true);
    try {
      const updated = await CartService.addToCart(token, productId, quantity);
      setItems(updated);
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove item
  const removeFromCart = async (cartItemId) => {
    if (!token) throw new Error('No auth token');
    setLoading(true);
    try {
      const updated = await CartService.removeFromCart(token, cartItemId);
      setItems(updated);
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateCartQuantity = async (cartItemId, quantity) => {
    if (!token) throw new Error('No auth token');
    setLoading(true);
    try {
      const updated = await CartService.updateCartQuantity(token, cartItemId, quantity);
      setItems(updated);
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!token) throw new Error('No auth token');
    setLoading(true);
    try {
      const updated = await CartService.clearCart(token);
      setItems(updated);
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-load cart when token becomes available
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const value = {
    items,
    loading,
    error,
    loadCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
