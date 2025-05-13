import React from 'react';
import Navbar from '../components/Navbar';

const Home: React.FC = () => {
  return (
    <div>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold">Welcome to My Next.js App</h1>
        <p className="mt-4 text-lg">This is the homepage of your application.</p>
      </main>
    </div>
  );
};

export default Home;