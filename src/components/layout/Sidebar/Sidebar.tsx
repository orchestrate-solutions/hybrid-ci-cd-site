import { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  submenu?: Array<{ id: string; label: string; href?: string }>;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeId?: string;
  onNavigate?: (itemId: string) => void;
}

export function Sidebar({ items, activeId, onNavigate }: SidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleItemClick = (item: SidebarItem) => {
    if (item.submenu) {
      setExpandedId(expandedId === item.id ? null : item.id);
    }
    if (onNavigate) {
      onNavigate(item.id);
    }
  };

  return (
    <nav className="w-full flex-shrink-0 overflow-y-auto flex flex-col bg-surface-primary text-text-primary">
      <nav className="flex-1 px-0 py-4 space-y-1">
        {items.map((item) => (
          <div key={item.id}>
            {/* Main item button */}
            <button
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-secondary ${
                activeId === item.id ? 'bg-surface-secondary' : ''
              }`}
              title={item.label}
            >
              {item.icon && (
                <item.icon className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="flex-1 text-left truncate">
                {item.label}
              </span>
              {item.submenu && (
                <ChevronDown 
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${
                    expandedId === item.id ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {/* Submenu items */}
            {item.submenu && expandedId === item.id && (
              <div className="pl-9 space-y-1">
                {item.submenu.map((subitem) => (
                  <button
                    key={subitem.id}
                    onClick={() => onNavigate?.(subitem.id)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-surface-secondary ${
                      activeId === subitem.id ? 'bg-surface-secondary' : ''
                    }`}
                    title={subitem.label}
                  >
                    {subitem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </nav>
  );
}
