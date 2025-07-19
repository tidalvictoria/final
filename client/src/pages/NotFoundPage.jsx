import React from 'react';

const NotFoundPage = () => {
    return (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '28px', color: '#333', backgroundColor: '#e0f7fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        </div>
    );
};

export default NotFoundPage;