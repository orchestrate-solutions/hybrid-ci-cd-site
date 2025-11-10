import { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleItemClick = (item: SidebarItem) => {
    if (item.submenu) {
      setExpandedId(expandedId === item.id ? null : item.id);
    }
    if (onNavigate) {
      onNavigate(item.id);
    }
  };

  return (
    <Box
      component="nav"
      sx={{
        width: '100%',
        flexShrink: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'action.disabled',
          borderRadius: '4px',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        },
      }}
    >
      <List
        component="div"
        disablePadding
        sx={{
          flex: 1,
          py: 1,
          '& .MuiListItemButton-root': {
            py: 1,
            px: 2,
            mb: 0.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          },
        }}
      >
        {items.map((item) => (
          <div key={item.id}>
            {/* Main item */}
            <ListItemButton
              onClick={() => handleItemClick(item)}
              selected={activeId === item.id}
              sx={{
                backgroundColor: activeId === item.id ? 'action.selected' : 'transparent',
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              {item.icon && (
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: activeId === item.id ? 'primary.main' : 'inherit',
                  }}
                >
                  <item.icon size={20} />
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: activeId === item.id ? 600 : 500,
                }}
              />
              {item.submenu && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    ml: 1,
                  }}
                >
                  {expandedId === item.id ? <ExpandLess /> : <ExpandMore />}
                </Box>
              )}
            </ListItemButton>

            {/* Submenu items */}
            {item.submenu && (
              <Collapse in={expandedId === item.id} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subitem) => (
                    <ListItemButton
                      key={subitem.id}
                      onClick={() => onNavigate?.(subitem.id)}
                      selected={activeId === subitem.id}
                      sx={{
                        pl: 4,
                        py: 0.75,
                        backgroundColor: activeId === subitem.id ? 'action.selected' : 'transparent',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.lighter',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'primary.lighter',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={subitem.label}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontSize: '0.875rem',
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </div>
        ))}
      </List>
    </Box>
  );
}
