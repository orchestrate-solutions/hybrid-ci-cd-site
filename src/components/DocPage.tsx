"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  parseFrontmatter,
  generateTableOfContents,
  type DocMetadata,
  type TableOfContents,
} from "@/lib/doc-processing";

interface DocPageProps {
  docName: string;
}

export default function DocPage({ docName }: DocPageProps) {
  const [metadata, setMetadata] = useState<DocMetadata>({});
  const [body, setBody] = useState<string>("");
  const [toc, setToc] = useState<TableOfContents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoc() {
      try {
        // Fetch the markdown file from the public docs folder
        const response = await fetch(`/docs/${docName}.md`);

        if (!response.ok) {
          setError(`Failed to load document: ${docName}`);
          return;
        }

        const content = await response.text();

        // Parse frontmatter and extract metadata
        const { metadata: parsedMetadata, body: parsedBody } =
          parseFrontmatter(content);

        // Generate table of contents
        const generatedToc = generateTableOfContents(parsedBody);

        setMetadata(parsedMetadata);
        setBody(parsedBody);
        setToc(generatedToc);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadDoc();
  }, [docName]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-zinc-600">Loading documentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-lg text-zinc-600">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Back
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-black dark:text-white">
            {metadata.title || docName}
          </h1>
          {metadata.description && (
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              {metadata.description}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Table of Contents */}
          {toc.length > 0 && (
            <aside className="lg:col-span-1">
              <nav className="sticky top-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="font-semibold text-black dark:text-white">
                  On this page
                </h3>
                <ul className="mt-4 space-y-2">
                  {toc.map((heading) => (
                    <li
                      key={heading.id}
                      style={{
                        marginLeft: `${(heading.level - 2) * 1}rem`,
                      }}
                    >
                      <a
                        href={`#${heading.id}`}
                        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        {heading.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <article className="prose dark:prose-invert lg:col-span-3">
            <div dangerouslySetInnerHTML={{ __html: body }} />
          </article>
        </div>
      </div>
    </div>
  );
}
