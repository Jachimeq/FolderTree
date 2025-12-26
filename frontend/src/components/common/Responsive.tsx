import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function ResponsiveGrid({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function ResponsiveStack({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`flex flex-col gap-4 md:flex-row md:gap-6 ${className}`}>
      {children}
    </div>
  );
}
