import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Brightness4,
  Brightness7,
  Person,
  LogOut,
} from '@mui/icons-material';

export interface HeaderProps {
  logo: string;
  title: string;
  userMenuItems?: Array<{ label: string; onClick: () => void }>;
  onThemeToggle?: () => void;
  onMenuToggle?: () => void;
}

export function Header({
  logo,
  title,
  userMenuItems,
  onThemeToggle,
  onMenuToggle,
}: HeaderProps) {
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    handleUserMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: { xs: 2, md: 3 },
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            minWidth: 'fit-content',
          }}
        >
          {logo}
        </Typography>

        {/* Title */}
        <Typography
          variant="body1"
          sx={{
            flex: 1,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'text.secondary',
          }}
        >
          {title}
        </Typography>

        {/* Right side controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {/* Mobile menu toggle (hamburger) */}
          {onMenuToggle && (
            <IconButton
              onClick={onMenuToggle}
              size="small"
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: 'inherit',
              }}
              title="Toggle menu"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Theme toggle */}
          {onThemeToggle && (
            <IconButton
              onClick={onThemeToggle}
              size="small"
              sx={{
                color: 'inherit',
              }}
              title="Toggle theme"
            >
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          )}

          {/* User menu */}
          {userMenuItems && userMenuItems.length > 0 && (
            <>
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                sx={{
                  color: 'inherit',
                }}
                title="User menu"
              >
                <Person />
              </IconButton>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                {userMenuItems.map((item, index) => (
                  <MenuItem
                    key={index}
                    onClick={() => handleMenuItemClick(item.onClick)}
                    sx={{
                      py: 1,
                      px: 2,
                    }}
                  >
                    <Typography variant="body2">{item.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
