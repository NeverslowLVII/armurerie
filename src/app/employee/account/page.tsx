'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeeklySales } from '@/components/WeeklySales';
import { toast } from '@/components/ui/use-toast';
import { motion, useMotionValue, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import {
  DocumentIcon,
  DocumentCheckIcon,
  UserCircleIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Role } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoading } from '@/components/ui/loading';

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: Role;
  contractUrl: string | null;
}

export default function EmployeeAccount() {
  const { data: session } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Refs for scroll animations
  const infoCardRef = useRef(null);
  const salesCardRef = useRef(null);
  const contractCardRef = useRef(null);
  
  // InView hooks for scroll animations
  const isInfoCardInView = useInView(infoCardRef, { once: true, amount: 0.3 });
  const isSalesCardInView = useInView(salesCardRef, { once: true, amount: 0.3 });
  const isContractCardInView = useInView(contractCardRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsRefreshing(true);
        const response = await fetch('/api/employee/info');
        const data = await response.json();
        setUserInfo(data);
        setLastUpdated(new Date());
      } catch {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations de l\'employé',
          variant: 'destructive',
        });
      } finally {
        setIsRefreshing(false);
      }
    };

    if (session) {
      fetchUserInfo();
    }
  }, [session]);

  const refreshData = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/employee/info');
      const data = await response.json();
      setUserInfo(data);
      setLastUpdated(new Date());
      
      toast({
        title: 'Mise à jour',
        description: 'Données actualisées avec succès',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'actualiser les données',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Card tilt effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const springConfig = { damping: 25, stiffness: 250 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  if (!userInfo) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <SkeletonLoading isLoading={true} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          
          <Skeleton className="h-48 rounded-xl mt-6" />
        </SkeletonLoading>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Mon Compte
            </h1>
            {lastUpdated && (
              <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>Dernière mise à jour: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </motion.div>
          
          <div className="flex items-center gap-3">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={refreshData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-300"
              disabled={isRefreshing}
              aria-label="Actualiser les données"
            >
              <ArrowPathIcon className={`h-4 w-4 text-neutral-500 dark:text-neutral-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </motion.button>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50 shadow-sm"
            >
              <UserCircleIcon className="h-5 w-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300 font-medium">{userInfo.role}</span>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            ref={infoCardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isInfoCardInView ? 1 : 0.5,
              y: isInfoCardInView ? 0 : 20
            }}
            transition={{ duration: 0.5 }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              x.set(e.clientX - rect.left - rect.width / 2);
              y.set(e.clientY - rect.top - rect.height / 2);
            }}
            onMouseLeave={() => {
              x.set(0);
              y.set(0);
            }}
          >
            <motion.div
              style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformPerspective: 1200,
              }}
              className="h-full"
            >
              <Card className="bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/20 via-orange-500/20 to-amber-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-white">
                    <UserCircleIcon className="h-5 w-5 text-red-500" />
                    Informations Personnelles
                  </CardTitle>
                  <CardDescription className="text-neutral-500 dark:text-neutral-400">Vos informations de compte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-3 border-b dark:border-neutral-800 group">
                      <span className="text-neutral-500 dark:text-neutral-400">Nom</span>
                      <span className="font-medium text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{userInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b dark:border-neutral-800 group">
                      <span className="text-neutral-500 dark:text-neutral-400">Email</span>
                      <span className="font-medium text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{userInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b dark:border-neutral-800 group">
                      <span className="text-neutral-500 dark:text-neutral-400">Rôle</span>
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{userInfo.role}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            ref={salesCardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isSalesCardInView ? 1 : 0.5,
              y: isSalesCardInView ? 0 : 20
            }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              x.set(e.clientX - rect.left - rect.width / 2);
              y.set(e.clientY - rect.top - rect.height / 2);
            }}
            onMouseLeave={() => {
              x.set(0);
              y.set(0);
            }}
          >
            <motion.div
              style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformPerspective: 1200,
              }}
              className="h-full"
            >
              <Card className="bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-white">
                      <BanknotesIcon className="h-5 w-5 text-green-500" />
                      Ventes et Commission
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Cette semaine</span>
                    </div>
                  </div>
                  <CardDescription className="text-neutral-500 dark:text-neutral-400">Vos performances de la semaine</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <WeeklySales />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          ref={contractCardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isContractCardInView ? 1 : 0.5,
            y: isContractCardInView ? 0 : 20
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group mt-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-white">
                <DocumentIcon className="h-5 w-5 text-blue-500" />
                Contrat de Travail
              </CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400">
                {userInfo.contractUrl
                  ? 'Votre contrat de travail signé'
                  : 'Statut de votre contrat de travail'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {userInfo.contractUrl ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <DocumentCheckIcon className="h-6 w-6 text-green-500" />
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">
                        Contrat signé
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Le contrat a été signé et est en vigueur
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => userInfo.contractUrl && window.open(userInfo.contractUrl, '_blank')}
                    className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/50 transition-all duration-300 w-full sm:w-auto"
                    aria-label="Voir le contrat"
                  >
                    <DocumentIcon className="h-4 w-4 mr-2" />
                    Voir le contrat
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center gap-4 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
                    <div className="relative">
                      <DocumentIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-500" />
                      <motion.div 
                        animate={{ 
                          opacity: [0.5, 1, 0.5],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 2
                        }}
                        className="absolute inset-0 rounded-full bg-neutral-200 dark:bg-neutral-700 -z-10 blur-md"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-neutral-600 dark:text-neutral-300">
                        Vous n&apos;avez pas encore de contrat.
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                        Contactez votre responsable pour plus d&apos;informations. Les contrats sont gérés par l&apos;administration.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 