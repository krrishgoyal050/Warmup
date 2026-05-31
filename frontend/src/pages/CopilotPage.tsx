import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  TextField, 
  Button, 
  Chip, 
  CircularProgress,
  Avatar,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import MapIcon from '@mui/icons-material/Map';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import apiClient from '../services/api';
import { Trip, ChatThread, ChatMessage } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';

const MOCK_PROMPTS = [
  'What should I do tomorrow?',
  'Find vegetarian restaurants nearby.',
  'Is the weather suitable for trekking?',
  'Replan Day 2 due to heavy rain.'
];

export const CopilotPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { highContrast } = useAccessibility();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadChatAndTrip = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // Load Trip Context
        const tripRes: any = await apiClient.get(`/trips/${id}`);
        setTrip(tripRes.data);

        // Load Chat History
        const chatRes: any = await apiClient.get(`/chat/${id}`);
        const thread: ChatThread = chatRes.data;
        setMessages(thread.messages || []);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize chat thread.');
      } finally {
        setLoading(false);
      }
    };

    loadChatAndTrip();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !id || sending) return;

    setSending(true);
    setInputText('');

    // Append local user message immediately
    const userMsg: ChatMessage = {
      id: `local-temp-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response: any = await apiClient.post(`/chat/${id}`, { text: textToSend });
      // Update thread with real backend payload
      const thread: ChatThread = response.data.thread;
      setMessages(thread.messages);

      // If user queried a replan and trip was altered, sync trip state
      if (textToSend.toLowerCase().includes('replan') || textToSend.toLowerCase().includes('replace')) {
        const tripRes: any = await apiClient.get(`/trips/${id}`);
        setTrip(tripRes.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send query.');
    } finally {
      setSending(false);
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
        <Typography variant="h3" sx={{ mb: 2 }}>Error loading copilot context.</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', backgroundColor: highContrast ? '#000000' : '#030712', py: 4 }}>
      <Container maxWidth="md">
        
        {/* HUD META CONTROLS */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={() => navigate('/dashboard')} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                AI Travel Copilot Chat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conversational assistant for **{trip.destination}**
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<MapIcon />}
            onClick={() => navigate(`/map/${trip.id}`)}
            sx={{ borderRadius: '10px' }}
          >
            Open Map View
          </Button>
        </Box>

        {/* CHAT BOARD */}
        <Card sx={{ height: '65vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Messages Timeline */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <Box 
                  key={msg.id}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: isAi ? 'row' : 'row-reverse', 
                    alignItems: 'flex-start',
                    gap: 1.5
                  }}
                >
                  <Avatar sx={{ bgcolor: isAi ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
                    {isAi ? <SmartToyIcon sx={{ color: '#000000' }} /> : <PersonIcon sx={{ color: '#000000' }} />}
                  </Avatar>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      maxWidth: '75%', 
                      borderRadius: '16px',
                      borderTopLeftRadius: isAi ? '4px' : '16px',
                      borderTopRightRadius: isAi ? '16px' : '4px',
                      backgroundColor: isAi 
                        ? (highContrast ? '#050505' : 'rgba(255,255,255,0.02)') 
                        : (highContrast ? '#111111' : 'rgba(99, 102, 241, 0.08)'),
                      border: highContrast ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, textAlign: 'right', fontSize: '0.65rem' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}
            
            {sending && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  <SmartToyIcon sx={{ color: '#000000' }} />
                </Avatar>
                <Paper sx={{ p: 2, borderRadius: '16px', borderTopLeftRadius: '4px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={16} color="primary" />
                    <Typography variant="body2" color="text.secondary">Copilot is writing...</Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Action inputs */}
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Context prompts */}
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.5 }}>
              {MOCK_PROMPTS.map((promptText, idx) => (
                <Chip
                  key={idx}
                  label={promptText}
                  onClick={() => handleSend(promptText)}
                  disabled={sending}
                  sx={{ 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: '#000000'
                    }
                  }}
                />
              ))}
            </Box>

            {/* Form submit */}
            <Box 
              component="form" 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
              sx={{ display: 'flex', gap: 1.5 }}
            >
              <TextField
                placeholder="Ask your copilot anything about restaurants, treks, or replanning..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={sending}
                fullWidth
                variant="outlined"
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={sending || !inputText.trim()}
                sx={{ borderRadius: '12px', px: 3 }}
              >
                <SendIcon />
              </Button>
            </Box>

          </Box>
        </Card>

      </Container>
    </Box>
  );
};
