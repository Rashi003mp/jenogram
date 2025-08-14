// src/context/WishlistContext.js
import React, { createContext, useState, useEffect } from "react";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [wishlist, setWishlist] = useState(user?.wishlist || []);

  // Keep wishlist in sync with user
  useEffect(() => {
    if (user) {
      setWishlist(user.wishlist || []);
    } else {
      setWishlist([]);
    }
  }, [user]);

  // Save user to localStorage whenever updated
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  return (
    <WishlistContext.Provider value={{ user, setUser, wishlist, setWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
