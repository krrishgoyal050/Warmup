import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { firestoreService } from '../services/firestoreService';
import { geminiService } from '../services/geminiService';
import { ChatThread, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const chatController = {
  // --- FETCH CHAT THREAD ---
  async getChatHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { tripId } = req.params;
      const userId = req.user?.uid || 'anonymous-user';

      // Find an existing thread for this trip
      let thread = await firestoreService.getChatThreadByTrip(userId, tripId);

      if (!thread) {
        // Create a new default chat session thread
        thread = {
          id: uuidv4(),
          userId,
          tripId,
          messages: [
            {
              id: uuidv4(),
              sender: 'ai',
              text: `Welcome to your AI Travel Copilot! 🌟 I have reviewed your active itinerary details. Ask me anything about your destination, local restaurants, or type "replan for weather" to adapt to storm forecasts. How can I help you today?`,
              timestamp: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
        await firestoreService.saveChatThread(thread);
      }

      res.status(200).json({
        success: true,
        data: thread,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- SEND MESSAGE & GET COPILOT REPLY ---
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { tripId } = req.params;
      const { text } = req.body;
      const userId = req.user?.uid || 'anonymous-user';

      if (!text) {
        return res.status(400).json({ success: false, error: 'Message content text is required.' });
      }

      // Fetch or initialize chat thread
      let thread = await firestoreService.getChatThreadByTrip(userId, tripId);
      if (!thread) {
        thread = {
          id: uuidv4(),
          userId,
          tripId,
          messages: [],
          updatedAt: new Date().toISOString(),
        };
      }

      // Fetch trip details for AI context
      const trip = await firestoreService.getTrip(tripId);

      // Append user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'user',
        text,
        timestamp: new Date().toISOString(),
      };
      thread.messages.push(userMessage);

      // Ask Gemini for copilot recommendations
      const copilotResponse = await geminiService.chatCopilot(trip, thread.messages.slice(0, -1), text);

      // Append AI response
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'ai',
        text: copilotResponse,
        timestamp: new Date().toISOString(),
      };
      thread.messages.push(aiMessage);

      // Save updated thread
      thread.updatedAt = new Date().toISOString();
      await firestoreService.saveChatThread(thread);

      res.status(200).json({
        success: true,
        data: {
          thread,
          reply: aiMessage,
        },
      });
    } catch (error: any) {
      console.error('[CHAT CONTROLLER ERROR] sendMessage failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
