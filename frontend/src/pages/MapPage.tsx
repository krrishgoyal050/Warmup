import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaidIcon from '@mui/icons-material/Paid';
import apiClient from '../services/api';
import { Trip, ItineraryDay, Activity } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';

export const MapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { highContrast } = useAccessibility();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response: any = await apiClient.get(`/trips/${id}`);
        const t = response.data;
        setTrip(t);
        
        // Select first active activity as default selected
        if (t.itinerary?.[0]?.activities?.[0]) {
          setActiveActivity(t.itinerary[0].activities[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load itinerary details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id]);

  const handleDaySelect = (idx: number) => {
    setActiveDayIdx(idx);
    if (trip?.itinerary?.[idx]?.activities?.[0]) {
      setActiveActivity(trip.itinerary[idx].activities[0]);
    }
  };

  // Icon mapping helper
  const getActivityIcon = (category: Activity['category']) => {
    switch (category) {
      case 'accommodation': return <HotelIcon sx={{ color: 'primary.main' }} />;
      case 'food': return <RestaurantIcon sx={{ color: 'secondary.main' }} />;
      case 'transport': return <DirectionsTransitIcon sx={{ color: 'info.main' }} />;
      default: return <LocationOnIcon sx={{ color: 'warning.main' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !trip) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h3" sx={{ mb: 2 }}>Oops! Trip details could not be found.</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </Box>
    );
  }

  const activeDay: ItineraryDay = trip.itinerary[activeDayIdx] || trip.itinerary[0];
  const budget = trip.budgetBreakdown;
  const totalAlloc = budget.accommodation + budget.food + budget.transport + budget.activities;

  // Colors for Custom Donut Chart
  const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#3b82f6'];

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', backgroundColor: highContrast ? '#000000' : '#030712' }}>
      
      {/* HEADER CONTROLS */}
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          py: 3, 
          px: { xs: 2, md: 4 }, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/dashboard')}
            sx={{ borderRadius: '10px' }}
          >
            Dashboard
          </Button>
          <Box>
            <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
              {trip.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exploring **{trip.destination}** over {trip.durationDays} Days • Score: **{trip.scoring?.overallScore || 90}/100**
            </Typography>
          </Box>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<ChatIcon />}
          onClick={() => navigate(`/copilot/${trip.id}`)}
          sx={{
            fontWeight: 700,
            background: highContrast ? 'none' : 'linear-gradient(45deg, #14b8a6 30%, #6366f1 90%)',
            color: highContrast ? 'primary.main' : '#ffffff',
          }}
        >
          Consult AI Copilot
        </Button>
      </Box>

      {/* WEATHER ALERT NOTIFICATIONS */}
      {trip.weatherAlerts.length > 0 && (
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 2 }}>
          {trip.weatherAlerts.map((alert, idx) => (
            <Alert 
              key={idx} 
              severity="warning" 
              icon={<ErrorOutlineIcon />} 
              sx={{ borderRadius: '12px', mb: 1, border: '1px solid orange' }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                WEATHER CONFLICT DETECTED on {alert.date}: {alert.warning}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* TRIP STATS & VISUALIZATION ROW */}
      <Container maxWidth="xl" sx={{ mt: 3, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Daily Schedule Navigation */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ py: 1.5, px: 2, display: 'flex', gap: 1.5, overflowX: 'auto' }}>
                {trip.itinerary.map((day, idx) => (
                  <Chip
                    key={day.dayNumber}
                    icon={<CalendarTodayIcon />}
                    label={`Day ${day.dayNumber} (${day.date.split('-').slice(1).join('/')})`}
                    onClick={() => handleDaySelect(idx)}
                    color={activeDayIdx === idx ? 'primary' : 'default'}
                    variant={activeDayIdx === idx ? 'contained' : 'outlined'}
                    sx={{ 
                      borderRadius: '10px',
                      py: 2,
                      px: 1,
                      fontWeight: 700,
                      backgroundColor: activeDayIdx === idx && !highContrast ? 'primary.main' : undefined,
                      color: activeDayIdx === idx && !highContrast ? '#000000' : undefined,
                    }}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          
          {/* COLUMN 1: ITINERARY TIMELINE */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  Day {activeDay.dayNumber} Route Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {activeDay.dailyRouteSummary}
                </Typography>
                
                <Divider sx={{ mb: 2 }} />

                <List sx={{ p: 0 }}>
                  {activeDay.activities.map((act, idx) => {
                    const isSelected = activeActivity?.id === act.id;
                    return (
                      <React.Fragment key={act.id}>
                        {idx > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 3, my: 1.5, gap: 1 }}>
                            <DirectionsWalkIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                            <Typography variant="caption" color="text.secondary">
                              Transit Estimate: 15-20 mins
                            </Typography>
                          </Box>
                        )}
                        <ListItem 
                          onClick={() => setActiveActivity(act)}
                          sx={{ 
                            borderRadius: '12px', 
                            cursor: 'pointer',
                            backgroundColor: isSelected 
                              ? (highContrast ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.08)')
                              : 'transparent',
                            border: isSelected ? '1px solid' : '1px solid transparent',
                            borderColor: 'primary.main',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.02)',
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getActivityIcon(act.category)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                {act.startTime} — {act.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {act.location.address}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip label={act.category.toUpperCase()} size="small" sx={{ fontSize: '0.6rem', height: 16 }} />
                                  <Chip label={act.cost === 0 ? 'FREE' : `$${act.cost}`} size="small" color={act.cost === 0 ? 'success' : 'default'} sx={{ fontSize: '0.6rem', height: 16 }} />
                                  {act.accessibilityFriendly && <Chip label="Accessible" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* COLUMN 2: VISUAL MAP ENGINE */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: 'calc(100vh - 280px)', p: 0, position: 'relative', overflow: 'hidden' }}>
              
              {/* INTERACTIVE GEOGRAPHIC CANVAS FALLBACK */}
              <Box 
                sx={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundColor: '#1f2937', 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundSize: '40px 40px',
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)'
                }}
              >
                
                {/* SVG Route Connection Lines */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <path
                    d="M 120 180 Q 220 120 300 240 T 450 150"
                    fill="none"
                    stroke={highContrast ? '#fbbf24' : '#6366f1'}
                    strokeWidth="3.5"
                    strokeDasharray="8 6"
                  />
                </svg>

                {/* Styled Markers */}
                {activeDay.activities.map((act, actIdx) => {
                  const isActiveSel = activeActivity?.id === act.id;
                  const xCoords = [120, 240, 300, 360, 450];
                  const yCoords = [180, 140, 240, 290, 150];
                  const x = xCoords[actIdx % xCoords.length];
                  const y = yCoords[actIdx % yCoords.length];

                  return (
                    <Tooltip title={`${act.startTime} - ${act.name}`} key={act.id}>
                      <Box
                        onClick={() => setActiveActivity(act)}
                        sx={{
                          position: 'absolute',
                          left: x,
                          top: y,
                          transform: 'translate(-50%, -50%)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: isActiveSel ? 10 : 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: isActiveSel ? 36 : 28,
                            height: isActiveSel ? 36 : 28,
                            borderRadius: '50%',
                            backgroundColor: isActiveSel ? 'primary.main' : 'background.paper',
                            border: `2px solid`,
                            borderColor: isActiveSel ? '#ffffff' : 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: isActiveSel ? '#000000' : 'text.primary', fontSize: isActiveSel ? '0.75rem' : '0.65rem' }}>
                            {actIdx + 1}
                          </Typography>
                        </Box>
                        
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            mt: 0.5, 
                            fontWeight: 700, 
                            color: isActiveSel ? 'primary.main' : 'text.secondary',
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            fontSize: '0.6rem',
                            border: isActiveSel ? '1px solid rgba(255,255,255,0.1)' : 'none',
                          }}
                        >
                          {act.name.slice(0, 14)}...
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}

                {/* Map Overlay HUD Card */}
                <Card 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 16, 
                    left: 16, 
                    right: 16, 
                    background: 'rgba(3,7,18,0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    p: 2,
                    zIndex: 20
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                    ACTIVE SPOT: {activeActivity?.name || 'Select a marker'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {activeActivity?.description || 'Click any location marker to consult directions, historical highlights, or accessibility information.'}
                  </Typography>
                </Card>

                {/* Floating GPS HUD */}
                <Chip 
                  label="GEOGRAPHIC SIMULATOR ACTIVE" 
                  size="small" 
                  color="secondary" 
                  sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 700, fontSize: '0.65rem' }} 
                />
              </Box>

            </Card>
          </Grid>

          {/* COLUMN 3: BUDGET BREAKDOWN DONUT & METRICS */}
          <Grid item xs={12} md={3}>
            <Grid container spacing={3}>
              {/* Budget Allocation Panel */}
              <Grid item xs={12}>
                <Card sx={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                      Budget Allocation
                    </Typography>

                    {/* PREMIUM SVG DONUT CHART */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <svg width="150" height="150" viewBox="0 0 150 150">
                        {/* 
                          Let's draw 4 sections: 
                          Accomodation, Food, Transport, Activities.
                          We can compute actual stroke-dasharray.
                          For simplicity of rendering in all scaling cases, we draw perfectly styled nested rings 
                        */}
                        <circle cx="75" cy="75" r="60" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="16" />
                        
                        {/* Accommodation Ring Segment */}
                        <circle 
                          cx="75" cy="75" r="60" 
                          fill="transparent" 
                          stroke={colors[0]} 
                          strokeWidth="16" 
                          strokeDasharray="376" // 2*PI*R = ~376.9
                          strokeDashoffset={376 * (1 - budget.accommodation / trip.totalBudget)}
                          transform="rotate(-90 75 75)"
                        />
                        {/* Food Segment */}
                        <circle 
                          cx="75" cy="75" r="42" 
                          fill="transparent" 
                          stroke={colors[1]} 
                          strokeWidth="12" 
                          strokeDasharray="263"
                          strokeDashoffset={263 * (1 - budget.food / trip.totalBudget)}
                          transform="rotate(0 75 75)"
                        />
                        {/* Transport */}
                        <circle 
                          cx="75" cy="75" r="26" 
                          fill="transparent" 
                          stroke={colors[2]} 
                          strokeWidth="10" 
                          strokeDasharray="163"
                          strokeDashoffset={163 * (1 - budget.transport / trip.totalBudget)}
                          transform="rotate(90 75 75)"
                        />
                        
                        <text x="75" y="80" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="14">
                          ${trip.totalBudget}
                        </text>
                      </svg>
                    </Box>

                    {/* Chart Legend */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {[
                        { label: 'Accommodation', val: budget.accommodation, color: colors[0] },
                        { label: 'Culinary Eats', val: budget.food, color: colors[1] },
                        { label: 'Transportation', val: budget.transport, color: colors[2] },
                        { label: 'Experiences', val: budget.activities, color: colors[3] }
                      ].map((item, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '30%', backgroundColor: item.color }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.label}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ${item.val} ({Math.round(item.val / trip.totalBudget * 100)}%)
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* ITINERARY SCORES SUMMARY */}
                    <Typography variant="h4" sx={{ mb: 2.5, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                      Efficiency Metrics
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        { label: 'Budget Allocation Alignment', val: trip.scoring?.budgetFit || 90 },
                        { label: 'Geographic Transit Optimization', val: trip.scoring?.efficiency || 85 },
                        { label: 'Category & Experience Diversity', val: trip.scoring?.diversity || 92 },
                        { label: 'User Preferences Alignment', val: trip.scoring?.preferenceMatch || 88 }
                      ].map((metric, i) => (
                        <Box key={i}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{metric.label}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{metric.val}%</Typography>
                          </Box>
                          <Box sx={{ width: '100%', height: 4, borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${metric.val}%`, borderRadius: '2px', backgroundColor: 'secondary.main' }} />
                          </Box>
                        </Box>
                      ))}
                    </Box>

                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};
