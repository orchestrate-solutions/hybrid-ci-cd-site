import Link from 'next/link';

export const metadata = {
  title: 'Hybrid CI/CD Site',
  description: 'Enterprise CI/CD platform for seamless integration',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Hybrid CI/CD Platform
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Enterprise-grade continuous integration and deployment for modern development teams
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link 
              href="/docs/solution-architecture"
              className="block p-6 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Architecture</h3>
              <p className="text-slate-400">Learn about our system design</p>
            </Link>
            
            <Link 
              href="/docs/technology-stack"
              className="block p-6 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Technology</h3>
              <p className="text-slate-400">Explore our tech stack</p>
            </Link>
            
            <Link 
              href="/docs/features-benefits"
              className="block p-6 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Features</h3>
              <p className="text-slate-400">Discover platform capabilities</p>
            </Link>
            
            <Link 
              href="/docs/authentication"
              className="block p-6 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Authentication</h3>
              <p className="text-slate-400">Security and access control</p>
            </Link>
          </div>

          <div className="text-sm text-slate-400">
            <p>View all <Link href="/docs/executive-summary" className="text-blue-400 hover:text-blue-300">documentation</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
}
