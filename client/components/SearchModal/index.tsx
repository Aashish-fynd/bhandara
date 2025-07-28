import React, { useState, useEffect } from 'react';
import { X, Filter, Calendar, MapPin, Users, Tag, User, Event } from '@tamagui/lucide-icons';
import { 
  Sheet, 
  Button, 
  XStack, 
  YStack, 
  Text, 
  Image, 
  ScrollView, 
  H4, 
  H5, 
  H6,
  Separator,
  Badge,
  Spinner,
  AnimatePresence
} from 'tamagui';
import { useRouter } from 'expo-router';
import { search, getSearchOptions } from '@/common/api/search.action';
import { ISearchResult, ISearchFilters } from '@/definitions/types';
import SearchBar from '@/components/SearchBar';
import { formatDistanceToNow } from 'date-fns';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ISearchResult[]>([]);
  const [filters, setFilters] = useState<ISearchFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    hasNext: false,
  });
  const router = useRouter();

  // Load search options on mount
  useEffect(() => {
    loadSearchOptions();
  }, []);

  const loadSearchOptions = async () => {
    try {
      const response = await getSearchOptions();
      if (response.success) {
        setSearchOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading search options:', error);
    }
  };

  const performSearch = async (query: string, searchFilters?: ISearchFilters, page: number = 1) => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await search(query, searchFilters, page, 20);
      
      if (response.success) {
        if (page === 1) {
          setResults(response.data);
        } else {
          setResults(prev => [...prev, ...response.data]);
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string, searchFilters?: ISearchFilters) => {
    setSearchQuery(query);
    setFilters(searchFilters || {});
    performSearch(query, searchFilters, 1);
  };

  const handleFiltersChange = (newFilters: ISearchFilters) => {
    setFilters(newFilters);
    if (searchQuery) {
      performSearch(searchQuery, newFilters, 1);
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasNext && !isLoading) {
      performSearch(searchQuery, filters, pagination.page + 1);
    }
  };

  const handleResultClick = (result: ISearchResult) => {
    switch (result.type) {
      case 'event':
        router.push(`/event/${result.id}`);
        break;
      case 'user':
        router.push(`/profile/${result.id}`);
        break;
      case 'tag':
        // Navigate to events with this tag
        router.push(`/events?tag=${result.id}`);
        break;
    }
    onClose();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Event size={16} color="$blue10" />;
      case 'user':
        return <User size={16} color="$green10" />;
      case 'tag':
        return <Tag size={16} color="$orange10" />;
      default:
        return null;
    }
  };

  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'event':
        return '$blue5';
      case 'user':
        return '$green5';
      case 'tag':
        return '$orange5';
      default:
        return '$gray5';
    }
  };

  const renderResultItem = (result: ISearchResult) => (
    <Button
      key={`${result.type}-${result.id}`}
      backgroundColor="transparent"
      borderWidth={0}
      paddingHorizontal="$4"
      paddingVertical="$3"
      onPress={() => handleResultClick(result)}
      hoverStyle={{ backgroundColor: "$gray5" }}
      pressStyle={{ backgroundColor: "$gray6" }}
    >
      <XStack gap="$3" alignItems="center" width="100%">
        {/* Result Image */}
        <YStack width={50} height={50} borderRadius="$3" overflow="hidden">
          {result.imageUrl ? (
            <Image
              source={{ uri: result.imageUrl }}
              width="100%"
              height="100%"
              resizeMode="cover"
            />
          ) : (
            <YStack
              width="100%"
              height="100%"
              backgroundColor="$gray5"
              alignItems="center"
              justifyContent="center"
            >
              {getResultIcon(result.type)}
            </YStack>
          )}
        </YStack>

        {/* Result Content */}
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <Badge backgroundColor={getResultBadgeColor(result.type)}>
              <Badge.Text fontSize="$2" textTransform="capitalize">
                {result.type}
              </Badge.Text>
            </Badge>
            <H6 flex={1} numberOfLines={1} ellipsizeMode="tail">
              {result.title}
            </H6>
          </XStack>
          
          {result.description && (
            <Text
              fontSize="$3"
              color="$gray10"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {result.description}
            </Text>
          )}

          {/* Metadata */}
          <XStack gap="$3" alignItems="center">
            <Text fontSize="$2" color="$gray8">
              {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
            </Text>
            
            {result.type === 'event' && result.metadata?.location && (
              <XStack alignItems="center" gap="$1">
                <MapPin size={12} color="$gray8" />
                <Text fontSize="$2" color="$gray8">
                  {result.metadata.location.city || result.metadata.location.place}
                </Text>
              </XStack>
            )}
            
            {result.type === 'event' && result.metadata?.participants && (
              <XStack alignItems="center" gap="$1">
                <Users size={12} color="$gray8" />
                <Text fontSize="$2" color="$gray8">
                  {result.metadata.participants} participants
                </Text>
              </XStack>
            )}
          </XStack>
        </YStack>
      </XStack>
    </Button>
  );

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={onClose}
      snapPoints={[85]}
      position={0}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        padding="$4"
        justifyContent="flex-start"
        alignItems="center"
        space="$4"
      >
        <Sheet.Handle />
        
        {/* Header */}
        <XStack width="100%" alignItems="center" justifyContent="space-between">
          <H4>Search</H4>
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            onPress={onClose}
            icon={X}
            color="$gray10"
          />
        </XStack>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          placeholder="Search events, users, tags..."
        />

        {/* Filter Toggle */}
        <XStack width="100%" justifyContent="flex-end">
          <Button
            size="$2"
            backgroundColor={Object.keys(filters).length > 0 ? "$blue10" : "transparent"}
            onPress={() => setShowFilters(!showFilters)}
            icon={Filter}
            color={Object.keys(filters).length > 0 ? "white" : "$gray10"}
          >
            Filters
          </Button>
        </XStack>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && searchOptions && (
            <YStack
              width="100%"
              backgroundColor="$gray2"
              borderRadius="$3"
              padding="$3"
              gap="$3"
              enterStyle={{ opacity: 0, height: 0 }}
              exitStyle={{ opacity: 0, height: 0 }}
              animation="quick"
            >
              <H6>Filter by Type</H6>
              <XStack flexWrap="wrap" gap="$2">
                {searchOptions.types.map((type: any) => (
                  <Button
                    key={type.value}
                    size="$2"
                    backgroundColor={filters.types?.includes(type.value) ? "$blue10" : "$gray5"}
                    onPress={() => {
                      const currentTypes = filters.types || [];
                      const newTypes = currentTypes.includes(type.value)
                        ? currentTypes.filter(t => t !== type.value)
                        : [...currentTypes, type.value];
                      handleFiltersChange({ ...filters, types: newTypes });
                    }}
                  >
                    <Button.Text color={filters.types?.includes(type.value) ? "white" : "$gray10"}>
                      {type.label}
                    </Button.Text>
                  </Button>
                ))}
              </XStack>
            </YStack>
          )}
        </AnimatePresence>

        {/* Results */}
        <ScrollView width="100%" flex={1}>
          {isLoading && results.length === 0 ? (
            <YStack alignItems="center" justifyContent="center" padding="$8">
              <Spinner size="large" />
              <Text marginTop="$3" color="$gray10">Searching...</Text>
            </YStack>
          ) : results.length > 0 ? (
            <YStack gap="$1">
              <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4">
                <Text fontSize="$3" color="$gray10">
                  {pagination.total} results found
                </Text>
              </XStack>
              
              <Separator marginVertical="$2" />
              
              {results.map(renderResultItem)}
              
              {pagination.hasNext && (
                <Button
                  marginTop="$3"
                  backgroundColor="transparent"
                  borderWidth={1}
                  borderColor="$borderColor"
                  onPress={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner size="small" />
                  ) : (
                    <Button.Text>Load More</Button.Text>
                  )}
                </Button>
              )}
            </YStack>
          ) : searchQuery ? (
            <YStack alignItems="center" justifyContent="center" padding="$8">
              <Text color="$gray10" textAlign="center">
                No results found for "{searchQuery}"
              </Text>
              <Text fontSize="$3" color="$gray8" textAlign="center" marginTop="$2">
                Try adjusting your search terms or filters
              </Text>
            </YStack>
          ) : (
            <YStack alignItems="center" justifyContent="center" padding="$8">
              <Text color="$gray10" textAlign="center">
                Start typing to search for events, users, and tags
              </Text>
            </YStack>
          )}
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};

export default SearchModal;