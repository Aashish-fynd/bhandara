import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACE_CONFIG } from "@constants";

const userInteractionsCache = new RedisCache({
  namespace: "user-interactions",
  defaultTTLSeconds: 30 * 24 * 60 * 60, // 30 days
});

const userPreferencesCache = new RedisCache({
  namespace: "user-preferences",
  defaultTTLSeconds: 30 * 24 * 60 * 60, // 30 days
});

export interface UserInteraction {
  eventId: string;
  interactionType: 'click' | 'view' | 'like' | 'share' | 'tag_click';
  tagIds?: string[];
  timestamp: number;
  weight: number;
}

export interface UserPreferences {
  preferredTags: { [tagId: string]: number }; // tagId -> weight
  preferredEventTypes: { [eventType: string]: number }; // eventType -> weight
  preferredTimeSlots: { [timeSlot: string]: number }; // morning/evening/night -> weight
  preferredCreators: { [creatorId: string]: number }; // creatorId -> weight
  lastUpdated: number;
}

export const INTERACTION_WEIGHTS = {
  click: 3,
  view: 1,
  like: 5,
  share: 4,
  tag_click: 2,
} as const;

export const PREFERENCE_DECAY_FACTOR = 0.95; // 5% decay per day

// Track user interaction
export const trackUserInteraction = async (
  userId: string,
  interaction: Omit<UserInteraction, 'timestamp' | 'weight'>
): Promise<void> => {
  const timestamp = Date.now();
  const weight = INTERACTION_WEIGHTS[interaction.interactionType];
  
  const fullInteraction: UserInteraction = {
    ...interaction,
    timestamp,
    weight,
  };

  const key = `interactions:${userId}`;
  const existingInteractions = await userInteractionsCache.getItem<UserInteraction[]>(key) || [];
  
  // Add new interaction and keep only last 100 interactions
  existingInteractions.push(fullInteraction);
  if (existingInteractions.length > 100) {
    existingInteractions.splice(0, existingInteractions.length - 100);
  }
  
  await userInteractionsCache.setItem(key, existingInteractions);
  
  // Update user preferences based on this interaction
  await updateUserPreferences(userId, fullInteraction);
};

// Update user preferences based on interaction
const updateUserPreferences = async (
  userId: string,
  interaction: UserInteraction
): Promise<void> => {
  const key = `preferences:${userId}`;
  const preferences = await userPreferencesCache.getItem<UserPreferences>(key) || {
    preferredTags: {},
    preferredEventTypes: {},
    preferredTimeSlots: {},
    preferredCreators: {},
    lastUpdated: Date.now(),
  };

  // Update tag preferences if tag_click interaction
  if (interaction.interactionType === 'tag_click' && interaction.tagIds) {
    for (const tagId of interaction.tagIds) {
      preferences.preferredTags[tagId] = (preferences.preferredTags[tagId] || 0) + interaction.weight;
    }
  }

  // Update creator preferences
  if (interaction.eventId) {
    // This would need to be enhanced to get event details and extract creator
    // For now, we'll track by eventId as a proxy for creator preference
    preferences.preferredCreators[interaction.eventId] = 
      (preferences.preferredCreators[interaction.eventId] || 0) + interaction.weight;
  }

  preferences.lastUpdated = Date.now();
  await userPreferencesCache.setItem(key, preferences);
};

// Get user preferences with decay applied
export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const key = `preferences:${userId}`;
  const preferences = await userPreferencesCache.getItem<UserPreferences>(key);
  
  if (!preferences) {
    return {
      preferredTags: {},
      preferredEventTypes: {},
      preferredTimeSlots: {},
      preferredCreators: {},
      lastUpdated: Date.now(),
    };
  }

  // Apply time decay to preferences
  const daysSinceUpdate = (Date.now() - preferences.lastUpdated) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.pow(PREFERENCE_DECAY_FACTOR, daysSinceUpdate);

  const decayedPreferences: UserPreferences = {
    preferredTags: {},
    preferredEventTypes: {},
    preferredTimeSlots: {},
    preferredCreators: {},
    lastUpdated: preferences.lastUpdated,
  };

  // Apply decay to all preference weights
  Object.entries(preferences.preferredTags).forEach(([tagId, weight]) => {
    decayedPreferences.preferredTags[tagId] = weight * decayFactor;
  });

  Object.entries(preferences.preferredEventTypes).forEach(([eventType, weight]) => {
    decayedPreferences.preferredEventTypes[eventType] = weight * decayFactor;
  });

  Object.entries(preferences.preferredTimeSlots).forEach(([timeSlot, weight]) => {
    decayedPreferences.preferredTimeSlots[timeSlot] = weight * decayFactor;
  });

  Object.entries(preferences.preferredCreators).forEach(([creatorId, weight]) => {
    decayedPreferences.preferredCreators[creatorId] = weight * decayFactor;
  });

  return decayedPreferences;
};

// Get recently shown events to avoid duplicates
export const getRecentlyShownEvents = async (userId: string): Promise<string[]> => {
  const key = `recently-shown:${userId}`;
  const recentlyShown = await userInteractionsCache.getItem<string[]>(key) || [];
  return recentlyShown;
};

// Mark events as shown to user
export const markEventsAsShown = async (userId: string, eventIds: string[]): Promise<void> => {
  const key = `recently-shown:${userId}`;
  const recentlyShown = await getRecentlyShownEvents(userId);
  
  // Add new event IDs and keep only last 50
  const updated = [...recentlyShown, ...eventIds];
  if (updated.length > 50) {
    updated.splice(0, updated.length - 50);
  }
  
  await userInteractionsCache.setItem(key, updated);
};

// Calculate event relevance score based on user preferences
export const calculateEventRelevanceScore = (
  event: any,
  preferences: UserPreferences
): number => {
  let score = 0;

  // Score based on tags
  if (event.tags && Array.isArray(event.tags)) {
    for (const tag of event.tags) {
      const tagId = typeof tag === 'string' ? tag : tag.id;
      if (preferences.preferredTags[tagId]) {
        score += preferences.preferredTags[tagId];
      }
    }
  }

  // Score based on creator
  if (event.creator && preferences.preferredCreators[event.creator.id]) {
    score += preferences.preferredCreators[event.creator.id];
  }

  // Score based on time slot
  if (event.timings?.start) {
    const timeOfDay = getTimeOfDay(event.timings.start);
    if (preferences.preferredTimeSlots[timeOfDay]) {
      score += preferences.preferredTimeSlots[timeOfDay];
    }
  }

  return score;
};

// Helper function to get time of day
const getTimeOfDay = (date?: Date | string): string => {
  const d = date ? new Date(date) : new Date();
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "evening";
  return "night";
};

// Clear user data (for testing or GDPR compliance)
export const clearUserData = async (userId: string): Promise<void> => {
  await userInteractionsCache.deleteItem(`interactions:${userId}`);
  await userPreferencesCache.deleteItem(`preferences:${userId}`);
  await userInteractionsCache.deleteItem(`recently-shown:${userId}`);
};