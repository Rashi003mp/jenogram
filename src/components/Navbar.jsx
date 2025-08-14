import { NavLink } from 'react-router-dom';
import {
    Bars3Icon as MenuIcon,
    XMarkIcon as XIcon,
    HeartIcon,
    UserIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const dropdownRef = useRef(null);

    // Close user dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load and watch cart count
    useEffect(() => {
        function getCartCount() {
            const userData = JSON.parse(localStorage.getItem('user')) || {};
            const mycart = userData.cart || [];
            const count = mycart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            setCartItemsCount(count);
        }

        getCartCount();

        // 🔹 Listen for cart update event from SAME TAB
        const handleCartUpdate = () => getCartCount();
        window.addEventListener('cartUpdated', handleCartUpdate);

        // 🔹 Listen for localStorage change (other tabs)
        const handleStorageChange = (e) => {
            if (e.key === 'user') getCartCount();
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleNavigation = (path, requiresAuth = false) => {
        setMobileMenuOpen(false);
        if (requiresAuth && !user) {
            navigate('/login');
        } else {
            navigate(path);
        }
    };

    const handleLogout = () => {
        logout();
        setUserDropdownOpen(false);
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 border-b border-gray-200 bg-white z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Mobile menu button + Logo */}
                    <div className="flex items-center">
                        <button
                            type="button"
                            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <XIcon className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>

                        <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
                            <span className="text-xl font-light tracking-widest">JEANO|GRAM</span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:ml-6 md:flex md:space-x-8">
                        <NavLink to="/" className={({ isActive }) =>
                            `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-grey-500 text-gray-900'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`
                        }>
                            Home
                        </NavLink>
                        <NavLink to="/products" className={({ isActive }) =>
                            `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-grey-500 text-gray-900'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`
                        }>
                            Products
                        </NavLink>
                        <NavLink to="/about" className={({ isActive }) =>
                            `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-grey-500 text-gray-900'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`
                        }>
                            About
                        </NavLink>
                    </div>

                    {/* Icons */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => handleNavigation('/wishlist', true)}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                        >
                            <HeartIcon className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Cart Icon with Count */}
                        <div className="relative">
                            <button
                                onClick={() => handleNavigation('/cart', true)}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                            >
                                <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
                                {cartItemsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 text-red-500 text-xs font-bold">                                        {cartItemsCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={dropdownRef}>
                            {user ? (
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center space-x-1 p-1 rounded-full text-gray-400 hover:text-gray-500"
                                >
                                    <UserIcon className="h-5 w-5" aria-hidden="true" />
                                    <span className="text-sm text-gray-700 hidden md:inline-block">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleNavigation('/login')}
                                    className="px-4 py-2 rounded-none border-2 border-black bg-white text-black text-sm font-serif uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-300"
                                >
                                    Login
                                </button>
                            )}


                            {userDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                    <NavLink to="/profile" onClick={() => setUserDropdownOpen(false)}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Your Profile
                                    </NavLink>
                                    <NavLink to="/order-list" onClick={() => setUserDropdownOpen(false)}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Your Orders
                                    </NavLink>
                                    <button onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
                <div className="pt-2 pb-4 space-y-1 bg-white shadow-lg">
                    <NavLink to="/" onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                            `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive ? 'border-grey-500 bg-grey-50 text-grey-700'
                                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`
                        }>
                        Home
                    </NavLink>
                    <NavLink to="/products" onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                            `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive ? 'border-grey-500 bg-grey-50 text-grey-700'
                                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`
                        }>
                        Products
                    </NavLink>
                    <NavLink to="/about" onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                            `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive ? 'border-grey-500 bg-grey-50 text-grey-700'
                                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`
                        }>
                        About
                    </NavLink>

                    <div className="pt-4 pb-2 border-t border-gray-200">
                        <div className="flex items-center px-4 space-x-3">
                            <button onClick={() => handleNavigation('/wishlist', true)}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                                <HeartIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                            <div className="relative">
                                <button onClick={() => handleNavigation('/cart', true)}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                                    <ShoppingBagIcon className="h-6 w-6" aria-hidden="true" />
                                    {cartItemsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-grey-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartItemsCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                            {user ? (
                                <button onClick={handleLogout}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                                    <span className="text-sm">Sign Out</span>
                                </button>
                            ) : (
                                <button onClick={() => handleNavigation('/login')}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                                    <UserIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
