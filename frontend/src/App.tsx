import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Provider } from 'react-redux';
import WeaponsTable from './components/WeaponsTable';
import Statistics from './components/Statistics';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar';
import { store } from './redux/store';
import { fetchEmployees } from './redux/slices/employeeSlice';
import FeedbackManager from './components/FeedbackManager';

function App() {
  const [currentPage, setCurrentPage] = useState<'weapons' | 'statistics'>('weapons');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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

          {/* Feedback Button */}
          <div className="fixed bottom-4 right-4">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="rounded-full bg-indigo-600 p-4 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
            </button>
          </div>

          <FeedbackManager open={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </div>
      </DataProvider>
    </Provider>
  );
}

export default App;