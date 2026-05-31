import { geminiService } from '../src/services/geminiService';
import { Trip } from '../src/types';

describe('Trip Scoring & Budget Engine Tests', () => {

  test('calculateDefaultBudget splits budget correctly according to Travel Styles', () => {
    const totalBudget = 3000;
    
    // Test Budget Style
    const budgetStyleAlloc = geminiService.calculateDefaultBudget(totalBudget, 'budget');
    expect(budgetStyleAlloc.accommodation).toBe(Math.round(totalBudget * 0.35));
    expect(budgetStyleAlloc.food).toBe(Math.round(totalBudget * 0.25));
    expect(budgetStyleAlloc.transport).toBe(Math.round(totalBudget * 0.25));
    expect(budgetStyleAlloc.activities).toBe(Math.round(totalBudget * 0.15));

    // Test Luxury Style
    const luxuryStyleAlloc = geminiService.calculateDefaultBudget(totalBudget, 'luxury');
    expect(luxuryStyleAlloc.accommodation).toBe(Math.round(totalBudget * 0.5));
    expect(luxuryStyleAlloc.transport).toBe(Math.round(totalBudget * 0.1));
  });

  test('generateMockTrip populates valid trip properties and dates', () => {
    const params = {
      userId: 'test-user-123',
      source: 'New York',
      destination: 'Paris',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      totalBudget: 2500,
      travelStyle: 'balanced' as const,
      numTravelers: 2,
      interests: ['Museums', 'Food & Dining'],
      accessibilityRequired: true,
    };

    const trip: Trip = geminiService.generateMockTrip(params, 3);
    
    expect(trip.userId).toBe('test-user-123');
    expect(trip.destination).toBe('Paris');
    expect(trip.durationDays).toBe(3);
    expect(trip.itinerary.length).toBe(3);
    expect(trip.itinerary[0].date).toBe('2026-06-01');
    expect(trip.itinerary[1].date).toBe('2026-06-02');
    
    // Verify first day has arrival shuttle & hotels
    const firstDayActs = trip.itinerary[0].activities;
    expect(firstDayActs.some(a => a.category === 'transport')).toBe(true);
    expect(firstDayActs.some(a => a.category === 'accommodation')).toBe(true);
  });

  test('executeMockReplanning reacts dynamically to weather events', () => {
    const params = {
      userId: 'test-user-123',
      source: 'New York',
      destination: 'Paris',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      totalBudget: 2500,
      travelStyle: 'balanced' as const,
      numTravelers: 2,
      interests: ['Museums'],
      accessibilityRequired: false,
    };

    const initialTrip = geminiService.generateMockTrip(params, 3);
    
    // Inject weather conflict on Day 2 morning activity
    initialTrip.itinerary[1].activities[0].weatherRecommendation = 'outdoor';

    const replannedTrip = geminiService.replanTrip(initialTrip, 'Inclement weather: heavy rain predicted for tomorrow morning');
    
    return replannedTrip.then((tripResult) => {
      const replannedDay2FirstAct = tripResult.itinerary[1].activities[0];
      // Assert outdoor activity has been shifted safely to indoor gallery
      expect(replannedDay2FirstAct.name).toContain('Fine Arts Gallery');
      expect(replannedDay2FirstAct.weatherRecommendation).toBe('indoor');
    });
  });

});
