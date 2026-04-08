import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]"> {/* Soft background color from mockup */}
      <Sidebar />
      <div className="flex-1 ml-64"> {/* Margin left equals sidebar width */}
        <Header />
        <main className="p-8 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;