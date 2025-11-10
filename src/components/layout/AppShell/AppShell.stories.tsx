import { Meta, StoryObj } from '@storybook/react';
import { AppShell } from './AppShell';

export default {
  component: AppShell,
  tags: ['autodocs'],
} satisfies Meta<typeof AppShell>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: <div className="bg-blue-500 text-white p-4">Header Content</div>,
    sidebar: <div className="bg-gray-800 text-white p-4">Sidebar Navigation</div>,
    children: (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Main Content Area</h1>
        <p>This is the main content section of the dashboard.</p>
      </div>
    ),
  },
};

export const WithMinimalLayout: Story = {
  args: {
    header: <div className="h-16 bg-gray-100 border-b border-gray-200"></div>,
    sidebar: <div className="w-64 bg-gray-50 border-r border-gray-200"></div>,
    children: (
      <div className="p-4">
        <p>Minimal content layout</p>
      </div>
    ),
  },
};

export const WithRichContent: Story = {
  args: {
    header: (
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div>User Menu</div>
      </div>
    ),
    sidebar: (
      <nav className="p-4 space-y-2">
        <a href="#" className="block px-4 py-2 rounded hover:bg-gray-100">
          Jobs
        </a>
        <a href="#" className="block px-4 py-2 rounded hover:bg-gray-100">
          Deployments
        </a>
        <a href="#" className="block px-4 py-2 rounded hover:bg-gray-100">
          Agents
        </a>
      </nav>
    ),
    children: (
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded">Metric 1</div>
          <div className="p-4 border rounded">Metric 2</div>
          <div className="p-4 border rounded">Metric 3</div>
        </div>
        <div className="p-4 border rounded">Main content</div>
      </div>
    ),
  },
};

export const CollapsibleSidebar: Story = {
  args: {
    header: <div className="h-16 bg-gray-100 flex items-center px-6">Header</div>,
    sidebar: (
      <div className="overflow-y-auto">
        <nav className="p-2 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <a
              key={i}
              href="#"
              className="block px-4 py-2 rounded text-sm hover:bg-gray-100"
            >
              Menu Item {i + 1}
            </a>
          ))}
        </nav>
      </div>
    ),
    children: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome</h2>
        <p>Content scrolls independently</p>
      </div>
    ),
  },
};
