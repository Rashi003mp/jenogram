import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { URL } from "../api";

const CategoryCards = () => {
  const [products, setProducts] = useState([]);
  console.log(products);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const categories = [
    { key: "Jeans", label: "Men's Pants" },
    { key: "Shirts", label: "Men's Shirts" },
    { key: "Accessories", label: "Accessories" },
  ];

  useEffect(() => {
    fetch(`${URL}/product/filter`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getCategoryImage = (catKey) => {
    
    const categoryProduct = products.data.find((p) => p.category === catKey);
    return categoryProduct?.images?.[0] ?? "/placeholder-luxury.jpg";
  };

  const handleCategoryClick = (categoryKey) => {
    
    navigate(`/products?category=${categoryKey}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse flex space-x-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 w-64 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="py-20 bg-white">
      
      <div className="overflow-hidden">
        <h2 className="text-3xl font-light text-center mb-2 tracking-wider">
          CHOOS YOUR OWN
        </h2>
        <div className="w-24 h-px bg-black mx-auto mb-12"></div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {categories.map((cat) => (
          <div 
            key={cat.key}
            className="group relative cursor-pointer"
            onClick={() => handleCategoryClick(cat.key)}
          >
           
            <div className="aspect-square overflow-hidden mb-4">
              <img
                src={getCategoryImage(cat.key)}
                alt={cat.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            
           
            <div className="text-center">
              <h3 className="text-xl font-medium tracking-wide">
                {cat.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {products.data.filter(p => p.category === cat.key).length} items
              </p>
              <div className="w-12 h-px bg-gray-300 mx-auto mt-3 group-hover:w-24 transition-all duration-300"></div>
            </div>
          </div>
        ))}
      </div>

      
      <div className="text-center mt-12">
        <button 
          onClick={() => navigate('/products')}
          className="px-6 py-2 border border-black text-sm font-medium hover:bg-black hover:text-white transition-colors duration-300"
        >
          VIEW ALL PRODUCTS
        </button>
      </div>
    </div>
  );
};

export default CategoryCards;