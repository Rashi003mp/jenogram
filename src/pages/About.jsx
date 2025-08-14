import React from 'react';
import Footer from '../components/Footer';

function AboutPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-light tracking-wider text-gray-900 uppercase mb-4">About Us</h1>
          <div className="w-16 h-px bg-gray-300 mx-auto"></div>
        </div>

        {/* Content */}
        <div className="space-y-10 text-center">
          <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm">
            <p className="text-gray-700 leading-relaxed tracking-wide mb-8">
              Welcome to our e-commerce platform. We are committed to providing you with an exceptional online shopping experience, offering a meticulously curated selection of premium apparel and accessories that embody timeless elegance and contemporary style.
            </p>
            
            <p className="text-gray-700 leading-relaxed tracking-wide mb-8">
              Our mission is to redefine luxury shopping by making it effortlessly convenient, secure, and deeply satisfying. We present only the finest pieces, accompanied by comprehensive product details and seamless checkout options including Cash on Delivery and UPI payments.
            </p>
            
            <p className="text-gray-700 leading-relaxed tracking-wide mb-8">
              We cherish our discerning clientele and are dedicated to delivering unparalleled service through expedited shipping, effortless returns, and personalized support. Your complete satisfaction is the foundation of our philosophy.
            </p>
            
            <p className="text-gray-700 leading-relaxed tracking-wide">
              We are honored by your choice to shop with us and look forward to crafting an unforgettable shopping experience that meets your exacting standards.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm mt-12">
            <h2 className="text-xl font-light tracking-wider text-gray-900 uppercase mb-6">Contact Our Client Advisors</h2>
            <div className="space-y-2 text-gray-700 tracking-wide">
              <p className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span><a href='mailto:shabasrahman@gmail.com'>support@yourwebsite.com</a></span>
              </p>
              <p className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span><a href='tel:+917510737877'>+917510737877</a></span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AboutPage;