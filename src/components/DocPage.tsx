'use client';

import React from 'react';

interface DocPageProps {
  docName?: string;
  children?: React.ReactNode;
  [key: string]: React.ReactNode | string | undefined;
}

/**
 * DocPage Component
 * Renders documentation pages with proper styling
 */
export default function DocPage({ docName, children, ...props }: DocPageProps) {
  return (
    <article className="prose max-w-3xl mx-auto px-4 py-8" {...props}>
      {children || <p>Documentation for {docName}</p>}
    </article>
  );
}
