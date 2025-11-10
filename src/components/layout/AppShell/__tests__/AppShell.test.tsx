import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppShell } from '../AppShell';

describe('AppShell', () => {
  // Rendering tests
  it('renders header content', () => {
    render(
      <AppShell
        header={<div data-testid="header">Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        Content
      </AppShell>
    );
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders sidebar content', () => {
    render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div data-testid="sidebar">Sidebar</div>}
      >
        Content
      </AppShell>
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(
      <AppShell header={<div>Header</div>} sidebar={<div>Sidebar</div>}>
        <div data-testid="main-content">Main Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  // Layout structure tests
  it('has three main sections: header, sidebar, content', () => {
    const { container } = render(
      <AppShell
        header={<div data-testid="header">Header</div>}
        sidebar={<div data-testid="sidebar">Sidebar</div>}
      >
        <div data-testid="content">Content</div>
      </AppShell>
    );
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders with proper container structure', () => {
    const { container } = render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        Content
      </AppShell>
    );
    
    // Should have a root container
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
  });

  // CSS class tests
  it('applies flex layout classes', () => {
    const { container } = render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        Content
      </AppShell>
    );
    
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('flex');
  });

  it('applies theme background colors', () => {
    const { container } = render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        Content
      </AppShell>
    );
    
    const root = container.firstChild as HTMLElement;
    const style = window.getComputedStyle(root);
    expect(style.backgroundColor).toBeTruthy();
  });

  // Header positioning tests
  it('header spans full width', () => {
    const { container } = render(
      <AppShell
        header={<div data-testid="header">Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        Content
      </AppShell>
    );
    
    const header = screen.getByTestId('header').parentElement;
    expect(header).toHaveClass('w-full');
  });

  // Sidebar positioning tests
  it('sidebar is on the left side', () => {
    const { container } = render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div data-testid="sidebar">Sidebar</div>}
      >
        Content
      </AppShell>
    );
    
    const sidebar = screen.getByTestId('sidebar').parentElement;
    expect(sidebar).toHaveClass('flex-shrink-0');
  });

  // Content area tests
  it('content area is flex-1 to fill remaining space', () => {
    const { container } = render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        <div data-testid="content">Content</div>
      </AppShell>
    );
    
    const content = screen.getByTestId('content').parentElement;
    expect(content).toHaveClass('flex-1');
  });

  it('content area scrolls independently', () => {
    const { container } = render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        <div data-testid="content">Content</div>
      </AppShell>
    );
    
    const content = screen.getByTestId('content').parentElement;
    expect(content).toHaveClass('overflow-auto');
  });

  // Accessibility tests
  it('has semantic structure', () => {
    const { container } = render(
      <AppShell
        header={<header>Header</header>}
        sidebar={<nav>Navigation</nav>}
      >
        <main>Main Content</main>
      </AppShell>
    );
    
    // Should have the semantic elements rendered
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  // Flexibility tests
  it('accepts ReactNode as children for each section', () => {
    render(
      <AppShell
        header={<div>Header</div>}
        sidebar={<div>Sidebar</div>}
      >
        <section>
          <h1>Complex Content</h1>
          <p>Can contain any React elements</p>
        </section>
      </AppShell>
    );
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('Can contain any React elements')).toBeInTheDocument();
  });
});
