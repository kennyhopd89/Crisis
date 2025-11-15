
import React from 'react';
import { View } from '../types';
import { PlusIcon } from './icons';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onAddLink: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, onAddLink }) => {
  const navButtonClasses = (view: View) => 
    `px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      currentView === view 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <header className="bg-slate-800/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg border-b border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-white tracking-tight">🎬 Crisis Dashboard</h1>
            <nav className="hidden md:flex space-x-4">
              <button onClick={() => setView(View.Links)} className={navButtonClasses(View.Links)}>
                Link Monitoring
              </button>
              <button onClick={() => setView(View.Sources)} className={navButtonClasses(View.Sources)}>
                Source Intelligence
              </button>
            </nav>
          </div>
          <div className="flex items-center">
            <button
              onClick={onAddLink}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Thêm Link</span>
            </button>
          </div>
        </div>
        <div className="md:hidden flex space-x-2 pb-3 px-2">
            <button onClick={() => setView(View.Links)} className={`${navButtonClasses(View.Links)} w-full`}>
                Link Monitoring
            </button>
            <button onClick={() => setView(View.Sources)} className={`${navButtonClasses(View.Sources)} w-full`}>
                Source Intelligence
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
