import React, { useMemo } from 'react';

/**
 * SubNav
 * - categories: array of strings OR array of objects { id, name } (or { categoryId, categoryName })
 * - activeCategory: can be 'all', a category name, or a category id (string/number)
 * - setActiveCategory: callback (value) => void
 */
function SubNav({ activeCategory, setActiveCategory, categories = [] }) {
  // Normalize incoming categories into { name, value } items
  const categoryOptions = useMemo(() => {
    const parsed = Array.isArray(categories) ? categories : [];

    const items = parsed
      .map((c) => {
        if (!c) return null;
        // If category is an object with common shapes
        if (typeof c === 'object') {
          const id = c.id ?? c.categoryId ?? null;
          const name = c.name ?? c.categoryName ?? c.category ?? null;
          if (!name) return null;
          // prefer id if present (stringified) for stable value, otherwise use name
          const value = id != null ? String(id) : String(name);
          return { name: String(name), value };
        }

        // If category is a primitive (string/number)
        return { name: String(c), value: String(c) };
      })
      .filter(Boolean);

    // ensure 'All' is first
    return [{ name: 'All', value: 'all' }, ...items];
  }, [categories]);

  // Normalize for comparison (makes matching robust)
  const normalize = (v) => (v == null ? '' : String(v).trim().toLowerCase());
  const activeNorm = normalize(activeCategory);

  return (
    <div className="bg-white shadow-sm pt-15"> {/* changed pt-15 -> pt-4 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto py-4 hide-scrollbar">
          {categoryOptions.map((category) => {
            const isActive = normalize(category.value) === activeNorm;
            return (
              <button
                key={category.value + '-' + category.name}
                onClick={() => setActiveCategory(category.value)}
                aria-pressed={isActive}
                className={`whitespace-nowrap px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SubNav;
