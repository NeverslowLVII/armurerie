import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string | undefined;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("animate-spin rounded-full border-b-2 border-red-500", sizeClasses[size])} />
      {text && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{text}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  children: React.ReactNode;
  loading: boolean;
  text?: string | undefined;
}

export function LoadingOverlay({ children, loading, text }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
} 