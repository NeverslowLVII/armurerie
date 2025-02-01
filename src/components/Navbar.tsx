'use client';

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavbarProps {
  currentPage: 'weapons' | 'statistics';
  onPageChange: (page: 'weapons' | 'statistics') => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/80 backdrop-blur-md border-b"
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Armurerie
            </h1>
          </motion.div>
          <div className="flex gap-4 relative">
            <Button
              variant="ghost"
              onClick={() => onPageChange('weapons')}
              className={cn(
                "h-9 px-3 relative",
                currentPage === 'weapons' ? "text-primary" : "text-muted-foreground"
              )}
            >
              Armes
              {currentPage === 'weapons' && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/80"
                />
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onPageChange('statistics')}
              className={cn(
                "h-9 px-3 relative",
                currentPage === 'statistics' ? "text-primary" : "text-muted-foreground"
              )}
            >
              Statistiques
              {currentPage === 'statistics' && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/80"
                />
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}