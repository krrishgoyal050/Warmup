export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  preferences: {
    travelStyle: 'budget' | 'balanced' | 'luxury' | 'adventure';
    interests: string[];
    dietaryRestrictions: string[];
    accessibilityRequired: boolean;
  };
  accessibilitySettings: {
    highContrast: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
  };
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  cost: number; // in USD
  category: 'accommodation' | 'food' | 'transport' | 'activity';
  location: {
    lat: number;
    lng: number;
    address: string;
    placeId?: string;
  };
  accessibilityFriendly: boolean;
  weatherRecommendation: 'outdoor' | 'indoor' | 'flexible';
  scoreContribution: number;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  activities: Activity[];
  dailyRouteSummary?: string;
}

export interface TripScoring {
  overallScore: number;
  budgetFit: number;
  efficiency: number;
  diversity: number;
  preferenceMatch: number;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  unallocated: number;
}

export interface WeatherAlert {
  date: string;
  condition: string;
  warning: string;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalBudget: number;
  travelStyle: 'budget' | 'balanced' | 'luxury' | 'adventure';
  numTravelers: number;
  budgetBreakdown: BudgetBreakdown;
  scoring: TripScoring;
  itinerary: ItineraryDay[];
  weatherAlerts: WeatherAlert[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  tripId?: string;
  messages: ChatMessage[];
  updatedAt: string;
}
