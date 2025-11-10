import Link from 'next/link';
import { ArrowRight, Zap, BarChart3, Shield, Users } from 'lucide-react';

export const metadata = {
  title: 'Hybrid CI/CD Site',
  description: 'Enterprise CI/CD platform for seamless integration',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation Header */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-white">Hybrid CI/CD</div>
          <div className="flex gap-6">
            <Link href="/docs/overview" className="text-slate-300 hover:text-white transition">
              Docs
            </Link>
            <Link href="/docs/solution-architecture" className="text-slate-300 hover:text-white transition">
              Architecture
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-20">
            <h1 className="text-6xl font-bold text-white mb-6">
              Enterprise CI/CD Platform
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Federated DevOps orchestration with multi-region agent support, configuration-driven tool integrations, and community-extensible plugins.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center mb-16">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/docs/overview"
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {/* Feature 1: Jobs Management */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl hover:border-slate-600 transition">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <ListChecks className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Job Management</h3>
                  <p className="text-slate-400">
                    Queue, prioritize, and execute jobs with atomic operations and state machines. Full CRUD lifecycle with fault tolerance.
                  </p>
                  <Link
                    href="/dashboard/jobs"
                    className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
                  >
                    View Jobs <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 2: Agent Pool */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl hover:border-slate-600 transition">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Agent Orchestration</h3>
                  <p className="text-slate-400">
                    Multi-region agent pools with health monitoring, automatic registration, and lease-based heartbeats for distributed execution.
                  </p>
                  <Link
                    href="/dashboard/agents"
                    className="mt-4 inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition"
                  >
                    View Agents <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 3: Deployments */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl hover:border-slate-600 transition">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <GitBranch className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Deployment Lifecycle</h3>
                  <p className="text-slate-400">
                    Track deployments across environments with rollback support, timeline visualization, and real-time status updates.
                  </p>
                  <Link
                    href="/dashboard/deployments"
                    className="mt-4 inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
                  >
                    View Deployments <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 4: Metrics & Monitoring */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl hover:border-slate-600 transition">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Metrics & Insights</h3>
                  <p className="text-slate-400">
                    Real-time dashboards with job success rates, agent health, deployment timing, and performance analytics.
                  </p>
                  <Link
                    href="/dashboard"
                    className="mt-4 inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition"
                  >
                    View Metrics <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities Section */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-12 mb-20">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Platform Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-blue-400" />
                  <h3 className="font-semibold text-white">Configuration-Driven</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Tool integrations defined via JSON configs. Add new tools without code changes.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-green-400" />
                  <h3 className="font-semibold text-white">Type-Safe</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Python 3.11+ backend, TypeScript 5 frontend. Zero runtime type surprises.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-purple-400" />
                  <h3 className="font-semibold text-white">Community-Extensible</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Plugin system for custom integrations. Federated architecture scales globally.
                </p>
              </div>
            </div>
          </div>

          {/* Documentation Links */}
          <div className="border-t border-slate-700 pt-12">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Documentation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/docs/solution-architecture"
                className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Architecture</h3>
                <p className="text-slate-400 text-sm">Learn about our system design and components</p>
              </Link>

              <Link
                href="/docs/technology-stack"
                className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Technology Stack</h3>
                <p className="text-slate-400 text-sm">Explore the tech we use and why</p>
              </Link>

              <Link
                href="/docs/features-benefits"
                className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Features & Benefits</h3>
                <p className="text-slate-400 text-sm">Discover platform capabilities</p>
              </Link>

              <Link
                href="/docs/authentication"
                className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Authentication</h3>
                <p className="text-slate-400 text-sm">Security and access control</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Import icons we're using
import { ListChecks, GitBranch } from 'lucide-react';
