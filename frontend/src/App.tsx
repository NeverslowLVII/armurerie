import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Provider } from 'react-redux';
import WeaponsTable from './components/WeaponsTable';
import Statistics from './components/Statistics';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar';
import { store } from './redux/store';
import { fetchEmployees } from './redux/slices/employeeSlice';

function App() {
  const [currentPage, setCurrentPage] = useState<'weapons' | 'statistics'>('weapons');

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Fetch employees when app starts
  useEffect(() => {
    store.dispatch(fetchEmployees());
  }, []);

  return (
    <Provider store={store}>
      <DataProvider>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
          <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />

          <main>
            <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
              <AnimatePresence mode="wait">
                {currentPage === 'weapons' ? (
                  <motion.div
                    key="weapons"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <WeaponsTable />
                  </motion.div>
                ) : (
                  <motion.div
                    key="statistics"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Statistics />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </DataProvider>
    </Provider>
  );
}

export default App;