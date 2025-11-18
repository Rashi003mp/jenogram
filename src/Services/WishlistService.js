import axios from "axios";
import { URL } from "../pages/api";

const api = axios.create({
  baseURL: URL,
  // you can set other defaults here
});

function getStoredToken() {
  // Prefer the { token, user } auth object, fallback to a top-level token if present
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }
  } catch (e) {
    console.warn("Failed to parse stored auth:", e);
  }
  // fallback if some code wrote token directly
  const fallback = localStorage.getItem("token");
  return fallback ?? null;
}

export const WishlistService = {
  async getWishlist() {
    try {
      const token = getStoredToken();
      if (!token) throw { status: 401, message: "No auth token" };

      const response = await api.get("/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.data; // array of wishlist items
    } catch (error) {
      console.error("Error fetching wishlist:", extractAxiosError(error));
      throw error;
    }
  },

  async toggleWishlist(productId) {
    try {
      const token = getStoredToken();
      if (!token) throw { status: 401, message: "No auth token" };

      const response = await api.post(
        `/wishlist/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error toggling wishlist:", extractAxiosError(error));
      throw error;
    }
  },
};

// small helper to log axios-friendly error details
function extractAxiosError(err) {
  if (!err) return null;
  if (err.response) {
    return {
      status: err.response.status,
      data: err.response.data,
      headers: err.response.headers,
    };
  }
  return { message: err.message ?? String(err) };
}
