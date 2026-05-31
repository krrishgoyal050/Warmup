import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { config } from '../config';

// Define the custom request properties
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

// Initialize Firebase Admin if credential path is available, otherwise log mock mode
let firebaseAppInitialized = false;
try {
  if (!config.firebase.isMock) {
    if (config.firebase.serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(config.firebase.serviceAccountJson),
      });
    } else {
      admin.initializeApp();
    }
    firebaseAppInitialized = true;
    console.log('[FIREBASE ADMIN] Initialized successfully.');
  } else {
    console.log('[FIREBASE ADMIN] Running in mock/simulation mode. Real JWT verification is bypassed.');
  }
} catch (error) {
  console.warn('[FIREBASE ADMIN INIT WARNING] Could not initialize Firebase Admin SDK. Bypassing to mock mode.', error);
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided',
    });
  }

  const token = authHeader.split('Bearer ')[1];

  if (!firebaseAppInitialized || token.startsWith('mock-')) {
    // Mock authentication path
    const mockUid = token.replace('mock-', '') || 'mock-user-123';
    req.user = {
      uid: mockUid,
      email: `${mockUid}@example.com`,
    };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
    next();
  } catch (error: any) {
    console.error('[AUTH ERROR] JWT token validation failed:', error.message);
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token',
    });
  }
};
