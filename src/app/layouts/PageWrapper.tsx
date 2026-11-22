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
  const hasMaxWidth = className.includes('max-w-')
  const hasPt = className.includes('pt-')
  const hasPb = className.includes('pb-')
  const hasPx = className.includes('px-')
  return (
    <div
      className={`${hasPx ? '' : 'px-4 sm:px-6'} ${hasPb ? '' : 'pb-6'} ${hasPt ? '' : 'pt-4'} ${
        hasMaxWidth ? '' : 'max-w-screen-2xl'
      } mx-auto ${className}`}
    >
      {children}
    </div>
  );
}
export default PageWrapper;
