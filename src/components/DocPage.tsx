'use client';

import React, { useMemo } from 'react';

interface DocPageProps {
  docName?: string;
  content?: string;
  children?: React.ReactNode;
  [key: string]: React.ReactNode | string | undefined;
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold mt-6 mb-4">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mt-10 mb-6">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/gm, '<strong class="font-bold">$1</strong>');
  html = html.replace(/\*(.*?)\*/gm, '<em class="italic">$1</em>');
  html = html.replace(/__(.*?)__/gm, '<strong class="font-bold">$1</strong>');
  html = html.replace(/_(.*?)_/gm, '<em class="italic">$1</em>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2" class="text-blue-500 hover:text-blue-700 underline">$1</a>');

  // Code blocks (triple backticks)
  html = html.replace(/```(.*?)\n([\s\S]*?)```/gm, (match, lang, code) => {
    return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4"><code class="text-sm">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`(.*?)`/gm, '<code class="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>');

  // Paragraphs
  html = html.split('\n\n').map(paragraph => {
    if (paragraph.match(/^<[hpbiu]/)) return paragraph;
    if (paragraph.trim() === '') return '';
    return `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
  }).join('\n');

  // Line breaks
  html = html.replace(/\n/g, '<br class="mb-2" />');

  return html;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * DocPage Component
 * Renders documentation pages with markdown content
 */
export default function DocPage({ docName, content, children, ...props }: DocPageProps) {
  const html = useMemo(() => {
    if (content) {
      return markdownToHtml(content);
    }
    return '';
  }, [content]);

  if (children) {
    return (
      <article className="prose dark:prose-invert max-w-3xl mx-auto px-4 py-8" {...props}>
        {children}
      </article>
    );
  }

  if (html) {
    return (
      <article 
        className="max-w-3xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100"
        dangerouslySetInnerHTML={{ __html: html }}
        {...props}
      />
    );
  }

  return (
    <article className="prose dark:prose-invert max-w-3xl mx-auto px-4 py-8" {...props}>
      <p>Documentation for {docName}</p>
    </article>
  );
}
