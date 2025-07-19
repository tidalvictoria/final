import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context with a default undefined value
const AuthContext = createContext(undefined);

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    // Basic login function
    const login = (token, userData) => {
        localStorage.setItem('token', token); // Store token (for MVP, but consider more secure methods)
        setUser(userData);
        setIsAuthenticated(true);
    };

    // Basic logout function
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    // Check for token on initial load (simple example)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
        // In a real app, you'd validate the token with your backend here
        // For now, just assume it's valid if present
        setIsAuthenticated(true);
        // You might fetch user data here if not stored in token
        setUser({ email: 'example@user.com', role: 'unknown' }); // Placeholder user data
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
    };

    // Custom hook to use the AuthContext
    export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};