import React from 'react';

const StatCard = ({ title, icon, children }) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default StatCard;