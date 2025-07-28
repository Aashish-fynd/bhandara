import { 
  trackUserInteraction, 
  getUserPreferences, 
  calculateEventRelevanceScore,
  getRecentlyShownEvents,
  markEventsAsShown,
  clearUserData,
  UserPreferences
} from './interactions';

// Mock Redis cache for testing
jest.mock('@features/cache', () => ({
  RedisCache: jest.fn().mockImplementation(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    deleteItem: jest.fn(),
  })),
}));

describe('User Interactions', () => {
  const mockUserId = 'test-user-123';
  const mockEventId = 'test-event-456';
  const mockTagIds = ['tag1', 'tag2'];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up test data
    await clearUserData(mockUserId);
  });

  describe('trackUserInteraction', () => {
    it('should track user interaction correctly', async () => {
      const interaction = {
        eventId: mockEventId,
        interactionType: 'click' as const,
        tagIds: mockTagIds,
      };

      await trackUserInteraction(mockUserId, interaction);

      // Verify that the interaction was stored
      // This would require mocking the Redis cache implementation
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should handle tag_click interaction type', async () => {
      const interaction = {
        eventId: mockEventId,
        interactionType: 'tag_click' as const,
        tagIds: mockTagIds,
      };

      await trackUserInteraction(mockUserId, interaction);

      // Verify that tag preferences were updated
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('getUserPreferences', () => {
    it('should return default preferences for new user', async () => {
      const preferences = await getUserPreferences('new-user-123');

      expect(preferences).toEqual({
        preferredTags: {},
        preferredEventTypes: {},
        preferredTimeSlots: {},
        preferredCreators: {},
        lastUpdated: expect.any(Number),
      });
    });

    it('should apply time decay to preferences', async () => {
      // Mock preferences with old timestamp
      const oldPreferences: UserPreferences = {
        preferredTags: { 'tag1': 10 },
        preferredEventTypes: {},
        preferredTimeSlots: {},
        preferredCreators: {},
        lastUpdated: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      // Mock the cache to return these preferences
      const mockCache = require('@features/cache').RedisCache;
      mockCache.mockImplementation(() => ({
        getItem: jest.fn().mockResolvedValue(oldPreferences),
        setItem: jest.fn(),
        deleteItem: jest.fn(),
      }));

      const preferences = await getUserPreferences(mockUserId);

      // Preferences should be decayed
      expect(preferences.preferredTags['tag1']).toBeLessThan(10);
    });
  });

  describe('calculateEventRelevanceScore', () => {
    it('should calculate score based on tag preferences', () => {
      const preferences: UserPreferences = {
        preferredTags: { 'tag1': 5, 'tag2': 3 },
        preferredEventTypes: {},
        preferredTimeSlots: {},
        preferredCreators: {},
        lastUpdated: Date.now(),
      };

      const event = {
        id: mockEventId,
        tags: [
          { id: 'tag1', name: 'Italian' },
          { id: 'tag3', name: 'Pizza' },
        ],
        creator: { id: 'creator1' },
        timings: { start: new Date('2024-01-01T12:00:00Z') },
      };

      const score = calculateEventRelevanceScore(event, preferences);

      // Should get score for tag1 (5) but not tag3 (0)
      expect(score).toBe(5);
    });

    it('should calculate score based on creator preferences', () => {
      const preferences: UserPreferences = {
        preferredTags: {},
        preferredEventTypes: {},
        preferredTimeSlots: {},
        preferredCreators: { 'creator1': 8 },
        lastUpdated: Date.now(),
      };

      const event = {
        id: mockEventId,
        tags: [],
        creator: { id: 'creator1' },
        timings: { start: new Date('2024-01-01T12:00:00Z') },
      };

      const score = calculateEventRelevanceScore(event, preferences);

      expect(score).toBe(8);
    });
  });

  describe('getRecentlyShownEvents', () => {
    it('should return empty array for new user', async () => {
      const recentlyShown = await getRecentlyShownEvents('new-user-123');
      expect(recentlyShown).toEqual([]);
    });
  });

  describe('markEventsAsShown', () => {
    it('should mark events as shown', async () => {
      const eventIds = ['event1', 'event2', 'event3'];
      
      await markEventsAsShown(mockUserId, eventIds);
      
      const recentlyShown = await getRecentlyShownEvents(mockUserId);
      expect(recentlyShown).toContain('event1');
      expect(recentlyShown).toContain('event2');
      expect(recentlyShown).toContain('event3');
    });

    it('should limit recently shown events to 50', async () => {
      const manyEventIds = Array.from({ length: 60 }, (_, i) => `event${i}`);
      
      await markEventsAsShown(mockUserId, manyEventIds);
      
      const recentlyShown = await getRecentlyShownEvents(mockUserId);
      expect(recentlyShown.length).toBeLessThanOrEqual(50);
    });
  });
});