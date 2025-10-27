# Hybrid Control Plane Documentation Site

A modern Next.js documentation site for the Hybrid Control Plane CI/CD platform, featuring dynamic markdown rendering, table of contents generation, and CodeUChain utilities for document processing.

## Features

- 📖 **Responsive Documentation Site** - Beautiful, dark-mode-friendly design
- 🎨 **Static Pre-rendering** - All documentation pages pre-rendered at build time
- 🔄 **Markdown Processing** - Frontmatter parsing and metadata extraction
- 📑 **Auto TOC Generation** - Table of contents generated from headings
- ⚡ **CodeUChain Integration** - Graph-based document processing utilities
- 🎯 **TypeScript Support** - Full type safety for documentation

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Graph Processing**: CodeUChain
- **Build**: Turbopack

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Homepage
│   └── docs/[slug]/             # Dynamic doc pages
├── components/
│   └── DocPage.tsx              # Page component
└── lib/
    └── doc-processing.ts        # CodeUChain utilities

public/docs/                      # Markdown files
```

## Building

```bash
npm run build    # Production build
npm run lint     # Run ESLint
```

## Adding Documentation

1. Add markdown file to `public/docs/my-doc.md`
2. Update `generateStaticParams()` in `src/app/docs/[slug]/page.tsx`
3. Documentation automatically appears on homepage

## Features

### Document Processing (CodeUChain)

- **`parseFrontmatter()`** - Extract metadata from markdown
- **`generateTableOfContents()`** - Auto-generate TOC from headings
- Client-side markdown rendering with responsive layout

### Pages

- **Homepage** - Documentation grid with descriptions
- **Doc Pages** - Markdown with TOC sidebar
- **Dark Mode** - Full dark mode support

## Contributing

Edit markdown in `public/docs/` and test with `npm run dev`.

## License

Apache License 2.0
