
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center">
          <div className="text-primary-800">
             <p className="text-sm font-semibold tracking-wider">KMUTNB</p>
             <h1 className="text-4xl font-bold tracking-tighter -mt-1">
                BMS
             </h1>
          </div>
          <div className="ml-4 border-l-2 border-primary-200 pl-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
              AI Thesis Proposal Analyzer
            </h2>
            <p className="text-base text-gray-500">
                Co-op Project Assistant for Industrial Management
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};