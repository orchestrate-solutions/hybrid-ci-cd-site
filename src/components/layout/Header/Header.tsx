import { useState } from 'react';
import { Moon, Sun, Menu, X } from 'lucide-react';

export interface HeaderProps {
  logo: string;
  title: string;
  userMenuItems?: Array<{ label: string; onClick: () => void }>;
  onThemeToggle?: () => void;
}

export function Header({ 
  logo, 
  title, 
  userMenuItems,
  onThemeToggle 
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 flex items-center px-6 bg-header border-b border-divider">
      {/* Logo */}
      <div className="text-lg font-semibold mr-8">
        {logo}
      </div>

      {/* Title */}
      <div className="flex-1 text-base truncate">
        {title}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            className="p-2 rounded hover:bg-surface-secondary transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <Sun className="w-5 h-5 block dark:hidden" />
            <Moon className="w-5 h-5 hidden dark:block" />
          </button>
        )}

        {/* User menu */}
        {userMenuItems && userMenuItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded hover:bg-surface-secondary transition-colors"
              aria-label="User menu"
              title="User menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-primary border border-divider rounded shadow-lg overflow-hidden z-50">
                {userMenuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleMenuItemClick(item.onClick)}
                    className="w-full text-left px-4 py-2 hover:bg-surface-secondary transition-colors text-text-primary"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
