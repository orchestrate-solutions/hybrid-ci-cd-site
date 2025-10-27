/**
 * Documentation content processing utilities for the frontend.
 */

import type { Context } from "codeuchain";

export interface DocMetadata {
  title?: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface TableOfContents {
  level: number;
  title: string;
  id: string;
}

export interface ProcessedDoc {
  loaded: boolean;
  error?: string;
  metadata: DocMetadata;
  body: string;
  toc: TableOfContents[];
}

/**
 * Parse markdown frontmatter and extract metadata + body
 */
export function parseFrontmatter(content: string): {
  metadata: DocMetadata;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // No frontmatter found, treat entire content as body
    return { metadata: {}, body: content };
  }

  const frontmatterStr = match[1];
  const body = match[2];

  // Parse simple YAML-like frontmatter (key: value pairs)
  const metadata: DocMetadata = {};
  frontmatterStr.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key) {
      metadata[key.trim()] = valueParts.join(":").trim();
    }
  });

  return { metadata, body };
}

/**
 * Generate table of contents from markdown headings
 */
export function generateTableOfContents(body: string): TableOfContents[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TableOfContents[] = [];

  let match;
  while ((match = headingRegex.exec(body)) !== null) {
    const level = match[1].length;
    const title = match[2];
    // Create URL-friendly ID
    const id = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    headings.push({ level, title, id });
  }

  return headings;
}
