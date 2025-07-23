import React, { useState } from 'react';

const LaunchingSoon = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setEmail(''); // Clear email input on success
      } else {
        setMessage(data.message || 'Something went wrong. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      setMessage('Network error. Please check your connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-inter">
      <div className="bg-white p-10 rounded-lg shadow-xl max-w-lg w-full text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-4">Launching Soon!</h1>
        <p className="text-gray-700 text-lg mb-8">
          We're working hard to bring you the best Healthcare HR solution.
          Enter your email below to be notified when we launch!
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Notify Me!'}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LaunchingSoon;
