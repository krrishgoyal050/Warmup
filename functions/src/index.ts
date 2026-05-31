import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/generative-ai';
import fetch from 'node-fetch';

admin.initializeApp();
const db = admin.firestore();

// Helper to load Gemini API key from environment config or secrets
const getGeminiApiKey = (): string => {
  return process.env.GEMINI_API_KEY || functions.config().gemini?.key || '';
};

// --- 1. generateTrip Callable Function ---
export const generateTrip = functions.https.onCall(async (data, context) => {
  // Enforce authentications
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called with valid authentication credentials.');
  }

  const { source, destination, startDate, endDate, totalBudget, travelStyle, numTravelers, interests, accessibilityRequired } = data;

  if (!destination || !startDate || !endDate || !totalBudget) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing mandatory trip variables.');
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API key is not configured.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.get('gemini-2.5-pro');

    const durationDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const prompt = `
      Plan a ${durationDays}-day trip from "${source}" to "${destination}".
      Dates: ${startDate} to ${endDate}.
      Total Budget: $${totalBudget} USD.
      Travel Style: ${travelStyle} (allocate budget properly).
      Interests: ${interests ? interests.join(', ') : ''}.
      Accessibility Required: ${accessibilityRequired ? 'YES' : 'NO'}.
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Gemini API returned an empty payload.');
    }

    const generatedJson = JSON.parse(resultText);

    // Build standard database Trip record
    const tripId = db.collection('trips').doc().id;
    const tripRecord = {
      id: tripId,
      userId: context.auth.uid,
      title: generatedJson.title || `Custom Trip to ${destination}`,
      source,
      destination,
      startDate,
      endDate,
      durationDays,
      totalBudget: Number(totalBudget),
      travelStyle: travelStyle || 'balanced',
      numTravelers: Number(numTravelers) || 1,
      budgetBreakdown: generatedJson.budgetBreakdown,
      scoring: generatedJson.scoring || { overallScore: 85, budgetFit: 90, efficiency: 80, diversity: 85, preferenceMatch: 85 },
      itinerary: generatedJson.itinerary || [],
      weatherAlerts: [],
      createdAt: new Date().toISOString()
    };

    await db.collection('trips').doc(tripId).set(tripRecord);

    return { success: true, tripId, data: tripRecord };
  } catch (error: any) {
    console.error('[CLOUD FUNCTION ERROR] generateTrip failed:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Itinerary generation pipeline crashed.');
  }
});

// --- 2. calculateCosts HTTPS Endpoint ---
export const calculateCosts = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { totalBudget, travelStyle } = req.body;
    if (!totalBudget) {
      res.status(400).json({ error: 'totalBudget is required.' });
      return;
    }

    // Allocation ratios
    let ratios = { accommodation: 0.4, food: 0.25, transport: 0.15, activities: 0.2 };
    if (travelStyle === 'budget') ratios = { accommodation: 0.35, food: 0.25, transport: 0.25, activities: 0.15 };
    else if (travelStyle === 'luxury') ratios = { accommodation: 0.5, food: 0.25, transport: 0.1, activities: 0.15 };
    else if (travelStyle === 'adventure') ratios = { accommodation: 0.3, food: 0.2, transport: 0.2, activities: 0.3 };

    const acc = Math.round(totalBudget * ratios.accommodation);
    const food = Math.round(totalBudget * ratios.food);
    const trans = Math.round(totalBudget * ratios.transport);
    const act = Math.round(totalBudget * ratios.activities);

    res.status(200).json({
      success: true,
      budgetBreakdown: {
        accommodation: acc,
        food,
        transport: trans,
        activities: act,
        unallocated: totalBudget - (acc + food + trans + act)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 3. replanItinerary Callable Function ---
export const replanItinerary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must sign in.');
  }

  const { tripId, reason } = data;
  if (!tripId || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'tripId and reason are required.');
  }

  try {
    const doc = await db.collection('trips').doc(tripId).get();
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Trip does not exist.');
    }

    const trip = doc.data();
    if (trip?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Unauthorized access.');
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'API key unconfigured.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.get('gemini-2.5-pro');

    const prompt = `
      Re-plan this trip itinerary: ${JSON.stringify(trip.itinerary)}
      Reason: "${reason}"
      Modify affected components. Output valid JSON in trip schema.
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
    });

    const parsedJson = JSON.parse(response.text || '{}');

    // Update Firestore trip record
    const updatedRecord = {
      ...trip,
      title: parsedJson.title || trip.title,
      itinerary: parsedJson.itinerary || trip.itinerary,
      scoring: parsedJson.scoring || trip.scoring,
      budgetBreakdown: parsedJson.budgetBreakdown || trip.budgetBreakdown
    };

    await db.collection('trips').doc(tripId).set(updatedRecord);
    return { success: true, data: updatedRecord };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// --- 4. weatherUpdateTrigger Cron Trigger ---
export const weatherUpdateTrigger = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('[CRON WEATHER SERVICE] Triggered daily weather forecast validation.');
    
    try {
      const snapshot = await db.collection('trips').get();
      if (snapshot.empty) return null;

      const weatherApiKey = process.env.WEATHER_API_KEY || functions.config().weather?.key || '';
      if (!weatherApiKey) return null;

      const promises: Promise<any>[] = [];

      snapshot.forEach((doc) => {
        const trip = doc.data();
        const dest = trip.destination;

        // Fetch forecast and assess
        const promise = fetch(`https://api.openweathermap.org/data/2.5/forecast/daily?q=${encodeURIComponent(dest)}&cnt=${trip.durationDays}&units=metric&appid=${weatherApiKey}`)
          .then(res => res.json())
          .then(async (data: any) => {
            if (data.cod === '200' && data.list) {
              const alerts: any[] = [];
              data.list.forEach((item: any, idx: number) => {
                const date = new Date(item.dt * 1000).toISOString().split('T')[0];
                const main = item.weather[0].main.toLowerCase();

                if (main.includes('rain') || main.includes('storm')) {
                  alerts.push({
                    date,
                    condition: 'rain',
                    warning: `Precipitation alert on ${date}. Transition outdoor slots on Day ${idx + 1} to covered spaces.`
                  });
                }
              });

              if (alerts.length > 0) {
                // Update Firestore record with active alerts
                await db.collection('trips').doc(doc.id).update({ weatherAlerts: alerts });
                console.log(`[WEATHER ALERTS] Updated alerts for Trip: ${doc.id}`);
              }
            }
          })
          .catch(e => console.error(`Failed to update weather for trip ${doc.id}:`, e));
        
        promises.push(promise);
      });

      await Promise.all(promises);
      return null;
    } catch (e) {
      console.error('[CRON WEATHER ERROR]', e);
      return null;
    }
  });
