import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children, onTaskAdded, onNoteAdded, onSearch }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Header onTaskAdded={onTaskAdded} onNoteAdded={onNoteAdded} onSearch={onSearch} />
        <main className="flex-1 overflow-y-auto p-8 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;