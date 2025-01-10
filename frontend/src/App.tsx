import React, { useState } from 'react';
import WeaponsTable from './components/WeaponsTable';
import Statistics from './components/Statistics';
import { DataProvider } from './context/DataContext';

function App() {
  const [currentPage, setCurrentPage] = useState<'weapons' | 'statistics'>('weapons');

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <h1 className="text-xl font-bold text-gray-900">Armurie</h1>
                </div>
                <div className="ml-6 flex space-x-8">
                  <button
                    onClick={() => setCurrentPage('weapons')}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      currentPage === 'weapons'
                        ? 'border-b-2 border-indigo-500 text-gray-900'
                        : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Armes
                  </button>
                  <button
                    onClick={() => setCurrentPage('statistics')}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      currentPage === 'statistics'
                        ? 'border-b-2 border-indigo-500 text-gray-900'
                        : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Statistiques
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {currentPage === 'weapons' ? <WeaponsTable /> : <Statistics />}
          </div>
        </main>
      </div>
    </DataProvider>
  );
}

export default App;