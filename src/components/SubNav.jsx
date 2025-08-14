import React from 'react';

function SubNav({ activeCategory, setActiveCategory, categories }) {
  // Create category options with 'All' first
  const categoryOptions = [
    { name: 'All', value: 'all' },
    ...categories.map(category => ({
      name: category,
      value: category
    }))
  ];

  return (
    <div className="bg-white shadow-sm pt-15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto py-4 hide-scrollbar">
          {categoryOptions.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value)}
              className={`whitespace-nowrap px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeCategory === category.value
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default SubNav;