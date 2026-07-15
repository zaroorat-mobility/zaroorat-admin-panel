import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageWrapper
 * Consistent padding and max-width layout for page content areas.
 */
export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`px-6 pb-6 pt-4 max-w-screen-2xl mx-auto ${className}`}>
      {children}
    </div>
  );
}
export default PageWrapper;
