import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  Tooltip, 
  Avatar, 
  Divider, 
  ListItemIcon,
  ListItemText
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import ContrastIcon from '@mui/icons-material/Contrast';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { highContrast, fontSize, toggleHighContrast, setFontSizeScale } = useAccessibility();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElAccess, setAnchorElAccess] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleOpenAccessMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElAccess(event.currentTarget);
  const handleCloseAccessMenu = () => setAnchorElAccess(null);

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'New Trip', path: '/planner', icon: <AddCircleOutlineIcon fontSize="small" /> },
  ];

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: highContrast ? '#000000' : 'rgba(3, 7, 18, 0.7)',
        backdropFilter: highContrast ? 'none' : 'blur(16px)',
        borderBottom: highContrast ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* LOGO LINK */}
        <Box 
          onClick={() => navigate(user ? '/dashboard' : '/')} 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5 }}
        >
          <FlightTakeoffIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              letterSpacing: '-0.5px',
              fontFamily: "'Outfit', sans-serif",
              background: highContrast ? 'none' : 'linear-gradient(45deg, #6366f1 30%, #14b8a6 90%)',
              WebkitBackgroundClip: highContrast ? 'unset' : 'text',
              WebkitTextFillColor: highContrast ? 'unset' : 'transparent',
              color: highContrast ? 'primary.main' : undefined,
            }}
          >
            Traveler AI
          </Typography>
        </Box>

        {/* NAVIGATION LINKS */}
        {user && (
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1.5 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                startIcon={item.icon}
                variant="text"
                sx={{
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  backgroundColor: isActive(item.path) && !highContrast ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: highContrast ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.04)',
                    color: 'primary.main',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* ACCESSIBILITY & USER PROFILE CONTROLS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1.5 } }}>
          {/* ACCESSIBILITY BUTTON */}
          <Tooltip title="Accessibility Center">
            <IconButton 
              onClick={handleOpenAccessMenu} 
              aria-label="Accessibility settings"
              aria-haspopup="true"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <AccessibilityNewIcon />
            </IconButton>
          </Tooltip>

          {/* ACCESSIBILITY SETTINGS MENU */}
          <Menu
            anchorEl={anchorElAccess}
            open={Boolean(anchorElAccess)}
            onClose={handleCloseAccessMenu}
            PaperProps={{
              sx: {
                mt: 1.5,
                width: 240,
                border: highContrast ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: highContrast ? '#000000' : 'rgba(17, 24, 39, 0.95)',
                backdropFilter: 'blur(16px)',
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
              ACCESSIBILITY SETTINGS
            </Typography>
            <Divider />
            
            {/* TOGGLE HIGH CONTRAST */}
            <MenuItem onClick={toggleHighContrast}>
              <ListItemIcon>
                <ContrastIcon fontSize="small" sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={highContrast ? "Disable High Contrast" : "Enable High Contrast"} 
                secondary={highContrast ? "High Contrast Active" : "Standard Palette"}
              />
            </MenuItem>
            
            {/* SELECT FONT SIZE */}
            <MenuItem>
              <ListItemIcon>
                <FormatSizeIcon fontSize="small" sx={{ color: 'secondary.main' }} />
              </ListItemIcon>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Text Size Scale</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {(['normal', 'large', 'extra-large'] as const).map((scale) => (
                    <Button
                      key={scale}
                      size="small"
                      variant={fontSize === scale ? "contained" : "outlined"}
                      onClick={() => setFontSizeScale(scale)}
                      sx={{ 
                        flex: 1, 
                        fontSize: '0.65rem', 
                        py: 0.25, 
                        px: 0.5,
                        minWidth: 0,
                        backgroundColor: fontSize === scale ? 'primary.main' : 'transparent',
                        color: fontSize === scale ? '#000000' : 'text.primary',
                        border: '1px solid',
                        borderColor: 'primary.main',
                      }}
                    >
                      {scale === 'extra-large' ? 'XL' : scale.toUpperCase()}
                    </Button>
                  ))}
                </Box>
              </Box>
            </MenuItem>
          </Menu>

          {/* USER ACCOUNT CONTROLS */}
          {user ? (
            <>
              <Tooltip title="User Actions">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                  <Avatar 
                    alt={user.displayName} 
                    src={user.photoURL}
                    sx={{ 
                      width: 38, 
                      height: 38, 
                      border: `2px solid`,
                      borderColor: 'primary.main',
                    }}
                  >
                    {user.displayName.charAt(0)}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    width: 200,
                    border: highContrast ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: highContrast ? '#000000' : 'rgba(17, 24, 39, 0.95)',
                    backdropFilter: 'blur(16px)',
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                    {user.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/dashboard'); }} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </MenuItem>
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/planner'); }} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  <ListItemIcon><AddCircleOutlineIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="New Trip" />
                </MenuItem>
                <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText primary="Sign Out" sx={{ color: 'error.main' }} />
                </MenuItem>
              </Menu>
            </>
          ) : (
            location.pathname !== '/auth' && (
              <Button 
                variant="contained" 
                onClick={() => navigate('/auth')}
                sx={{ 
                  fontSize: '0.85rem',
                  ml: 1,
                  background: highContrast ? 'none' : 'linear-gradient(45deg, #6366f1 30%, #14b8a6 90%)',
                  color: highContrast ? 'primary.main' : '#ffffff',
                }}
              >
                Sign In
              </Button>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
