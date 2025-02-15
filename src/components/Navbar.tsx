import { Button } from '@/components/ui/button';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type Variants
} from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Tilt from 'react-parallax-tilt';
import Ripples from 'react-ripples';

interface NavbarProps {
  readonly currentPage: 'weapons' | 'statistics';
  readonly onPageChange: (page: 'weapons' | 'statistics') => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderFullyVisible, setIsHeaderFullyVisible] = useState(true);

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 50], [1, 1]);

  const rawBlur = useTransform(scrollY, [0, 50], [8, 12]);
  const smoothBlur = useSpring(rawBlur, { stiffness: 150, damping: 20 });
  const smoothBackdrop = useTransform(smoothBlur, (value) => `blur(${value}px)`);

  const rawScale = useTransform(scrollY, [0, 50], [1, 0.98]);
  const smoothScale = useSpring(rawScale, { stiffness: 150, damping: 20 });

  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants: Variants = {
    hidden: { y: -100 },
    visible: {
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20, mass: 1 }
    }
  };

  const linkVariants: Variants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, transition: { type: 'spring', stiffness: 400, damping: 10 } },
    tap: { scale: 0.95 }
  };

  const blobVariants: Variants = {
    animate: {
      d: [
        "M0 100 C 50 150, 150 50, 300 100 C 450 150, 550 50, 600 100 L600 0 L0 0 Z",
        "M0 100 C 50 50, 150 150, 300 100 C 450 50, 550 150, 600 100 L600 0 L0 0 Z"
      ],
      transition: {
        duration: 10,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror" as const
      }
    }
  };

  const mobileMenuVariants: Variants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  return (
    <motion.header
      variants={navVariants}
      initial="visible"
      animate={isVisible ? "visible" : "hidden"}
      onAnimationComplete={() => setIsHeaderFullyVisible(isVisible)}
      style={{ opacity, scale: smoothScale, willChange: "transform, opacity" }}
      className={`fixed top-0 left-0 right-0 transition-all duration-300 ${isScrolled ? 'py-4 px-4' : 'py-6'}`}
    >
      <div className="relative">
        {/* Animated morphing blob background */}
        <motion.svg
          viewBox="0 0 600 100"
          className="absolute top-0 left-0 w-full h-full"
          style={{ pointerEvents: "none", willChange: "transform" }}
        >
          <motion.path
            variants={blobVariants}
            animate="animate"
            fill="url(#gradient)"
          />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff5858" />
              <stop offset="100%" stopColor="#f09819" />
            </linearGradient>
          </defs>
        </motion.svg>

        <motion.nav
          style={{ backdropFilter: smoothBackdrop, willChange: "backdrop-filter" }}
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-800 rounded-2xl border border-white/20 dark:border-neutral-700 shadow-lg"
        >
          <div className="flex h-16 items-center justify-between">
            {/* Brand section with 3D tilt effect */}
            <div className="flex items-center">
              <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
                <motion.div
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    Armurerie
                  </h1>
                </motion.div>
              </Tilt>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex ml-10 items-center space-x-8">
                {(['weapons', 'statistics'] as const).map((page) => (
                  <motion.div
                    key={page}
                    variants={linkVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                    className="relative"
                  >
                    <Ripples
                      during={1200}
                      color="rgba(255, 0, 0, 0.2)"
                      placeholder={null}
                      onPointerEnterCapture={() => { }}
                      onPointerLeaveCapture={() => { }}
                    >
                      <Button
                        onClick={() => {
                          onPageChange(page);
                          if (mobileMenuOpen) setMobileMenuOpen(false);
                        }}
                        className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {page === 'weapons' ? 'Armes' : 'Statistiques'}
                      </Button>
                    </Ripples>
                    {currentPage === page && isHeaderFullyVisible && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500"
                      />
                    )}
                  </motion.div>
                ))}

                {/* Theme Toggle Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className="p-2 rounded-md focus:outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {resolvedTheme === 'dark' ? (
                    <SunIcon className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <MoonIcon className="h-6 w-6 text-blue-500" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="md:hidden flex items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md focus:outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6 text-neutral-900 dark:text-white" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-neutral-900 dark:text-white" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu Items */}
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden mt-4 flex flex-col space-y-4"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={mobileMenuVariants}
            >
              {(['weapons', 'statistics'] as const).map((page) => (
                <motion.div key={page} variants={linkVariants} whileHover="hover" whileTap="tap">
                  <Button
                    onClick={() => {
                      onPageChange(page);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {page === 'weapons' ? 'Armes' : 'Statistiques'}
                  </Button>
                </motion.div>
              ))}
              <motion.div whileHover="hover" whileTap="tap">
                <Button
                  onClick={toggleTheme}
                  className="w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.nav>
      </div>
    </motion.header>
  );
}