import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateUser } from '../middleware/authMiddleware';
import { apiLimiter } from '../middleware/rateLimiter';
import { tripController } from '../controllers/tripController';
import { chatController } from '../controllers/chatController';
import { weatherService } from '../services/weatherService';

const router = Router();

// Apply rate limiting & auth globally to all operational endpoints
router.use(apiLimiter);
router.use(authenticateUser);

// --- WEATHER ENDPOINTS ---
router.get('/weather/forecast', async (req, res, next) => {
  try {
    const { destination, days } = req.query;
    if (!destination) {
      return res.status(400).json({ success: false, error: 'destination is required as a query parameter' });
    }
    const forecast = await weatherService.getForecast(String(destination), Number(days) || 7);
    return res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
});

// --- TRIP OPERATION ENDPOINTS ---
router.post(
  '/trips',
  [
    body('source').notEmpty().withMessage('Source city is required').trim(),
    body('destination').notEmpty().withMessage('Destination city is required').trim(),
    body('startDate').isISO8601().withMessage('Start date must be a valid YYYY-MM-DD date'),
    body('endDate').isISO8601().withMessage('End date must be a valid YYYY-MM-DD date'),
    body('totalBudget').isNumeric().withMessage('Budget must be a number'),
    body('travelStyle')
      .isIn(['budget', 'balanced', 'luxury', 'adventure'])
      .withMessage('Travel style must be budget, balanced, luxury, or adventure'),
    body('numTravelers').isInt({ min: 1 }).withMessage('Travelers must be a positive integer'),
  ],
  tripController.generateTrip
);

router.get('/trips', tripController.getUserTrips);
router.get('/trips/:id', tripController.getTripDetails);
router.post('/trips/:id/replan', tripController.replanTrip);
router.delete('/trips/:id', tripController.deleteTrip);

// --- CHAT COPILOT ENDPOINTS ---
router.get('/chat/:tripId', chatController.getChatHistory);
router.post('/chat/:tripId', chatController.sendMessage);

export default router;
