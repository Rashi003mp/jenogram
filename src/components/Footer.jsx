import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#f8f5f0] dark:bg-[#121212] border-t border-[#d1c7b7] dark:border-[#3d3d3d]">
      {/* Monogram pattern background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNNTAgMTBjLTEwIDAtMTggOC0xOCAxOHY0NGMwIDEwIDggMTggMTggMThzMTgtOCAxOC0xOFYyOGMwLTEwLTgtMTgtMTgtMTh6Ii8+PHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTUwIDBjLTEwIDAtMTggOC0xOCAxOHY0NGMwIDEwIDggMTggMTggMThzMTgtOCAxOC0xOFYxOEM2OCA4IDYwIDAgNTAgMHoiIHRyYW5zZm9ybT0icm90YXRlKDQ1IDUwIDUwKSIvPjwvc3ZnPg==')]"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            {/* Brand column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="text-3xl font-serif font-bold text-black dark:text-white">JEANO</div>
                <div className="h-8 w-px bg-black dark:bg-white"></div>
                <div className="text-3xl font-serif font-light text-black dark:text-white">GRAM</div>
              </div>
              <p className="text-sm text-[#555] dark:text-[#aaa] font-light tracking-wide">
                Luxury digital experiences crafted with excellence.
              </p>
            </div>
            
            {/* Navigation */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-black dark:text-white mb-6 font-medium">Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white text-sm font-light tracking-wide transition-colors duration-300">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white text-sm font-light tracking-wide transition-colors duration-300">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white text-sm font-light tracking-wide transition-colors duration-300">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/collections" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white text-sm font-light tracking-wide transition-colors duration-300">
                    Fall-Winter 2025
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Discover */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-black dark:text-white mb-6 font-medium">Discover</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/collection" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white text-sm font-light tracking-wide transition-colors duration-300">
                    The Collection
                  </Link>
                </li>
                <li>
                  <Link to="/uniqueness" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white text-sm font-light tracking-wide transition-colors duration-300">
                    Uniqueness
                  </Link>
                </li>
                <li>
                  <Link to="/custom" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white text-sm font-light tracking-wide transition-colors duration-300">
                    Choose Your Own
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-black dark:text-white mb-6 font-medium">Contact</h3>
              <ul className="space-y-3">
                <a href="tel:+917510737877" className="text-[#333] dark:text-[#e0e0e0] text-sm font-light tracking-wide">
                  +91-751073 7877
                </a>
                <br />
                <a href="mailto:muhammedrashidr222@gmail.com" className="text-[#333] dark:text-[#e0e0e0] text-sm font-light tracking-wide">
                  contact@jeanogram.com
                </a>
                <li className="flex space-x-4 pt-2">
                  <a href="#" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white transition-colors duration-300">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white transition-colors duration-300">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                    </svg>
                  </a>
                  <a href="#" className="text-[#333] dark:text-[#e0e0e0] hover:text-black dark:hover:text-white transition-colors duration-300">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom footer */}
          <div className="border-t border-[#d1c7b7] dark:border-[#3d3d3d] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-[#555] dark:text-[#aaa] tracking-wider font-light">
              &copy; {new Date().getFullYear()} JEANOGRAM. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-xs text-[#555] dark:text-[#aaa] hover:text-black dark:hover:text-white tracking-wider font-light transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs text-[#555] dark:text-[#aaa] hover:text-black dark:hover:text-white tracking-wider font-light transition-colors duration-300">
                Terms of Use
              </Link>
              <Link to="/cookies" className="text-xs text-[#555] dark:text-[#aaa] hover:text-black dark:hover:text-white tracking-wider font-light transition-colors duration-300">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;