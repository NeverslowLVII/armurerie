'use client';

import React, { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';

export interface FormField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export interface AuthFormProps {
  onSubmit: (event: React.FormEvent) => Promise<void>;
  fields: FormField[];
  submitButtonText: string;
  isLoading: boolean;
  error: string | null;
  backUrl?: string;
  backText?: string;
  additionalButton?: ReactNode;
  successMessage?: string;
}

export function AuthForm({
  onSubmit,
  fields,
  submitButtonText,
  isLoading,
  error,
  backUrl,
  backText = 'Retour',
  additionalButton,
  successMessage,
}: AuthFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid gap-6"
    >
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg bg-white p-4 dark:bg-neutral-900">
        <div className="grid gap-4">
          {fields.map(field => (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={field.onChange}
                disabled={isLoading}
                required={field.required ?? true}
                className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
              />
            </div>
          ))}

          {error && (
            <AlertDialog>
              <AlertDialogContent>
                <AlertDialogDescription>{error}</AlertDialogDescription>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {successMessage && (
            <AlertDialog>
              <AlertDialogContent>
                <AlertDialogDescription>{successMessage}</AlertDialogDescription>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            disabled={isLoading}
            className="w-full dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            {isLoading && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>

          {backUrl && (
            <Button
              type="button"
              variant="outline"
              asChild
              className="w-full dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
            >
              <Link href={backUrl}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                {backText}
              </Link>
            </Button>
          )}

          {additionalButton}
        </div>
      </form>
    </motion.div>
  );
}
