import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface NavbarProps {
  currentPage: 'weapons' | 'statistics';
  onPageChange: (page: 'weapons' | 'statistics') => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 50], [0.8, 1]);
  const blur = useTransform(scrollY, [0, 50], [8, 12]);
  const scale = useTransform(scrollY, [0, 50], [1, 0.98]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants = {
    hidden: { y: -100 },
    visible: { 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1
      }
    }
  };

  const linkVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  };

  const indicatorVariants = {
    initial: { scaleX: 0 },
    animate: { 
      scaleX: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.header
      variants={navVariants}
      initial="hidden"
      animate="visible"
      style={{
        opacity,
        scale
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-4' : 'py-6'
      }`}
    >
      <motion.nav
        style={{
          backdropFilter: `blur(${blur}px)`
        }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white/60 rounded-2xl border border-white/20 shadow-lg"
      >
        <div className="flex h-16 items-center justify-between">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Armurerie
              </h1>
            </motion.div>

            <div className="ml-10 flex items-center space-x-8">
              {(['weapons', 'statistics'] as const).map((page) => (
                <motion.div
                  key={page}
                  variants={linkVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="relative"
                >
                  <Button
                    onClick={() => onPageChange(page)}
                    className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'text-red-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {page === 'weapons' ? 'Armes' : 'Statistiques'}
                  </Button>
                  {currentPage === page && (
                    <motion.div
                      layoutId="navbar-indicator"
                      variants={indicatorVariants}
                      initial="initial"
                      animate="animate"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.nav>
    </motion.header>
  );
} 