import React, { useState, useCallback, useRef } from 'react';
import { Search, Filter, X } from '@tamagui/lucide-icons';
import { Input, XStack, YStack, Button, Text, AnimatePresence } from 'tamagui';
import { useDebounce } from '@/hooks/useDebounce';
import { getSearchSuggestions } from '@/common/api/search.action';
import { ISearchFilters } from '@/definitions/types';

interface SearchBarProps {
  onSearch: (query: string, filters?: ISearchFilters) => void;
  onFiltersChange: (filters: ISearchFilters) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFiltersChange,
  placeholder = "Search events, users, tags...",
  className,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<any>(null);

  // Fetch suggestions when query changes
  React.useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const response = await getSearchSuggestions(searchQuery, 5);
      if (response.success) {
        setSuggestions(response.data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    if (query.trim().length >= 2) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch('');
  };

  const handleFiltersChange = (newFilters: ISearchFilters) => {
    setHasFilters(Object.keys(newFilters).length > 0);
    onFiltersChange(newFilters);
  };

  return (
    <YStack position="relative" width="100%" className={className}>
      <XStack
        position="relative"
        alignItems="center"
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        paddingHorizontal="$3"
        paddingVertical="$2"
        gap="$2"
        $focusStyle={{
          borderColor: "$blue10",
          shadowColor: "$blue10",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
      >
        <Search size={20} color="$gray10" />
        
        <Input
          ref={inputRef}
          flex={1}
          borderWidth={0}
          backgroundColor="transparent"
          placeholder={placeholder}
          placeholderTextColor="$gray8"
          value={query}
          onChangeText={setQuery}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking on them
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          fontSize="$4"
          color="$color"
        />

        {query.length > 0 && (
          <Button
            size="$2"
            circular
            backgroundColor="transparent"
            onPress={clearSearch}
            icon={X}
            color="$gray10"
            hoverStyle={{ backgroundColor: "$gray5" }}
          />
        )}

        <Button
          size="$2"
          circular
          backgroundColor={hasFilters ? "$blue10" : "transparent"}
          onPress={() => {
            // This will be handled by parent component to show filter modal
            onFiltersChange({});
          }}
          icon={Filter}
          color={hasFilters ? "white" : "$gray10"}
          hoverStyle={{ 
            backgroundColor: hasFilters ? "$blue11" : "$gray5" 
          }}
        />
      </XStack>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <YStack
            position="absolute"
            top="100%"
            left={0}
            right={0}
            backgroundColor="$background"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.1}
            shadowRadius={8}
            elevation={8}
            zIndex={1000}
            marginTop="$1"
            maxHeight={200}
            overflow="hidden"
            enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
            exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
            animation="quick"
          >
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                backgroundColor="transparent"
                borderWidth={0}
                borderRadius={0}
                paddingHorizontal="$3"
                paddingVertical="$2"
                justifyContent="flex-start"
                onPress={() => handleSuggestionClick(suggestion)}
                hoverStyle={{ backgroundColor: "$gray5" }}
                pressStyle={{ backgroundColor: "$gray6" }}
              >
                <Text
                  fontSize="$3"
                  color="$color"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {suggestion}
                </Text>
              </Button>
            ))}
          </YStack>
        )}
      </AnimatePresence>
    </YStack>
  );
};

export default SearchBar;