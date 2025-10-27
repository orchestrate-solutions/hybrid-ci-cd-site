import Link from "next/link";

export default function Home() {
  const docs = [
    {
      href: "/docs/executive-summary",
      title: "Executive Summary",
      description: "High-level overview of the hybrid control plane platform",
    },
    {
      href: "/docs/problem-statement",
      title: "Problem Statement",
      description: "Challenges and pain points this platform addresses",
    },
    {
      href: "/docs/solution-architecture",
      title: "Solution Architecture",
      description: "Control plane, data plane, and communication model",
    },
    {
      href: "/docs/authentication",
      title: "Authentication Systems",
      description: "User sessions and workload identity federation",
    },
    {
      href: "/docs/frontend-architecture",
      title: "Frontend Architecture",
      description: "JAMstack static site approach and GitOps workflow",
    },
    {
      href: "/docs/technology-stack",
      title: "Technology Stack",
      description: "Technology choices and implementation details",
    },
    {
      href: "/docs/features-benefits",
      title: "Features & Benefits",
      description: "Security features, operational benefits, and cost savings",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
            Hybrid Control Plane for CI/CD
          </h1>
          <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
            A cloud-orchestrated platform that eliminates the trade-off between operational simplicity and security control.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Zero-trust architecture with stateful sessions and workload identity federation
          </p>
        </div>

        {/* Documentation Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="group relative rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <h3 className="font-semibold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {doc.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {doc.description}
              </p>
              <span className="mt-4 inline-block text-blue-600 dark:text-blue-400">
                Read →
              </span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            Hybrid Control Plane for CI/CD • Built with Next.js + CodeUChain
          </p>
        </footer>
      </main>
    </div>
  );
}
