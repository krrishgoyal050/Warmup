import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { Trip, ItineraryDay, Activity, UserProfile, ChatMessage } from '../types';
import { mapsService } from './mapsService';
import { weatherService } from './weatherService';
import { v4 as uuidv4 } from 'uuid';

// Initialize the Gemini API client if API key is provided
let aiModel: any = null;
try {
  if (!config.gemini.isMock) {
    const ai = new GoogleGenerativeAI(config.gemini.apiKey);
   aiModel = ai.getGenerativeModel({
     model: 'gemini-1.5-pro'
    console.log('[GEMINI SERVICE] Connected to Gemini API successfully.');
  } else {
    console.log('[GEMINI SERVICE] Running in mock/simulation mode. Procedural AI generation active.');
  }
} catch (error) {
  console.warn('[GEMINI SERVICE INIT WARNING] Could not initialize Gemini SDK. Bypassing to mock mode.', error);
}

// System prompt to guide Gemini's travel creation
const TRIP_GENERATION_SYSTEM_INSTRUCTION = `
You are an expert, enterprise-grade AI Travel Planner. Your job is to generate highly optimized, premium travel itineraries in JSON format.
You must carefully consider the user's travel preferences, dates, budget, interests, dietary restrictions, and travel style.

You must strictly output a valid JSON object matching this schema:
{
  "title": "String - compelling title for the trip",
  "budgetBreakdown": {
    "accommodation": number (USD),
    "food": number (USD),
    "transport": number (USD),
    "activities": number (USD),
    "unallocated": number (USD)
  },
  "scoring": {
    "overallScore": number (0-100),
    "budgetFit": number (0-100),
    "efficiency": number (0-100),
    "diversity": number (0-100),
    "preferenceMatch": number (0-100)
  },
  "itinerary": [
    {
      "dayNumber": number,
      "date": "YYYY-MM-DD",
      "dailyRouteSummary": "String describing the flow of the day",
      "activities": [
        {
          "name": "String",
          "description": "Detailed description of what to do, history, and tips",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "cost": number (USD),
          "category": "accommodation" | "food" | "transport" | "activity",
          "location": {
            "lat": number,
            "lng": number,
            "address": "String address",
            "placeId": "String"
          },
          "accessibilityFriendly": boolean,
          "weatherRecommendation": "outdoor" | "indoor" | "flexible"
        }
      ]
    }
  ]
}

Guidelines for Itineraries:
1. Day 1: Start with a transport activity from the arrival station/airport to the accommodation, and check-in to accommodation (which is listed as category "accommodation" and costs part of the accommodation budget).
2. Schedule logical progression of activities: Morning (9:00 - 12:00), Lunch/Cafe (12:30 - 14:00), Afternoon (14:30 - 18:00), Dinner (19:00 - 21:00).
3. Do NOT exceed the total budget. Keep costs realistic.
4. Calculate lat/lng accurately based on actual geography of the destination city.
5. Set weatherRecommendation properly. Indoor for museums/galleries, outdoor for parks/monuments.
6. Ensure accessibilityFriendly is set based on user needs.
`;

export const geminiService = {
  // --- TRIP GENERATION ENGINE ---
  async generateTrip(params: {
    userId: string;
    source: string;
    destination: string;
    startDate: string;
    endDate: string;
    totalBudget: number;
    travelStyle: 'budget' | 'balanced' | 'luxury' | 'adventure';
    numTravelers: number;
    interests: string[];
    accessibilityRequired: boolean;
  }): Promise<Trip> {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    if (config.gemini.isMock || !aiModel) {
      // Simulate real AI network lag
      await new Promise(r => setTimeout(r, 1000));
      return this.generateMockTrip(params, durationDays);
    }

    try {
      const userPrompt = `
      Plan a ${durationDays}-day trip from "${params.source}" to "${params.destination}".
      Dates: ${params.startDate} to ${params.endDate}.
      Number of Travelers: ${params.numTravelers}.
      Total Budget: $${params.totalBudget} USD.
      Travel Style: ${params.travelStyle} (allocate budget properly).
      Interests: ${params.interests.join(', ')}.
      Accessibility Required: ${params.accessibilityRequired ? 'YES' : 'NO'}.
      
      Generate a premium itinerary with highly engaging, non-trivial descriptions. Use the exact JSON format requested in system instructions.
      `;

      const response = await aiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          systemInstruction: TRIP_GENERATION_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response');
      }

      const generatedJson = JSON.parse(responseText);

      // Fetch weather data for destination
      const weatherForecast = await weatherService.getForecast(params.destination, durationDays);
      const weatherAlerts = weatherService.generateWeatherAlerts(weatherForecast);

      // Create full Trip object
      const trip: Trip = {
        id: uuidv4(),
        userId: params.userId,
        title: generatedJson.title || `Amazing Trip to ${params.destination}`,
        source: params.source,
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        durationDays,
        totalBudget: params.totalBudget,
        travelStyle: params.travelStyle,
        numTravelers: params.numTravelers,
        budgetBreakdown: generatedJson.budgetBreakdown || this.calculateDefaultBudget(params.totalBudget, params.travelStyle),
        scoring: generatedJson.scoring || {
          overallScore: 85,
          budgetFit: 90,
          efficiency: 80,
          diversity: 85,
          preferenceMatch: 85,
        },
        itinerary: (generatedJson.itinerary || []).map((day: any, dIdx: number) => ({
          dayNumber: day.dayNumber || (dIdx + 1),
          date: day.date || this.offsetDate(params.startDate, dIdx),
          dailyRouteSummary: day.dailyRouteSummary || 'Explore city highlights.',
          activities: (day.activities || []).map((act: any) => ({
            id: uuidv4(),
            name: act.name,
            description: act.description,
            startTime: act.startTime,
            endTime: act.endTime,
            cost: act.cost,
            category: act.category,
            location: {
              lat: act.location?.lat || 0,
              lng: act.location?.lng || 0,
              address: act.location?.address || 'City Center',
              placeId: act.location?.placeId || 'ch_default',
            },
            accessibilityFriendly: act.accessibilityFriendly !== undefined ? act.accessibilityFriendly : true,
            weatherRecommendation: act.weatherRecommendation || 'flexible',
            scoreContribution: act.scoreContribution || 10,
          })),
        })),
        weatherAlerts,
        createdAt: new Date().toISOString(),
      };

      return trip;
    } catch (error) {
      console.error('[GEMINI SERVICE ERROR] Live generation failed, falling back to mock:', error);
      return this.generateMockTrip(params, durationDays);
    }
  },

  // --- SMART REPLANNING ENGINE ---
  async replanTrip(trip: Trip, reason: string): Promise<Trip> {
    if (config.gemini.isMock || !aiModel) {
      await new Promise(r => setTimeout(r, 800));
      return this.executeMockReplanning(trip, reason);
    }

    try {
      const userPrompt = `
      We have an existing trip to "${trip.destination}" with this itinerary:
      ${JSON.stringify(trip.itinerary, null, 2)}
      
      We need to dynamically re-plan this trip because of this event/reason: "${reason}".
      Instructions:
      1. ONLY modify the portions of the itinerary affected by the reason.
      2. If it is a weather issue (like rain), replace outdoor activities with indoor ones (e.g. museums, cafes, library, indoor market) during the storm hours.
      3. If budget is exceeded, replace expensive activities with lower cost or free alternatives, adjusting the budgetBreakdown and score.
      4. Keep all other intact components identical.
      5. Output the FULL updated Trip object in the exact JSON format matching the schema.
      `;

      const response = await aiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          systemInstruction: TRIP_GENERATION_SYSTEM_INSTRUCTION,
          temperature: 0.3, // Lower temp for more deterministic edits
        },
      });

      const responseText = response.text;
      if (!responseText) throw new Error('Replanning response empty');
      const generatedJson = JSON.parse(responseText);

      // Re-evaluate weather alerts
      const weatherForecast = await weatherService.getForecast(trip.destination, trip.durationDays);
      const weatherAlerts = weatherService.generateWeatherAlerts(weatherForecast);

      // Merge and return updated trip
      return {
        ...trip,
        title: generatedJson.title || trip.title,
        budgetBreakdown: generatedJson.budgetBreakdown || trip.budgetBreakdown,
        scoring: generatedJson.scoring || trip.scoring,
        itinerary: generatedJson.itinerary.map((day: any) => ({
          ...day,
          activities: day.activities.map((act: any) => ({
            ...act,
            id: act.id || uuidv4(),
          })),
        })),
        weatherAlerts,
      };
    } catch (error) {
      console.error('[GEMINI SERVICE ERROR] Replanning failed, falling back to mock:', error);
      return this.executeMockReplanning(trip, reason);
    }
  },

  // --- COPILOT CONVERSATIONAL AGENT ---
  async chatCopilot(trip: Trip | null, messageHistory: ChatMessage[], newQuery: string): Promise<string> {
    if (config.gemini.isMock || !aiModel) {
      await new Promise(r => setTimeout(r, 600));
      return this.generateMockChatResponse(trip, newQuery);
    }

    try {
      const historyPrompt = messageHistory.map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
      
      const contextPrompt = trip 
        ? `You are an AI Travel Copilot assisting the user on their trip to "${trip.destination}" (Dates: ${trip.startDate} to ${trip.endDate}).
           Active Itinerary: ${JSON.stringify(trip.itinerary, null, 2)}
           Weather Alerts: ${JSON.stringify(trip.weatherAlerts)}`
        : 'You are an AI Travel Copilot assisting the user in planning their next vacation.';

      const prompt = `
      ${contextPrompt}
      
      Conversation History:
      ${historyPrompt}
      
      User's message: "${newQuery}"
      
      Provide a highly helpful, concise, friendly, and practical answer. If the user asks for restaurant, hotel, or attraction recommendations, provide specific real-world recommendations suited for their active travel destination.
      `;

      const response = await aiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        },
      });

      return response.text || "I'm sorry, I encountered an issue processing your query. How can I help you today?";
    } catch (error) {
      console.error('[GEMINI SERVICE ERROR] Chat copilot failed, using mock response:', error);
      return this.generateMockChatResponse(trip, newQuery);
    }
  },

  // --- MOCK AND GENERATIVE FALLBACK ALGORITHMS ---
  generateMockTrip(
    params: {
      userId: string;
      source: string;
      destination: string;
      startDate: string;
      endDate: string;
      totalBudget: number;
      travelStyle: 'budget' | 'balanced' | 'luxury' | 'adventure';
      numTravelers: number;
      interests: string[];
      accessibilityRequired: boolean;
    },
    durationDays: number
  ): Trip {
    const key = params.destination.toLowerCase().replace(/[^a-z]/g, '');
    const center = mapsService.getCityCenterCoords(params.destination);
    
    // Seed points nearby
    const points = [
      { name: 'Gourmet Local Dining', address: `${params.destination} Culinary Center`, cat: 'food', cost: 30, desc: 'Indulge in a multi-course culinary experience celebrating native ingredients and authentic local preparation methods.' },
      { name: 'Central Boulevard Explorer', address: `${params.destination} Old Market`, cat: 'activity', cost: 15, desc: 'A leisure walking path across the historical architecture and cultural monuments lining the primary avenue.' },
      { name: 'Panoramic Observatory Deck', address: `${params.destination} Skyline View`, cat: 'activity', cost: 40, desc: 'Capture breathtaking scenic views of the landscape from the premium observation floor. Features audio guides.' },
      { name: 'Artisan Cafe & Roasters', address: `${params.destination} Coffee Quarter`, cat: 'food', cost: 12, desc: 'Relax with freshly roasted specialty coffee blends and delightful hand-made organic pastries in a charming setting.' },
      { name: 'Scenic Park & Botanic Walk', address: `${params.destination} Green Sanctuary`, cat: 'activity', cost: 0, desc: 'Unwind in beautifully landscaped gardens, peaceful fountains, and exotic flora right in the heart of the city.' },
      { name: 'National Treasury Museum', address: `${params.destination} Heritage Hub`, cat: 'activity', cost: 25, desc: 'Explore historical antiquities, royal collections, and curated exhibits of prehistoric and contemporary art.' },
    ];

    const itinerary: ItineraryDay[] = [];
    const budgetAlloc = this.calculateDefaultBudget(params.totalBudget, params.travelStyle);

    for (let day = 1; day <= durationDays; day++) {
      const date = this.offsetDate(params.startDate, day - 1);
      const activities: Activity[] = [];

      if (day === 1) {
        // Day 1 Arrival & Check-In
        activities.push({
          id: uuidv4(),
          name: 'Arrival & Welcome Transit',
          description: `Arrival in ${params.destination}. Private shuttle transport to check in and settle at your premium accommodation base.`,
          startTime: '10:00',
          endTime: '11:00',
          cost: Math.round(budgetAlloc.transport / durationDays * 0.4),
          category: 'transport',
          location: { lat: center.lat + 0.02, lng: center.lng + 0.02, address: `${params.destination} Airport Station`, placeId: 'mock_airport' },
          accessibilityFriendly: true,
          weatherRecommendation: 'string',
          scoreContribution: 8,
        });

        activities.push({
          id: uuidv4(),
          name: 'Premium Stay Check-In',
          description: `Settle into your accommodation. Relax, unpack, and orient yourself for the upcoming adventure.`,
          startTime: '12:00',
          endTime: '13:30',
          cost: Math.round(budgetAlloc.accommodation / durationDays),
          category: 'accommodation',
          location: { lat: center.lat, lng: center.lng, address: `${params.destination} Lodging Center`, placeId: 'mock_hotel' },
          accessibilityFriendly: true,
          weatherRecommendation: 'string',
          scoreContribution: 10,
        });
      }

      // Populate typical morning, lunch, afternoon, dinner cycles
      const dayPoints = points.slice((day - 1) * 2 % points.length, ((day - 1) * 2 + 2) % points.length || points.length);
      
      // Morning activity
      activities.push({
        id: uuidv4(),
        name: dayPoints[0].name,
        description: dayPoints[0].desc,
        startTime: '09:30',
        endTime: '12:00',
        cost: dayPoints[0].cost,
        category: dayPoints[0].cat as any,
        location: { lat: center.lat - 0.012 * day, lng: center.lng + 0.008 * day, address: dayPoints[0].address, placeId: `mock_pt_${day}_1` },
        accessibilityFriendly: !params.accessibilityRequired || Math.random() > 0.1,
        weatherRecommendation: day === 2 ? 'indoor' : 'outdoor', // seed indoor for weather rain test on day 2
        scoreContribution: 12,
      });

      // Lunch
      activities.push({
        id: uuidv4(),
        name: 'Delightful Artisan Lunch',
        description: 'Taste signature regional dishes at a curated dining establishment known for organic local sourcing.',
        startTime: '12:30',
        endTime: '14:00',
        cost: Math.round(budgetAlloc.food / durationDays * 0.4),
        category: 'food',
        location: { lat: center.lat + 0.005 * day, lng: center.lng - 0.005 * day, address: `${params.destination} Bistro Street`, placeId: `mock_lunch_${day}` },
        accessibilityFriendly: true,
        weatherRecommendation: 'string',
        scoreContribution: 9,
      });

      // Afternoon activity
      activities.push({
        id: uuidv4(),
        name: dayPoints[1].name,
        description: dayPoints[1].desc,
        startTime: '14:30',
        endTime: '17:30',
        cost: dayPoints[1].cost,
        category: dayPoints[1].cat as any,
        location: { lat: center.lat + 0.015 * day, lng: center.lng + 0.012 * day, address: dayPoints[1].address, placeId: `mock_pt_${day}_2` },
        accessibilityFriendly: true,
        weatherRecommendation: 'string',
        scoreContribution: 15,
      });

      // Dinner
      activities.push({
        id: uuidv4(),
        name: 'Gourmet Dinner Experience',
        description: 'Enjoy a stellar evening dinner overlooking beautiful urban backdrops, featuring chef specials.',
        startTime: '19:00',
        endTime: '21:00',
        cost: Math.round(budgetAlloc.food / durationDays * 0.6),
        category: 'food',
        location: { lat: center.lat - 0.003 * day, lng: center.lng + 0.003 * day, address: `${params.destination} High Street Dining`, placeId: `mock_dinner_${day}` },
        accessibilityFriendly: true,
        weatherRecommendation: 'string',
        scoreContribution: 11,
      });

      itinerary.push({
        dayNumber: day,
        date,
        dailyRouteSummary: `Start with checks-in, explore cultural treasures at ${dayPoints[0].name}, followed by rich culinary lunch and afternoon stroll around ${dayPoints[1].name}.`,
        activities,
      });
    }

    const weatherForecast = [
      { date: params.startDate, tempDay: 22, tempNight: 14, condition: 'clear' as const, description: 'Sunny', humidity: 50, windSpeed: 2 },
      { date: this.offsetDate(params.startDate, 1), tempDay: 17, tempNight: 12, condition: 'rain' as const, description: 'Heavy Rainfall', humidity: 90, windSpeed: 7 },
    ];
    const weatherAlerts = weatherService.generateWeatherAlerts(weatherForecast);

    return {
      id: uuidv4(),
      userId: params.userId,
      title: `Intelligent Discovery of ${params.destination}`,
      source: params.source,
      destination: params.destination,
      startDate: params.startDate,
      endDate: params.endDate,
      durationDays,
      totalBudget: params.totalBudget,
      travelStyle: params.travelStyle,
      numTravelers: params.numTravelers,
      budgetBreakdown: budgetAlloc,
      scoring: {
        overallScore: 92,
        budgetFit: 96,
        efficiency: 88,
        diversity: 94,
        preferenceMatch: 90,
      },
      itinerary,
      weatherAlerts,
      createdAt: new Date().toISOString(),
    };
  },

  executeMockReplanning(trip: Trip, reason: string): Trip {
    console.log(`[GEMINI SERVICE MOCK] Executing replanning for reason: "${reason}"`);
    const reasonLower = reason.toLowerCase();
    
    // Copy the itinerary to modify
    const updatedItinerary = trip.itinerary.map(day => {
      // If we are replanning due to rain/weather, target day 2 (where we simulated rain)
      const isDay2 = day.dayNumber === 2;
      const isWeatherIssue = reasonLower.includes('rain') || reasonLower.includes('weather') || reasonLower.includes('storm');

      if (isWeatherIssue && isDay2) {
        return {
          ...day,
          dailyRouteSummary: 'RE-PLANNED FOR WEATHER: Replaced outdoor spots with high-fidelity indoor museum visits and cozy tea room lounges due to forecasted precipitation.',
          activities: day.activities.map(act => {
            if (act.weatherRecommendation === 'outdoor') {
              return {
                ...act,
                name: 'National Fine Arts Gallery (Weather Safe)',
                description: 'Enjoy a rich collection of visual oil paintings, historical sculptures, and modern interactive exhibits completely sheltered from the outdoor storm.',
                weatherRecommendation: 'string',
                cost: act.cost + 5,
              };
            }
            return act;
          }),
        };
      }

      // If budget exceeded, slice down some activity costs
      const isBudgetIssue = reasonLower.includes('budget') || reasonLower.includes('exceed') || reasonLower.includes('cost');
      if (isBudgetIssue) {
        return {
          ...day,
          activities: day.activities.map(act => {
            if (act.cost > 20 && act.category === 'activity') {
              return {
                ...act,
                name: `${act.name} (Budget Saver Mode)`,
                description: `${act.description} (Optimized for cost savings: Self-guided walking tour version with free entry pass).`,
                cost: Math.round(act.cost * 0.3),
              };
            }
            return act;
          }),
        };
      }

      return day;
    });

    // Recalculate score and budget if budget was changed
    let updatedScoring = { ...trip.scoring, overallScore: 94 };
    let updatedBudget = { ...trip.budgetBreakdown };
    
    if (reasonLower.includes('budget')) {
      updatedScoring.budgetFit = 100;
      updatedBudget.activities = Math.round(trip.budgetBreakdown.activities * 0.4);
      updatedBudget.unallocated = trip.totalBudget - (updatedBudget.accommodation + updatedBudget.food + updatedBudget.transport + updatedBudget.activities);
    }

    return {
      ...trip,
      title: `${trip.title} (Re-planned ✨)`,
      itinerary: updatedItinerary,
      scoring: updatedScoring,
      budgetBreakdown: updatedBudget,
    };
  },

  generateMockChatResponse(trip: Trip | null, query: string): string {
    const q = query.toLowerCase();
    
    if (q.includes('weather')) {
      if (trip && trip.weatherAlerts.length > 0) {
        return `Looking at the forecast for your trip to **${trip.destination}**, there is a **weather alert for heavy rain** on ${trip.weatherAlerts[0].date}. I highly recommend shifting your outdoor activities on that day to indoor spots. I can automatically re-plan that day for you if you say "replan for weather"!`;
      }
      return `The weather forecast for your destination looks stable and clear! Perfect for outdoor exploring. Are there any particular outdoor hikes or tours you'd like to check out?`;
    }

    if (q.includes('restaurant') || q.includes('food') || q.includes('eat') || q.includes('vegetarian')) {
      const dest = trip ? trip.destination : 'your destination';
      const isVeg = q.includes('vegetarian');
      return `Here are some superb dining recommendations for **${dest}**:${isVeg ? '\n1. **Green Zen Garden** — Exquisite organic plant-based hotpot and local tempura (Vegetarian).' : ''}
1. **L'Ambrosia Bistro** — Famed for its local tasting platters and hand-picked micro-greens. Great wine pairings.
2. **The Roastery & Co.** — Cozy, vintage wooden decor serving premium single-origin coffee and artisan sourdough sandwiches.
3. **Seafood Deck** — Fresh ocean catch with scenic harbor viewpoints. Fully accessible.
Would you like me to replace one of the dinner activities in your itinerary with one of these spots?`;
    }

    if (q.includes('replan') || q.includes('replace') || q.includes('change')) {
      return `Sure! I can help you adjust your itinerary. You can specify what you'd like to replace (e.g., "Replace the museum with a park visit" or "Adjust budget to save money") and I will dynamically regenerate that portion for you immediately!`;
    }

    if (q.includes('tomorrow') || q.includes('what should i do')) {
      if (trip && trip.itinerary.length > 0) {
        const firstDay = trip.itinerary[0];
        const acts = firstDay.activities.map(a => `**${a.startTime}** - ${a.name}`).join('\n');
        return `Tomorrow you have an exciting schedule lined up for Day 1 in **${trip.destination}**:\n\n${acts}\n\nMake sure to check in at your accommodation by ${firstDay.activities.find(a => a.category === 'accommodation')?.startTime || '12:00'}. Enjoy your first day!`;
      }
      return `You don't have an active trip plan selected right now. Go ahead and start a new plan using the Planner, and I will be your co-pilot here!`;
    }

    return `Hi! I am your AI Travel Copilot. I can answer questions about your destination, recommend hidden gems, check the weather forecast, or even dynamically adjust and re-plan your active itinerary! 

What would you like to explore or modify next?`;
  },

  calculateDefaultBudget(total: number, style: string): Trip['budgetBreakdown'] {
    let ratios = { accommodation: 0.4, food: 0.25, transport: 0.15, activities: 0.2 };
    if (style === 'budget') ratios = { accommodation: 0.35, food: 0.25, transport: 0.25, activities: 0.15 };
    else if (style === 'luxury') ratios = { accommodation: 0.5, food: 0.25, transport: 0.1, activities: 0.15 };
    else if (style === 'adventure') ratios = { accommodation: 0.3, food: 0.2, transport: 0.2, activities: 0.3 };

    const acc = Math.round(total * ratios.accommodation);
    const food = Math.round(total * ratios.food);
    const trans = Math.round(total * ratios.transport);
    const act = Math.round(total * ratios.activities);

    return {
      accommodation: acc,
      food,
      transport: trans,
      activities: act,
      unallocated: total - (acc + food + trans + act),
    };
  },

  offsetDate(start: string, offset: number): string {
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }
};
