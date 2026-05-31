import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Grid, 
  Slider, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Fade
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
// SendIcon removed – unused
import InfoIcon from '@mui/icons-material/Info';
import apiClient from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';

const AVAILABLE_INTERESTS = [
  'Museums', 'Nature & Parks', 'Food & Dining', 'Shopping', 
  'Historic Landmarks', 'Beaches', 'Nightlife', 'Family Friendly',
  'Art Galleries', 'Adventure Sports', 'Local Culture', 'Cafes'
];

export const PlannerPage: React.FC = () => {
  const { highContrast } = useAccessibility();
  const navigate = useNavigate();

  // Inputs state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState<number>(1500);
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [numTravelers, setNumTravelers] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [accessibilityRequired, setAccessibilityRequired] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Loading animations text cycles
  const loadingSteps = [
    'Authenticating requests securely...',
    'Consulting Gemini 2.5 Pro models...',
    'Querying Google Places data for popular spots...',
    'Plotting coordinates and daily directions...',
    'Running cost optimization & budget allocation...',
    'Calculating travel efficiency scoring metrics...',
    'Structuring complete response payload...'
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination || !startDate || !endDate) {
      return setError('Please fill in all primary travel inputs.');
    }

    setLoading(true);
    setLoadingStep(0);
    setError(null);

    try {
      const payload = {
        source,
        destination,
        startDate,
        endDate,
        totalBudget: budget,
        travelStyle,
        numTravelers,
        interests: selectedInterests,
        accessibilityRequired,
      };

      const response: any = await apiClient.post('/trips', payload);
      const generatedTrip = response.data;
      
      // Redirect to map details of the generated trip
      navigate(`/map/${generatedTrip.id}`);
    } catch (err: any) {
      setError(err.message || 'Itinerary generation encountered an error. Please try again.');
      setLoading(false);
    }
  };

  // Render Premium Loader
  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: 'calc(100vh - 64px)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: highContrast ? '#000000' : '#030712',
          px: 3,
          textAlign: 'center'
        }}
      >
        <CircularProgress size={80} thickness={4} color="primary" sx={{ mb: 4 }} />
        <Fade in={true} key={loadingStep} timeout={500}>
          <Box>
            <Typography variant="h3" sx={{ mb: 1.5, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              Engineering Your Adventure ✨
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', maxWidth: 400 }}>
              {loadingSteps[loadingStep]}
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', py: 6, backgroundColor: highContrast ? '#000000' : '#030712' }}>
      <Container maxWidth="md">
        
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 1.5 }}>
            Plan Your Next Expedition
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Feed our artificial intelligence your parameters. We will fetch local places, optimize your budget, and draft a high-fidelity roadmap instantly.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>{error}</Alert>}

        {/* Plan Card */}
        <Card component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 4 } }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* Row 1: Source & Destination */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Starting Location (City / Airport)"
                  placeholder="e.g. San Francisco, USA"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  required
                  fullWidth
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Destination Location (City / Country)"
                  placeholder="e.g. Paris, France"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  required
                  fullWidth
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>

            {/* Row 2: Dates */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>

            {/* Row 3: Travelers & Style */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Number of Travelers"
                  type="number"
                  value={numTravelers}
                  onChange={e => setNumTravelers(Math.max(1, Number(e.target.value)))}
                  required
                  fullWidth
                  InputProps={{ inputProps: { min: 1 }, sx: { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="travel-style-label">Travel Style</InputLabel>
                  <Select
                    labelId="travel-style-label"
                    value={travelStyle}
                    label="Travel Style"
                    onChange={e => setTravelStyle(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="budget">Budget (Focus on savings)</MenuItem>
                    <MenuItem value="balanced">Balanced (Great compromise)</MenuItem>
                    <MenuItem value="luxury">Luxury (First class treatments)</MenuItem>
                    <MenuItem value="adventure">Adventure (High energy events)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Budget Slider */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                Total Target Budget: <Box component="span" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '1.25rem' }}>${budget} USD</Box>
              </Typography>
              <Slider
                value={budget}
                onChange={(_e, val) => setBudget(val as number)}
                min={200}
                max={15000}
                step={100}
                valueLabelDisplay="auto"
                sx={{
                  color: 'primary.main',
                  height: 6,
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                    backgroundColor: '#ffffff',
                    border: '3px solid currentColor',
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">$200</Typography>
                <Typography variant="caption" color="text.secondary">$15,000</Typography>
              </Box>
            </Box>

            {/* Interest chips */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                Travel Interests (Select all that apply)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <Chip
                      key={interest}
                      label={interest}
                      onClick={() => handleInterestToggle(interest)}
                      variant={isSelected ? 'filled' : 'outlined'}
                      color={isSelected ? 'primary' : 'default'}
                      sx={{ 
                        borderRadius: '8px', 
                        fontWeight: 600,
                        backgroundColor: isSelected && !highContrast ? 'primary.main' : undefined,
                        color: isSelected && !highContrast ? '#000000' : undefined,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Accessibility Checkbox */}
            <Box 
              onClick={() => setAccessibilityRequired(prev => !prev)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                p: 2, 
                borderRadius: '12px', 
                border: '1px solid',
                borderColor: accessibilityRequired ? 'primary.main' : 'divider',
                backgroundColor: accessibilityRequired && !highContrast ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <InfoIcon sx={{ color: accessibilityRequired ? 'primary.main' : 'text.secondary' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Require Accessibility-Friendly Locations
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Forces AI to prioritize attractions and dining spots verified to support wheel-chair ramps and screen-reader systems.
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Chip 
                  label={accessibilityRequired ? 'ENABLED' : 'DISABLED'} 
                  size="small" 
                  color={accessibilityRequired ? 'primary' : 'default'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<FlightTakeoffIcon />}
              sx={{ 
                py: 1.75, 
                fontWeight: 800,
                fontSize: '1.05rem',
                background: highContrast ? 'none' : 'linear-gradient(45deg, #6366f1 30%, #14b8a6 90%)',
                color: highContrast ? 'primary.main' : '#ffffff',
                '&:hover': {
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Synthesize Smart Itinerary
            </Button>

          </CardContent>
        </Card>

      </Container>
    </Box>
  );
};
