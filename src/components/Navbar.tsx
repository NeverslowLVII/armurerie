import { Button } from '@/components/ui/button';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type Variants,
  AnimatePresence
} from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import Tilt from 'react-parallax-tilt';

interface NavbarProps {
  readonly currentPage: 'weapons' | 'statistics';
  readonly onPageChange: (page: 'weapons' | 'statistics') => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderFullyVisible, setIsHeaderFullyVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollVelocity = useRef(0);
  const ticking = useRef(false);

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 50], [1, 0.98]);

  const rawBlur = useTransform(scrollY, [0, 50], [12, 16]);
  const smoothBlur = useSpring(rawBlur, { stiffness: 300, damping: 15 });
  const smoothBackdrop = useTransform(smoothBlur, (value) => `blur(${value}px)`);

  const rawScale = useTransform(scrollY, [0, 50], [1, 0.98]);
  const smoothScale = useSpring(rawScale, { stiffness: 300, damping: 15 });

  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const currentTime = Date.now();
          const timeDiff = currentTime - lastScrollTime.current;
          
          // Calculer la vélocité du scroll (pixels/ms)
          scrollVelocity.current = Math.abs(currentScrollY - lastScrollY.current) / timeDiff;
          
          // Seuil de vélocité pour une réaction plus rapide
          const isQuickScroll = scrollVelocity.current > 0.5;
          
          if (currentScrollY < 50) {
            setIsVisible(true);
            setIsScrolled(false);
          } else {
            setIsScrolled(true);
            if (currentScrollY < lastScrollY.current) {
              // Scroll vers le haut - réaction immédiate
              setIsVisible(true);
            } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
              // Scroll vers le bas - cacher seulement si le scroll est rapide
              if (isQuickScroll) {
                setIsVisible(false);
              }
            }
          }

          lastScrollY.current = currentScrollY;
          lastScrollTime.current = currentTime;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants: Variants = {
    hidden: { 
      y: -100, 
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const linkVariants: Variants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
    tap: { scale: 0.95 }
  };

  const mobileMenuVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        staggerChildren: 0.1 
      } 
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  return (
    <motion.header
      variants={navVariants}
      initial="visible"
      animate={isVisible ? "visible" : "hidden"}
      onAnimationComplete={() => setIsHeaderFullyVisible(isVisible)}
      style={{ opacity, scale: smoothScale, willChange: "transform, opacity" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${isScrolled ? 'py-2' : 'py-4'}`}
    >
      <motion.nav
        style={{ backdropFilter: smoothBackdrop, willChange: "backdrop-filter" }}
        className="relative mx-auto max-w-7xl px-6 bg-white/80 dark:bg-neutral-900/80 rounded-2xl border border-white/20 dark:border-neutral-800/50 shadow-lg shadow-black/5 dark:shadow-white/5"
      >
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Tilt 
              tiltMaxAngleX={10} 
              tiltMaxAngleY={10}
              scale={1.05}
              transitionSpeed={2500}
              className="relative"
            >
              <motion.div
                className="flex-shrink-0 relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h1 className="text-3xl font-black bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
                  Armurerie
                </h1>
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              </motion.div>
            </Tilt>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex ml-12 items-center space-x-8">
              {[
                { id: 'weapons', label: 'Armes', icon: RocketLaunchIcon },
                { id: 'statistics', label: 'Statistiques', icon: ChartBarIcon }
              ].map(({ id, label, icon: Icon }) => (
                <motion.div
                  key={id}
                  variants={linkVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden rounded-lg"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 0.1 }}
                      className={`absolute inset-0 ${
                        resolvedTheme === 'dark' 
                          ? 'bg-red-500' 
                          : 'bg-red-200'
                      }`}
                    />
                    <Button
                      onClick={() => {
                        onPageChange(id as 'weapons' | 'statistics');
                        if (mobileMenuOpen) setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-2
                        ${currentPage === id
                          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                          : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </motion.div>
                  <AnimatePresence>
                    {currentPage === id && isHeaderFullyVisible && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {resolvedTheme === 'dark' ? (
                <SunIcon className="h-5 w-5 text-amber-500" />
              ) : (
                <MoonIcon className="h-5 w-5 text-blue-500" />
              )}
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6 text-neutral-900 dark:text-white" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-neutral-900 dark:text-white" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden py-4 space-y-2"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileMenuVariants}
          >
            {[
              { id: 'weapons', label: 'Armes', icon: RocketLaunchIcon },
              { id: 'statistics', label: 'Statistiques', icon: ChartBarIcon }
            ].map(({ id, label, icon: Icon }) => (
              <motion.div
                key={id}
                variants={linkVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full"
              >
                <Button
                  onClick={() => {
                    onPageChange(id as 'weapons' | 'statistics');
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className={`w-full justify-start gap-2 ${
                    currentPage === id
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </motion.div>
            ))}
            <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
              <Button
                onClick={toggleTheme}
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                {resolvedTheme === 'dark' ? (
                  <>
                    <SunIcon className="h-4 w-4 text-amber-500" />
                    Mode clair
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-4 w-4 text-blue-500" />
                    Mode sombre
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Déconnexion
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.nav>
    </motion.header>
  );
}