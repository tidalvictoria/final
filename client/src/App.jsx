import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AgencyDashboard from './pages/AgencyDashboard';
import StaffDashboard from './pages/StaffDashboard';
import IndividualDashboard from './pages/IndividualDashboard';
import MyDocsPage from './pages/MyDocsPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './contexts/AuthContext';
import ContactSupport from './pages/ContactSupport.jsx';

function App() {
    return (
        <AuthProvider>
        <Router>
            <div className="min-h-screen bg-gray-100 font-inter">
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/agency-dashboard" element={<AgencyDashboard />} />
                <Route path="/staff-dashboard" element={<StaffDashboard />} />
                <Route path="/individual-dashboard" element={<IndividualDashboard />} />
                <Route path="/my-docs" element={<MyDocsPage />} />
                <Route path="*" element={<NotFoundPage />} />
                <Route path="*" element={<ContactSupport />} />
            </Routes>
            </div>
        </Router>
        </AuthProvider>
    );
}

export default App;