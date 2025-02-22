import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeaponsTable from './components/WeaponsTable';
import Statistics from './components/Statistics';
import Navbar from './components/Navbar';
import { fetchUsers } from './redux/slices/userSlice';
import FeedbackManager from './components/FeedbackManager';
import { userStore } from './stores/userStore';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './redux/store';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'weapons' | 'statistics'>('weapons');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();
  const { status } = useSession();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch users when app starts and get current user ID
  useEffect(() => {
    if (status === 'authenticated') {
      dispatch(fetchUsers());
      const getCurrentUserId = async () => {
        const currentUserName = localStorage.getItem('currentUser');
        if (currentUserName) {
          const user = await userStore.getUser(currentUserName);
          if (user) {
            setCurrentUserId(user.id);
          }
        }
      };
      getCurrentUserId();
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 transition-colors duration-300">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="pt-32">
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
                className="bg-white dark:bg-neutral-800 shadow-lg dark:shadow-neutral-700 rounded-lg p-6"
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
                className="bg-white dark:bg-neutral-800 shadow-lg dark:shadow-neutral-700 rounded-lg p-6"
              >
                <Statistics />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Feedback Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setIsFeedbackOpen(true)}
          className="rounded-full bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6 dark:text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        </Button>
      </div>

      <FeedbackManager 
        open={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        userId={currentUserId ?? 0}
      />
    </div>
  );
}

export default App;