'use client';

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
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  UserCircleIcon,
  UserIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import Tilt from 'react-parallax-tilt';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationItem {
  id: 'weapons' | 'statistics' | 'account' | 'comparison';
  label: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  href: string;
  hideFromNav?: boolean;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'weapons', label: 'Armes', icon: RocketLaunchIcon, href: '/dashboard/weapons' },
  { id: 'comparison', label: 'Comparateur', icon: RocketLaunchIcon, href: '/weapons/comparison' },
  { id: 'statistics', label: 'Statistiques', icon: ChartBarIcon, href: '/dashboard/statistics' },
  { id: 'account', label: 'Mon Compte', icon: UserIcon, href: '/employee/account', hideFromNav: true }
];

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [_isScrolled, _setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderFullyVisible, setIsHeaderFullyVisible] = useState(true);
  const pathname = usePathname();

  const lastScrollY = useRef(0);

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 50], [1, 0.98]);

  const rawBlur = useTransform(scrollY, [0, 50], [12, 16]);
  const smoothBlur = useSpring(rawBlur, { stiffness: 300, damping: 15 });
  const smoothBackdrop = useTransform(smoothBlur, (value) => `blur(${value}px)`);

  const rawScale = useTransform(scrollY, [0, 50], [1, 0.98]);
  const smoothScale = useSpring(rawScale, { stiffness: 300, damping: 15 });

  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();

  const currentPage = NAVIGATION_ITEMS.find(item => pathname === item.href)?.id || 'weapons';

  useEffect(() => {
    const handleScroll = () => {
      globalThis.requestAnimationFrame(() => {
        const currentScrollY = globalThis.scrollY;
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      });
    };

    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    return () => globalThis.removeEventListener('scroll', handleScroll);
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

  return (
    <motion.header
      variants={navVariants}
      initial="visible"
      animate={isVisible ? "visible" : "hidden"}
      onAnimationComplete={() => setIsHeaderFullyVisible(isVisible)}
      style={{ opacity, scale: smoothScale, willChange: "transform, opacity" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${_isScrolled ? 'py-2' : 'py-4'}`}
    >
      <motion.nav
        style={{ backdropFilter: smoothBackdrop, willChange: "backdrop-filter" }}
        className="relative mx-auto max-w-7xl px-6 bg-white/80 dark:bg-neutral-900/80 rounded-2xl border border-white/20 dark:border-neutral-800/50 shadow-lg shadow-black/5 dark:shadow-white/5"
      >
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard/weapons">
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
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex ml-12 items-center space-x-8">
              {NAVIGATION_ITEMS.filter(item => !item.hideFromNav).map(({ id, label, icon: Icon, href }) => (
                <Link key={id} href={href}>
                  <motion.div
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
                        className="absolute inset-0 bg-red-200"
                      />
                      <Button
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
                </Link>
              ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <UserCircleIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {session.user.username || session.user.name}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <Link href="/employee/account" passHref>
                    <DropdownMenuItem className={`cursor-pointer ${currentPage === 'account' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : ''}`}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Mon compte</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })} className="text-red-500 dark:text-red-400">
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {resolvedTheme === 'dark' ? (
                <SunIcon className="h-5 w-5 text-amber-500" />
              ) : (
                <MoonIcon className="h-5 w-5 text-blue-500" />
              )}
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="md:hidden py-4 space-y-4"
            >
              {/* Navigation links */}
              {NAVIGATION_ITEMS.filter(item => !item.hideFromNav).map(({ id, label, icon: Icon, href }) => (
                <Link key={id} href={href}>
                  <motion.div variants={linkVariants}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-2 ${
                        currentPage === id
                          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                          : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </motion.div>
                </Link>
              ))}

              {/* User section */}
              {session?.user && (
                <>
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <Link href="/employee/account" passHref>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-2 ${
                          currentPage === 'account'
                            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        Mon compte
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {/* Theme toggle and sign out */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <motion.div variants={linkVariants}>
                  <Button
                    onClick={() => {
                      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                      setMobileMenuOpen(false);
                    }}
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
                <motion.div variants={linkVariants}>
                  <Button
                    onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </motion.header>
  );
}