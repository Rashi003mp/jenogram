import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF9F6] text-center p-6">
      <h1 className="text-6xl font-bold text-[#CC9966] mb-4">404</h1>
      <h2 className="text-2xl font-light text-[#1A1A1A] mb-2">Page Not Found</h2>
      <p className="text-[#5A5A5A] mb-6 max-w-md">
        Sorry, the page you’re looking for doesn’t exist or has been moved.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 bg-[#CC9966] text-white rounded shadow hover:bg-[#B38658] transition-colors"
        >
          Go Home
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-400 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
