import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Trip, UserProfile, ChatThread } from '../types';

let db: FirebaseFirestore.Firestore | null = null;
const mockDbPath = path.resolve(__dirname, '../../mock_db.json');

// Initialize Firestore if Firebase Admin was successfully configured
try {
  if (!config.firebase.isMock) {
    db = admin.firestore();
    console.log('[FIRESTORE SERVICE] Connected to real Firestore database.');
  } else {
    console.log('[FIRESTORE SERVICE] Running in PERSISTENT MOCK mode. Saving data locally to backend/mock_db.json.');
    initializeLocalDb();
  }
} catch (error) {
  console.warn('[FIRESTORE SERVICE INIT WARNING] Failed to initialize live Firestore. Falling back to backend/mock_db.json.', error);
  initializeLocalDb();
}

function initializeLocalDb() {
  if (!fs.existsSync(mockDbPath)) {
    fs.writeFileSync(mockDbPath, JSON.stringify({ users: {}, trips: {}, chats: {} }, null, 2));
  }
}

function readLocalDb(): { users: Record<string, UserProfile>; trips: Record<string, Trip>; chats: Record<string, ChatThread> } {
  initializeLocalDb();
  const data = fs.readFileSync(mockDbPath, 'utf8');
  return JSON.parse(data);
}

function writeLocalDb(data: any) {
  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
}

export const firestoreService = {
  // --- USER PROFILE OPERATIONS ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (db) {
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists ? (doc.data() as UserProfile) : null;
    } else {
      const local = readLocalDb();
      return local.users[uid] || null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (db) {
      await db.collection('users').doc(profile.uid).set(profile);
    } else {
      const local = readLocalDb();
      local.users[profile.uid] = profile;
      writeLocalDb(local);
    }
  },

  // --- TRIP OPERATIONS ---
  async getTrip(tripId: string): Promise<Trip | null> {
    if (db) {
      const doc = await db.collection('trips').doc(tripId).get();
      return doc.exists ? (doc.data() as Trip) : null;
    } else {
      const local = readLocalDb();
      return local.trips[tripId] || null;
    }
  },

  async getUserTrips(userId: string): Promise<Trip[]> {
    if (db) {
      const snapshot = await db.collection('trips').where('userId', '==', userId).get();
      const trips: Trip[] = [];
      snapshot.forEach((doc) => trips.push(doc.data() as Trip));
      return trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      const local = readLocalDb();
      return Object.values(local.trips)
        .filter((trip) => trip.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async saveTrip(trip: Trip): Promise<void> {
    if (db) {
      await db.collection('trips').doc(trip.id).set(trip);
    } else {
      const local = readLocalDb();
      local.trips[trip.id] = trip;
      writeLocalDb(local);
    }
  },

  async deleteTrip(tripId: string): Promise<void> {
    if (db) {
      await db.collection('trips').doc(tripId).delete();
    } else {
      const local = readLocalDb();
      if (local.trips[tripId]) {
        delete local.trips[tripId];
        writeLocalDb(local);
      }
    }
  },

  // --- CHAT OPERATIONS ---
  async getChatThread(threadId: string): Promise<ChatThread | null> {
    if (db) {
      const doc = await db.collection('chats').doc(threadId).get();
      return doc.exists ? (doc.data() as ChatThread) : null;
    } else {
      const local = readLocalDb();
      return local.chats[threadId] || null;
    }
  },

  async getChatThreadByTrip(userId: string, tripId: string): Promise<ChatThread | null> {
    if (db) {
      const snapshot = await db
        .collection('chats')
        .where('userId', '==', userId)
        .where('tripId', '==', tripId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as ChatThread;
    } else {
      const local = readLocalDb();
      const thread = Object.values(local.chats).find(
        (c) => c.userId === userId && c.tripId === tripId
      );
      return thread || null;
    }
  },

  async saveChatThread(thread: ChatThread): Promise<void> {
    if (db) {
      await db.collection('chats').doc(thread.id).set(thread);
    } else {
      const local = readLocalDb();
      local.chats[thread.id] = thread;
      writeLocalDb(local);
    }
  },
};
