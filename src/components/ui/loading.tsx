'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { Skeleton } from './skeleton';

/**
 * @deprecated Use SkeletonLoading instead for a better user experience
 */
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string | undefined;
  variant?: 'primary' | 'secondary' | 'neutral';
  fullPage?: boolean;
}

/**
 * @deprecated Use SkeletonLoading instead for a better user experience
 */
export function LoadingSpinner({
  size = 'md',
  className,
  text,
  variant = 'primary',
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const variantClasses = {
    primary: 'border-red-500',
    secondary: 'border-blue-500',
    neutral: 'border-neutral-900 dark:border-neutral-300',
  };

  const containerClasses = fullPage
    ? 'flex flex-col items-center justify-center min-h-[200px]'
    : 'flex flex-col items-center justify-center';

  return (
    <div className={cn(containerClasses, className)}>
      <div
        data-testid="loading-spinner"
        className={cn(
          'animate-spin rounded-full border-b-2',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * @deprecated Use SkeletonLoading instead for a better user experience
 */
interface LoadingOverlayProps {
  children: React.ReactNode;
  loading: boolean;
  text?: string | undefined;
  variant?: 'primary' | 'secondary' | 'neutral';
  blur?: boolean;
}

/**
 * @deprecated Use SkeletonLoading instead for a better user experience
 */
export function LoadingOverlay({
  children,
  loading,
  text,
  variant = 'primary',
  blur = true,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-background/80 dark:bg-neutral-900/80',
            blur && 'backdrop-blur-sm'
          )}
        >
          <LoadingSpinner text={text} variant={variant} />
        </div>
      )}
    </div>
  );
}

/**
 * @deprecated Consider using a button with skeleton loading inside for a better user experience
 */
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  spinnerSize?: 'xs' | 'sm';
  spinnerPosition?: 'left' | 'right';
}

/**
 * @deprecated Consider using a button with skeleton loading inside for a better user experience
 */
export function LoadingButton({
  loading,
  children,
  spinnerSize = 'sm',
  spinnerPosition = 'left',
}: LoadingButtonProps) {
  return (
    <>
      {loading && spinnerPosition === 'left' && (
        <LoadingSpinner size={spinnerSize} className="mr-2" />
      )}
      {children}
      {loading && spinnerPosition === 'right' && (
        <LoadingSpinner size={spinnerSize} className="ml-2" />
      )}
    </>
  );
}

/**
 * @deprecated Use a page with SkeletonLoading instead for a better user experience
 */
export function FullPageLoading({
  text,
  variant = 'primary',
}: {
  text?: string;
  variant?: 'primary' | 'secondary' | 'neutral';
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text={text} variant={variant} />
    </div>
  );
}

interface SkeletonLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  text?: string;
}

/**
 * The preferred loading component for the application.
 * Provides a skeleton loading experience that matches the layout of the content.
 */
export function SkeletonLoading({
  children,
  isLoading = true,
  className,
  text,
}: SkeletonLoadingProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('animate-pulse', className)}>
      {text && (
        <div className="mb-4 flex justify-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {text}
          </p>
        </div>
      )}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // If it's already a Skeleton component, return it as is
          if (child.type === Skeleton) {
            return child;
          }

          // Otherwise, replace it with a Skeleton of the same size
          const { className: childClassName, style } = child.props as any;
          return <Skeleton className={childClassName} style={style} />;
        }
        return null;
      })}
    </div>
  );
}

/**
 * A skeleton button for use in loading states
 */
export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-24 rounded-md', className)} />;
}

/**
 * A full page skeleton loading component
 */
export function FullPageSkeletonLoading({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <SkeletonLoading isLoading={true}>{children}</SkeletonLoading>
      </div>
    </div>
  );
}
