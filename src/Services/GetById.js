// src/service/UserService.js
import axios from 'axios';
import { URL } from '../pages/api';

export const UserService = {
  async getUserById(id) {
    if (!id) throw new Error('User id required');

    // Make GET request without Authorization header
    const config = {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    };

    const res = await axios.get(`${URL}/User/${encodeURIComponent(id)}`, config);
    return res.data; // full user profile
  },
};
