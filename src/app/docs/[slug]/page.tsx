import DocPage from "@/components/DocPage";

interface DocPageParams {
  params: {
    slug: string;
  };
}

export default function Page({ params }: DocPageParams) {
  return <DocPage docName={params.slug} />;
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
