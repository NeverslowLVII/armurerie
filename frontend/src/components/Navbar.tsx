import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface NavbarProps {
  currentPage: 'weapons' | 'statistics';
  onPageChange: (page: 'weapons' | 'statistics') => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-md border-b border-gray-200"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <motion.div 
              className="flex flex-shrink-0 items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Armurerie
              </h1>
            </motion.div>
            <div className="ml-6 flex space-x-8 relative">
              <Button
                onClick={() => onPageChange('weapons')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative ${
                  currentPage === 'weapons'
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Armes
                {currentPage === 'weapons' && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-orange-600"
                  />
                )}
                  </Button>
              <Button
                onClick={() => onPageChange('statistics')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative ${
                  currentPage === 'statistics'
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Statistiques
                {currentPage === 'statistics' && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-orange-600"
                  />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
} 