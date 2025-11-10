'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ListChecks, 
  Users, 
  GitBranch,
  BookOpen,
  Settings
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import type { SidebarItem } from '@/components/layout/Sidebar';

const NAV_ITEMS: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: ListChecks,
    href: '/dashboard/jobs',
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Users,
    href: '/dashboard/agents',
  },
  {
    id: 'deployments',
    label: 'Deployments',
    icon: GitBranch,
    href: '/dashboard/deployments',
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: BookOpen,
    href: '/docs/overview',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine active nav item based on current pathname
  const getActiveId = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/dashboard/jobs')) return 'jobs';
    if (pathname.startsWith('/dashboard/agents')) return 'agents';
    if (pathname.startsWith('/dashboard/deployments')) return 'deployments';
    if (pathname.startsWith('/dashboard/settings')) return 'settings';
    if (pathname.startsWith('/docs')) return 'docs';
    return 'dashboard';
  };

  const handleNavigate = (itemId: string) => {
    const item = NAV_ITEMS.find(i => i.id === itemId);
    if (item?.href) {
      router.push(item.href);
    }
  };

  return (
    <AppShell
      header={
        <Header
          logo="Hybrid CI/CD"
          title="Dashboard"
        />
      }
      sidebar={
        <Sidebar
          items={NAV_ITEMS}
          activeId={getActiveId()}
          onNavigate={handleNavigate}
        />
      }
    >
      {children}
    </AppShell>
  );
}
