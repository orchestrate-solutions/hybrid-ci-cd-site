import DocPage from "@/components/DocPage";
import { readFileSync } from "fs";
import { join } from "path";

interface DocPageParams {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: DocPageParams) {
  const { slug } = await params;
  const content = getDocContent(slug);
  return <DocPage docName={slug} content={content} />;
}

// Helper function to read markdown files at build time
function getDocContent(slug: string): string {
  try {
    const docPath = join(process.cwd(), "docs", `${slug}.md`);
    return readFileSync(docPath, "utf-8");
  } catch (error) {
    return `# ${slug}\n\nDocumentation not found.`;
  }
}

// Generate static pages for all documentation
export async function generateStaticParams() {
  const docs = [
    "executive-summary",
    "problem-statement",
    "solution-architecture",
    "authentication",
    "frontend-architecture",
    "technology-stack",
    "features-benefits",
  ];

  return docs.map((doc) => ({
    slug: doc,
  }));
}
