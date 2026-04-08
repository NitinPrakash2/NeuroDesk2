import React from 'react';

const Header = () => {
  return (
    <header className="flex justify-between items-center py-4 px-8 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
      {/* Search Bar */}
      <div className="relative w-96">
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
        />
        <span className="absolute left-4 top-2.5 text-gray-400 text-sm">🔍</span>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 shadow-sm">
          + Add Task
        </button>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 shadow-sm">
          + Add Note
        </button>
        <div className="flex space-x-2">
          <button className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">🔔</button>
        </div>
      </div>
    </header>
  );
};

export default Header;