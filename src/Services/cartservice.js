import axios from 'axios';
import { URL } from '../pages/api';

export const CartService = {
  // Get cart items for current user
  getCart: async (token) => {
    const response = await axios.get(`${URL}/cart`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.data?.items || [];
  },

  // Add item to cart
  addToCart: async (token, productId, quantity) => {
    await axios.post(`${URL}/cart`, {
      productId: parseInt(productId),
      quantity: parseInt(quantity),
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    // ✅ Fetch updated cart after adding
    return await CartService.getCart(token);
  },

  // Remove item from cart
  removeFromCart: async (token, cartItemId) => {
    await axios.delete(`${URL}/cart/${cartItemId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    // ✅ Fetch updated cart
    return await CartService.getCart(token);
  },

  // Update cart item quantity
  updateCartQuantity: async (token, cartItemId, quantity) => {
    await axios.put(`${URL}/cart/${cartItemId}`, {
      quantity: parseInt(quantity),
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    // ✅ Fetch updated cart
    return await CartService.getCart(token);
  },

  // Clear entire cart
  clearCart: async (token) => {
    await axios.delete(`${URL}/cart`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    // ✅ Fetch updated cart (should be empty)
    return await CartService.getCart(token);
  },
};