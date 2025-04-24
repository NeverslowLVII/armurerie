'use client';

import { Button } from '@/components/ui/button';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type Variants,
  AnimatePresence,
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
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import Tilt from 'react-parallax-tilt';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Role } from '@prisma/client';

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
  {
    id: 'account',
    label: 'Mon Compte',
    icon: UserIcon,
    href: '/employee/account',
    hideFromNav: true,
  },
];

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [_isScrolled, _setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderFullyVisible, setIsHeaderFullyVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();

  const lastScrollY = useRef(0);

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 50], [1, 0.98]);

  const rawBlur = useTransform(scrollY, [0, 50], [12, 16]);
  const smoothBlur = useSpring(rawBlur, { stiffness: 300, damping: 15 });
  const smoothBackdrop = useTransform(smoothBlur, value => `blur(${value}px)`);

  const rawScale = useTransform(scrollY, [0, 50], [1, 0.98]);
  const smoothScale = useSpring(rawScale, { stiffness: 300, damping: 15 });

  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();

  // Filter navigation items based on user role
  const availableNavItems = NAVIGATION_ITEMS.filter(item => {
    if (item.id === 'statistics') {
      // Allow PATRON and DEVELOPER to see Statistics
      return session?.user?.role === Role.PATRON || session?.user?.role === Role.DEVELOPER;
    }
    return !item.hideFromNav; // Keep other items not explicitly hidden
  });

  const currentPage = availableNavItems.find(item => pathname === item.href)?.id || 'weapons';

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
        ease: [0.4, 0, 0.2, 1],
      },
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  const linkVariants: Variants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
    tap: { scale: 0.95 },
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
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.header
      variants={navVariants}
      initial="visible"
      animate={isVisible ? 'visible' : 'hidden'}
      onAnimationComplete={() => setIsHeaderFullyVisible(isVisible)}
      style={{ opacity, scale: smoothScale, willChange: 'transform, opacity' }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-150 ${_isScrolled ? 'py-2' : 'py-4'}`}
    >
      <motion.nav
        style={{ backdropFilter: smoothBackdrop, willChange: 'backdrop-filter' }}
        className="relative mx-auto max-w-7xl rounded-2xl border border-white/20 bg-white/80 px-6 shadow-lg shadow-black/5 dark:border-neutral-800/50 dark:bg-neutral-900/80 dark:shadow-white/5"
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
                  className="relative flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <h1 className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-3xl font-black text-transparent drop-shadow-sm">
                    Armurerie
                  </h1>
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 opacity-20 blur transition duration-1000 group-hover:opacity-30"></div>
                </motion.div>
              </Tilt>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="ml-12 hidden items-center space-x-8 md:flex">
              {availableNavItems.map(({ id, label, icon: Icon, href }) => (
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
                        className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                          currentPage === id
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50 dark:hover:text-white'
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
          <div className="hidden items-center space-x-4 md:flex">
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <UserCircleIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {session.user.username || session.user.name}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <Link href="/employee/account" passHref>
                    <DropdownMenuItem
                      className={`cursor-pointer ${currentPage === 'account' ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' : ''}`}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Mon compte</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem
                    onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
                    className="cursor-pointer text-red-500 dark:text-red-400"
                  >
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
              className="rounded-lg p-2 transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {hasMounted && (
                resolvedTheme === 'dark' ? (
                  <SunIcon className="h-5 w-5 text-amber-500" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-blue-500" />
                )
              )}
              {!hasMounted && <div className="h-5 w-5" />}
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
              className="space-y-4 py-4 md:hidden"
            >
              {/* Navigation links */}
              {availableNavItems.map(({ id, label, icon: Icon, href }) => (
                <Link key={id} href={href}>
                  <motion.div variants={linkVariants}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-2 ${
                        currentPage === id
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
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
                  <div className="border-t border-neutral-200 pt-2 dark:border-neutral-800">
                    <Link href="/employee/account" passHref>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-2 ${
                          currentPage === 'account'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
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
              <div className="border-t border-neutral-200 pt-2 dark:border-neutral-800">
                <motion.div variants={linkVariants}>
                  <Button
                    onClick={() => {
                      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    {hasMounted && (
                      resolvedTheme === 'dark' ? (
                        <>
                          <SunIcon className="h-4 w-4 text-amber-500" />
                          Mode clair
                        </>
                      ) : (
                        <>
                          <MoonIcon className="h-4 w-4 text-blue-500" />
                          Mode sombre
                        </>
                      )
                    )}
                    {!hasMounted && <div className="h-4 w-4" />}
                  </Button>
                </motion.div>
                <motion.div variants={linkVariants}>
                  <Button
                    onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
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
