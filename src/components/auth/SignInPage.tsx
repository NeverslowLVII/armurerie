'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import armurerie from '@/assets/armurerie.webp';
import SignInForm from './SignInForm';

export default function SignInPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid bg-white dark:bg-neutral-900 lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={armurerie}
            alt="Armurerie background"
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 backdrop-blur-[2px]" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 flex items-center"
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Armurerie
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-20 mt-auto"
        >
          <blockquote className="space-y-2">
            <p className="text-lg font-medium italic text-neutral-100">
              &ldquo;La meilleure armurerie de Saint-Denis, en même temps c&apos;est la seule&rdquo;
            </p>
            <footer className="text-sm text-neutral-300">
              <span className="font-semibold">Theodore Roosevelt</span>
              <span className="before:content-['—'] before:mx-2 text-neutral-400">1899</span>
            </footer>
          </blockquote>
        </motion.div>
      </div>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:p-8"
      >
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white"
            >
              Connexion
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm text-neutral-500 dark:text-neutral-400"
            >
              Entrez vos identifiants pour accéder à votre espace
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <SignInForm />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 