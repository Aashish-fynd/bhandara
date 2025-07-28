# Intelligent Explore System

## Overview

The Intelligent Explore System enhances the explore section by implementing user interaction tracking and preference-based event recommendations. Instead of showing random events sorted by date, the system now learns from user interactions and provides personalized event suggestions.

## Key Features

### 1. User Interaction Tracking
- **Event Clicks**: Tracks when users click on events
- **Tag Clicks**: Tracks when users click on specific tags (e.g., "Free", "Italian", "Pizza")
- **Interaction Weights**: Different interaction types have different weights:
  - `click`: 3 points
  - `view`: 1 point  
  - `like`: 5 points
  - `share`: 4 points
  - `tag_click`: 2 points

### 2. Preference Learning
- **Tag Preferences**: Learns which tags users prefer based on interactions
- **Creator Preferences**: Learns which event creators users prefer
- **Time Slot Preferences**: Learns preferred time slots (morning/evening/night)
- **Decay System**: Preferences decay over time (5% per day) to adapt to changing interests

### 3. Smart Event Filtering
- **Duplicate Prevention**: Avoids showing events the user has already seen
- **Relevance Scoring**: Calculates event relevance based on user preferences
- **Intelligent Sorting**: Sorts events by relevance score, then by creation date

## Architecture

### Backend Components

#### 1. User Interactions Module (`server/src/features/users/interactions.ts`)
```typescript
// Track user interaction
await trackUserInteraction(userId, {
  eventId: "event123",
  interactionType: "click",
  tagIds: ["tag1", "tag2"]
});

// Get user preferences with decay applied
const preferences = await getUserPreferences(userId);

// Calculate event relevance score
const score = calculateEventRelevanceScore(event, preferences);
```

#### 2. Enhanced Explore Helpers (`server/src/features/explore/helpers.ts`)
```typescript
// Build explore sections with user preferences
const sections = await buildExploreSections(events, userId);
```

#### 3. Socket Integration (`server/src/socket/index.ts`)
```typescript
// Track user interactions via socket
socket.on(PLATFORM_SOCKET_EVENTS.TRACK_INTERACTION, async (request, cb) => {
  await trackUserInteraction(socketUserId, request);
});
```

### Frontend Components

#### 1. Enhanced Event Cards
- All event cards now track clicks
- Tag clicks are tracked separately
- Interaction data is sent to backend via socket

#### 2. Updated Components
- `TasteCalendar`: Tracks time-based interactions
- `FoodieFeed`: Tracks live event interactions  
- `Reels`: Tracks video content interactions
- `Collaborations`: Tracks chef/creator interactions
- `Trending`: Tracks popular event interactions

## Data Storage

### Redis Cache Structure
```
user-interactions:interactions:{userId} -> UserInteraction[]
user-interactions:recently-shown:{userId} -> string[]
user-preferences:preferences:{userId} -> UserPreferences
```

### UserPreferences Interface
```typescript
interface UserPreferences {
  preferredTags: { [tagId: string]: number };     // tagId -> weight
  preferredEventTypes: { [eventType: string]: number };
  preferredTimeSlots: { [timeSlot: string]: number }; // morning/evening/night
  preferredCreators: { [creatorId: string]: number };
  lastUpdated: number;
}
```

## Usage Examples

### 1. User Clicks on "Free" Tag
```typescript
// Frontend sends interaction
socket.emit(PLATFORM_SOCKET_EVENTS.TRACK_INTERACTION, {
  eventId: "event123",
  interactionType: "tag_click",
  tagIds: ["free-tag-id"]
});

// Backend updates preferences
// "free-tag-id" weight increases by 2 points
```

### 2. User Clicks on Event
```typescript
// Frontend sends interaction
socket.emit(PLATFORM_SOCKET_EVENTS.TRACK_INTERACTION, {
  eventId: "event123",
  interactionType: "click",
  tagIds: ["italian", "pizza"]
});

// Backend updates preferences
// Event creator weight increases by 3 points
// Tag weights increase by 3 points each
```

### 3. Explore Section Generation
```typescript
// Backend filters and sorts events
const filteredEvents = await filterAndSortEvents(events, userId);

// Events are scored and sorted by relevance
// Recently shown events are excluded
// Top 20 most relevant events are selected
```

## Configuration

### Interaction Weights
```typescript
export const INTERACTION_WEIGHTS = {
  click: 3,
  view: 1,
  like: 5,
  share: 4,
  tag_click: 2,
};
```

### Preference Decay
```typescript
export const PREFERENCE_DECAY_FACTOR = 0.95; // 5% decay per day
```

### Cache TTL
```typescript
// 30 days for user interactions and preferences
defaultTTLSeconds: 30 * 24 * 60 * 60
```

## Benefits

### 1. Improved User Experience
- **Personalized Content**: Users see events relevant to their interests
- **Reduced Duplicates**: Avoids showing the same events repeatedly
- **Discovery**: Helps users find new events based on their preferences

### 2. Better Engagement
- **Higher Click Rates**: Relevant events are more likely to be clicked
- **Longer Session Times**: Users spend more time exploring relevant content
- **Increased Satisfaction**: Users find events they actually want to attend

### 3. Data-Driven Insights
- **User Behavior Analysis**: Understand what types of events users prefer
- **Trend Identification**: Identify popular event categories and creators
- **Optimization Opportunities**: Use data to improve event recommendations

## Testing

Run the test suite to verify the implementation:
```bash
npm test -- interactions.test.ts
```

## Future Enhancements

### 1. Advanced Analytics
- **A/B Testing**: Test different recommendation algorithms
- **Performance Metrics**: Track recommendation accuracy and user satisfaction
- **Machine Learning**: Implement ML models for better predictions

### 2. Additional Interaction Types
- **Event Sharing**: Track when users share events
- **Event Booking**: Track when users book events
- **Event Reviews**: Track when users leave reviews

### 3. Enhanced Personalization
- **Location Preferences**: Learn preferred event locations
- **Price Preferences**: Learn preferred price ranges
- **Group Preferences**: Learn preferences for group vs solo events

## Migration Notes

### Backward Compatibility
- The system maintains backward compatibility with existing explore functionality
- If no user ID is provided, the original random sorting is used
- Existing users will gradually build preferences as they interact with events

### Performance Considerations
- Redis caching ensures fast preference lookups
- Event filtering is optimized to handle large event datasets
- Recently shown events are limited to 50 to prevent memory bloat

## Troubleshooting

### Common Issues

1. **No Personalized Recommendations**
   - Check if user interactions are being tracked
   - Verify Redis cache is working properly
   - Ensure user ID is being passed correctly

2. **Duplicate Events Still Showing**
   - Check if `markEventsAsShown` is being called
   - Verify recently shown events cache is working
   - Ensure event IDs are consistent

3. **Preferences Not Updating**
   - Check if `trackUserInteraction` is being called
   - Verify Redis cache write operations
   - Check for errors in preference update logic

### Debug Tools

```typescript
// Get user preferences for debugging
const preferences = await getUserPreferences(userId);
console.log('User preferences:', preferences);

// Get recently shown events
const recentlyShown = await getRecentlyShownEvents(userId);
console.log('Recently shown:', recentlyShown);

// Clear user data for testing
await clearUserData(userId);
```