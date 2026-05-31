import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { geminiService } from '../services/geminiService';
import { firestoreService } from '../services/firestoreService';
import { validationResult } from 'express-validator';

export const tripController = {
  // --- CREATE TRIP ---
  async generateTrip(req: AuthenticatedRequest, res: Response) {
    // Validate request body inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const userId = req.user?.uid || 'anonymous-user';
      const {
        source,
        destination,
        startDate,
        endDate,
        totalBudget,
        travelStyle,
        numTravelers,
        interests,
        accessibilityRequired,
      } = req.body;

      console.log(`[TRIP CONTROLLER] Generating trip for user ${userId} to ${destination}`);

      // Call Gemini engine to synthesize the full trip
      const trip = await geminiService.generateTrip({
        userId,
        source,
        destination,
        startDate,
        endDate,
        totalBudget: Number(totalBudget),
        travelStyle: travelStyle || 'balanced',
        numTravelers: Number(numTravelers) || 1,
        interests: interests || [],
        accessibilityRequired: !!accessibilityRequired,
      });

      // Save trip in firestore persistent layer
      await firestoreService.saveTrip(trip);

      res.status(201).json({
        success: true,
        message: 'Trip generated successfully!',
        data: trip,
      });
    } catch (error: any) {
      console.error('[TRIP CONTROLLER ERROR] generateTrip failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate itinerary. Please try again.',
      });
    }
  },

  // --- GET ALL USER TRIPS ---
  async getUserTrips(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.uid || 'anonymous-user';
      const trips = await firestoreService.getUserTrips(userId);
      res.status(200).json({
        success: true,
        data: trips,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- GET SINGLE TRIP ---
  async getTripDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const trip = await firestoreService.getTrip(id);

      if (!trip) {
        return res.status(404).json({ success: false, error: 'Trip not found.' });
      }

      // Secure data verification
      const userId = req.user?.uid || 'anonymous-user';
      if (trip.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Access forbidden: unauthorized trip resource.' });
      }

      res.status(200).json({
        success: true,
        data: trip,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- DYNAMIC REPLANNING ---
  async replanTrip(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ success: false, error: 'A valid replanning trigger/reason is required.' });
      }

      const trip = await firestoreService.getTrip(id);
      if (!trip) {
        return res.status(404).json({ success: false, error: 'Trip not found.' });
      }

      // Secure check
      const userId = req.user?.uid || 'anonymous-user';
      if (trip.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Forbidden access to this trip.' });
      }

      console.log(`[TRIP CONTROLLER] Dynamic replanning active for trip ${id} - Reason: "${reason}"`);

      // Invoke the Gemini AI replanner
      const updatedTrip = await geminiService.replanTrip(trip, reason);

      // Save the updated trip back
      await firestoreService.saveTrip(updatedTrip);

      res.status(200).json({
        success: true,
        message: 'Trip re-planned dynamically!',
        data: updatedTrip,
      });
    } catch (error: any) {
      console.error('[TRIP CONTROLLER ERROR] replanTrip failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- DELETE TRIP ---
  async deleteTrip(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const trip = await firestoreService.getTrip(id);

      if (!trip) {
        return res.status(404).json({ success: false, error: 'Trip not found.' });
      }

      const userId = req.user?.uid || 'anonymous-user';
      if (trip.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      await firestoreService.deleteTrip(id);
      res.status(200).json({
        success: true,
        message: 'Trip deleted successfully.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
