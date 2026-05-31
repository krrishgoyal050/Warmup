import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Grid, Card, CardContent } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import RouteIcon from '@mui/icons-material/Route';
import PaidIcon from '@mui/icons-material/Paid';
import ChatIcon from '@mui/icons-material/Chat';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { highContrast } = useAccessibility();
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(user ? '/dashboard' : '/auth');
  };

  const features = [
    {
      title: 'Smart Dynamic Itinerary',
      desc: 'Harness the power of Gemini 2.5 Pro to curate customized multi-day travel plans matching your exact interests.',
      icon: <RouteIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: 'Budget Allocation Engine',
      desc: 'Input your total trip budget and travel style. Our engine allocates money dynamically for accommodation, meals, activities, and transport.',
      icon: <PaidIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
    },
    {
      title: 'AI Travel Copilot Chat',
      desc: 'Ask our copilot where to dine next, request local tips, or issue simple statements to alter plans on the go.',
      icon: <ChatIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: 'Weather Intelligence',
      desc: 'Analyzes meteorological forecasts dynamically. Suggests shifting scheduled outdoor treks to indoor museums during rainy days.',
      icon: <CloudQueueIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
    },
  ];

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)', 
        background: highContrast 
          ? '#000000' 
          : 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, rgba(3, 7, 18, 1) 90%)',
        py: { xs: 6, md: 10 } 
      }}
    >
      <Container maxWidth="lg">
        {/* HERO SECTION */}
        <Grid container spacing={6} alignItems="center" sx={{ mb: { xs: 8, md: 12 } }}>
          <Grid item xs={12} md={7}>
            <Box>
              <Box 
                sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  px: 2, 
                  py: 0.75, 
                  borderRadius: '30px', 
                  backgroundColor: highContrast ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  mb: 3
                }}
              >
                <AccessibilityNewIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', letterSpacing: '0.5px' }}>
                  ACCESSIBLE • INTUITIVE • ENTERPRISE
                </Typography>
              </Box>

              <Typography 
                variant="h1" 
                sx={{ 
                  lineHeight: 1.15,
                  mb: 3, 
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                  background: highContrast ? 'none' : 'linear-gradient(135deg, #ffffff 10%, #9ca3af 90%)',
                  WebkitBackgroundClip: highContrast ? 'unset' : 'text',
                  WebkitTextFillColor: highContrast ? 'unset' : 'transparent',
                  color: highContrast ? '#ffffff' : undefined,
                }}
              >
                Intelligent Travel Planning & Experience Engine
              </Typography>

              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  mb: 5, 
                  fontSize: { xs: '1.05rem', md: '1.25rem' }, 
                  maxWidth: '580px',
                  lineHeight: 1.7
                }}
              >
                Discover the world with a personalized itinerary synthesized by Gemini. Experience automated weather replanning, precise travel time scoring, and structured budget splitting out-of-the-box.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={handleStart}
                  startIcon={<FlightTakeoffIcon />}
                  sx={{ 
                    fontSize: '1rem',
                    px: 4,
                    py: 1.5,
                    borderRadius: '12px',
                    fontWeight: 700,
                    background: highContrast ? 'none' : 'linear-gradient(45deg, #6366f1 30%, #14b8a6 90%)',
                    color: highContrast ? 'primary.main' : '#ffffff',
                    border: highContrast ? '2px solid #fbbf24' : 'none',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s',
                    }
                  }}
                >
                  Start Planning Now
                </Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box 
              sx={{ 
                position: 'relative', 
                height: 400,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Glassmorphic Decorative Sphere */}
              <Box 
                sx={{ 
                  position: 'absolute',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #6366f1 0%, #14b8a6 100%)',
                  filter: 'blur(60px)',
                  opacity: 0.18,
                }}
              />
              <Card 
                sx={{ 
                  position: 'relative', 
                  width: '85%', 
                  p: 3, 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                </Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  Destination: Tokyo, Japan 🇯🇵
                </Typography>
                <Typography variant="body2" color="primary.main" sx={{ mb: 2, fontWeight: 600 }}>
                  Itinerary Health Score: 92/100
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #6366f1' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>09:30 - Senso-ji Temple Visit</Typography>
                    <Typography variant="caption" color="text.secondary">Sightseeing tour. Accessibility: Yes.</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #14b8a6' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>12:30 - Ichiran Ramen</Typography>
                    <Typography variant="caption" color="text.secondary">Culinary experience. Cost: $15.</Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* FEATURES GRID */}
        <Typography 
          variant="h2" 
          align="center"
          sx={{ 
            mb: 8, 
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: { xs: '1.8rem', md: '2.5rem' }
          }}
        >
          Dynamic Intelligence Architecture
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} key={idx}>
              <Card 
                sx={{ 
                  height: '100%', 
                  transition: 'transform 0.3s, border 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                  }
                }}
              >
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
