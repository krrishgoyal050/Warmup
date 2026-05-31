import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  IconButton, 
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import { alert } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import MapIcon from '@mui/icons-material/Map';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import apiClient from '../services/api';
import { Trip } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';

export const DashboardPage: React.FC = () => {
  const { highContrast } = useAccessibility();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replanning state
  const [replanTripId, setReplanTripId] = useState<string | null>(null);
  const [replanReason, setReplanReason] = useState('');
  const [replanning, setReplanning] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.get('/trips');
      setTrips(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip permanently?')) return;
    try {
      await apiClient.delete(`/trips/${id}`);
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip.');
    }
  };

  const handleOpenReplan = (id: string) => {
    setReplanTripId(id);
    setReplanReason('');
  };

  const handleCloseReplan = () => {
    setReplanTripId(null);
  };

  const handleExecuteReplan = async () => {
    if (!replanTripId || !replanReason) return;
    setReplanning(true);
    try {
      const response: any = await apiClient.post(`/trips/${replanTripId}/replan`, { reason: replanReason });
      // Update list
      setTrips(prev => prev.map(t => t.id === replanTripId ? response.data : t));
      handleCloseReplan();
    } catch (err: any) {
      alert(err.message || 'Dynamic replanning failed.');
    } finally {
      setReplanning(false);
    }
  };

  // Helper to color code scores
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success.main';
    if (score >= 75) return 'warning.main';
    return 'error.main';
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', py: 6, backgroundColor: highContrast ? '#000000' : '#030712' }}>
      <Container maxWidth="lg">
        
        {/* HEADER SECTION */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
              Your Saved Trips
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and manage your dynamically engineered smart itineraries.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/planner')}
            startIcon={<FlightTakeoffIcon />}
            sx={{
              fontWeight: 700,
              background: highContrast ? 'none' : 'linear-gradient(45deg, #6366f1 30%, #14b8a6 90%)',
              color: highContrast ? 'primary.main' : '#ffffff',
            }}
          >
            Plan New Trip
          </Button>
        </Box>

        {error && <alert severity="error" sx={{ mb: 4 }}>{error}</alert>}

        {/* TRIPS GRID */}
        {trips.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 10, 
              px: 2, 
              border: '2px dashed', 
              borderColor: 'divider', 
              borderRadius: '24px',
              backgroundColor: 'rgba(255,255,255,0.01)'
            }}
          >
            <FlightTakeoffIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.4, mb: 3 }} />
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              No Itineraries Planned Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Your adventure is waiting! Feed our AI your preferences and get a custom micro-optimized travel experience dynamically mapped instantly.
            </Typography>
            <Button
              variant="filled"
              size="large"
              onClick={() => navigate('/planner')}
              sx={{ fontWeight: 700 }}
            >
              Curate My First Trip
            </Button>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {trips.map((trip) => (
              <Grid item xs={12} md={6} key={trip.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  <CardContent sx={{ p: 4 }}>
                    
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ maxWidth: '75%' }}>
                        <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 0.5 }} noWrap>
                          {trip.title}
                        </Typography>
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                          {trip.source} ➔ {trip.destination}
                        </Typography>
                      </Box>
                      
                      {/* HEALTH SCORE DIAL */}
                      <Tooltip title={`AI Itinerary Health Score: ${trip.scoring?.overallScore || 90}/100`}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress
                            variant="determinate"
                            value={trip.scoring?.overallScore || 90}
                            size={56}
                            thickness={4.5}
                            sx={{ color: getScoreColor(trip.scoring?.overallScore || 90) }}
                          />
                          <Box
                            sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" component="div" sx={{ fontWeight: 800 }}>
                              {trip.scoring?.overallScore || 90}
                            </Typography>
                          </Box>
                        </Box>
                      </Tooltip>
                    </Box>

                    {/* Metadata tags */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                      <Chip label={trip.travelStyle.toUpperCase()} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                      <Chip label={`${trip.numTravelers} ${trip.numTravelers === 1 ? 'Traveler' : 'Travelers'}`} size="small" variant="outlined" />
                      {trip.weatheralerts.length > 0 && (
                        <Chip 
                          label={`${trip.weatheralerts.length} Weather alert${trip.weatheralerts.length > 1 ? 's' : ''}`} 
                          size="small" 
                          color="error" 
                          icon={<ErrorOutlineIcon />} 
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Box>

                    {/* Info stats */}
                    <Grid container spacing={2} sx={{ mb: 3, borderTop: 1, borderBottom: 1, borderColor: 'divider', py: 2 }}>
                      <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonthIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">DATES</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{trip.durationDays} Days ({trip.startDate.split('-').slice(1).join('/')})</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalanceWalletIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">TOTAL BUDGET</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>${trip.totalBudget} USD</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>

                  {/* Actions Bar */}
                  <Box sx={{ px: 4, pb: 4, display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="filled"
                      fullWidth
                      startIcon={<MapIcon />}
                      onClick={() => navigate(`/map/${trip.id}`)}
                      sx={{ 
                        flex: 1.5,
                        backgroundColor: 'primary.main',
                        color: '#000000',
                        fontWeight: 700,
                        '&:hover': { backgroundColor: 'primary.dark' }
                      }}
                    >
                      View Map
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ChatIcon />}
                      onClick={() => navigate(`/copilot/${trip.id}`)}
                      sx={{ flex: 1, fontWeight: 700 }}
                    >
                      Copilot
                    </Button>
                    <Tooltip title="Smart Re-Plan">
                      <IconButton 
                        color="secondary"
                        onClick={() => handleOpenReplan(trip.id)}
                        sx={{ border: 1, borderColor: 'secondary.main', borderRadius: '12px' }}
                      >
                        <CloudSyncIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Trip">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(trip.id)}
                        sx={{ border: 1, borderColor: 'error.main', borderRadius: '12px' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* DYNAMIC REPLAN DIALOG */}
        <Dialog 
          open={replanTripId !== null} 
          onClose={handleCloseReplan}
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: 460,
              backgroundColor: highContrast ? '#000000' : 'rgba(17,24,39,0.95)',
              backdropFilter: 'blur(16px)',
              border: highContrast ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
            }
          }}
        >
          <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, pb: 1 }}>
            Smart Dynamic Re-Plan
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Input any changing constraint (e.g., flight delays, bad weather, or budget constraints). Our AI will selectively re-engineer affected itinerary slots without breaking the rest of your trip!
            </Typography>
            <TextField
              autoFocus
              label="Replanning Reason / Constraint"
              fullWidth
              multiline
              rows={3}
              placeholder="e.g. It is raining heavily tomorrow morning, swap with museum visits."
              value={replanReason}
              onChange={e => setReplanReason(e.target.value)}
              disabled={replanning}
              InputProps={{ sx: { borderRadius: '12px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseReplan} disabled={replanning} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteReplan} 
              disabled={replanning || !replanReason}
              variant="filled"
              startIcon={replanning ? <CircularProgress size={16} /> : <CloudSyncIcon />}
            >
              {replanning ? 'Re-Planning...' : 'Execute Re-Plan'}
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};
