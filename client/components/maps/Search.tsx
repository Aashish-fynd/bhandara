import { retrieveSearchItem, suggestSearchResults } from "@/common/api/mapbox";
import { formatDistance, getUUIDv4 } from "@/helpers";
import { ArrowUp, ChevronUp, Cross, MapPin, Route, X } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Input, Spinner, Text, useDebounce, View, XStack, YStack } from "tamagui";
import { FilledButton } from "../ui/Buttons";
import PulsatingDot from "../PulsatingDot";
import Loader from "../ui/Loader";

interface SearchResult {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address: string;
  full_address: string;
  place_formatted: string;
  context: {
    country: {
      name: string;
      country_code: string;
      country_code_alpha_3: string;
    };
    postcode: {
      id: string;
      name: string;
    };
    place: {
      id: string;
      name: string;
    };
    street?: {
      name: string;
    };
  };
  language: string;
  maki: string;
  poi_category: string[];
  poi_category_ids: string[];
  external_ids: {
    dataplor: string;
  };
  metadata: Record<string, unknown>;
  distance: number;
}

const Search = forwardRef(
  (
    {
      currentLocation,
      onSearchResultSelect
    }: {
      currentLocation?: [number, number];
      onSearchResultSelect: (result: any) => void;
    },
    ref
  ) => {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const sessionToken = useRef("");
    const toastController = useToastController();
    const [isLoading, setIsLoading] = useState(false);
    const currentRetrievedCachedResults = useRef<{ [key: string]: any }>({});
    const [isMinimized, setIsMinimized] = useState(false);
    const currentMinimizedSearchId = useRef<string | null>(null);
    const onSearchResultSelectRef = useRef<any>(onSearchResultSelect);
    const currentLocationRef = useRef<[number, number] | undefined>(currentLocation);

    useImperativeHandle(ref, () => ({
      setCallBack: (callback: (result: any) => void) => {
        onSearchResultSelectRef.current = callback;
      },
      setCurrentLocation: (location: [number, number]) => {
        currentLocationRef.current = location;
      }
    }));

    const handleSearchResults = async (text: string) => {
      try {
        setIsLoading(true);
        const results = await suggestSearchResults({
          search: text,
          proximity: currentLocationRef.current,
          sessionToken: sessionToken.current
        });
        setResults(results);
      } catch (error: any) {
        toastController.show(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const debouncedAddressSearch = useDebounce(handleSearchResults, 700);

    const handleAddressSearch = async (text: string) => {
      if (!sessionToken.current) return;
      if (isMinimized) {
        setIsMinimized(false);
      }
      debouncedAddressSearch.cancel();
      setSearch(text);

      if (text.length < 3) return;
      debouncedAddressSearch(text);
    };

    const handleSuggestionPress = (mapboxId: string) => async () => {
      try {
        if (currentRetrievedCachedResults.current[mapboxId]) {
          onSearchResultSelectRef.current?.(currentRetrievedCachedResults.current[mapboxId]);
          currentMinimizedSearchId.current = mapboxId;
          setIsMinimized(true);
          return;
        }
        const result = await retrieveSearchItem({
          mapboxId,
          sessionToken: sessionToken.current
        });
        currentRetrievedCachedResults.current[mapboxId] = result;
        currentMinimizedSearchId.current = mapboxId;

        onSearchResultSelectRef.current?.(result);
        setIsMinimized(true);
      } catch (error: any) {
        toastController.show(error.message || "Something went wrong while fetching the address");
      }
    };

    useEffect(() => {
      sessionToken.current = getUUIDv4();
    }, []);

    return (
      <>
        <View
          z={1000}
          maxW={"70%"}
          width={"100%"}
        >
          <View width={"100%"}>
            <Input
              placeholder="Search for an address"
              value={search}
              onChangeText={handleAddressSearch}
              width={"100%"}
              height={36}
              onPressIn={() => {
                if (isMinimized) {
                  setIsMinimized(false);
                }
              }}
            />
            {search.length > 0 && (
              <View
                position="absolute"
                items={"center"}
                justify={"center"}
                t={0}
                r={"$3"}
                z={1000}
                height={"100%"}
                onPress={() => setSearch("")}
                animation={"quick"}
                cursor={"pointer"}
              >
                <X
                  onPress={() => setSearch("")}
                  size={20}
                  color={"$color12"}
                />
              </View>
            )}
          </View>
          <View
            position="absolute"
            t={"110%"}
            l={0}
            width={"100%"}
            height={isLoading ? 200 : "auto"}
            maxH={isLoading ? 200 : 400}
            rounded={"$4"}
            bg={"$background"}
            borderWidth={1}
            borderColor={"$borderColor"}
            overflow="hidden"
            display={search.length > 3 && !isMinimized ? "flex" : "none"}
            justify={"flex-start"}
            items={"flex-start"}
            gap={"$3"}
            p={"$3"}
            overflowY={"auto"}
            animation={"quick"}
          >
            {isLoading ? (
              <View
                height={200}
                justify="center"
                items="center"
                width={"100%"}
              >
                <Loader />
              </View>
            ) : results?.length ? (
              results.map((suggestion) => (
                <YStack
                  key={suggestion.mapbox_id}
                  gap={"$1"}
                  width={"100%"}
                  cursor="pointer"
                  onPress={handleSuggestionPress(suggestion.mapbox_id)}
                >
                  <XStack
                    items={"center"}
                    gap={"$1"}
                  >
                    <MapPin
                      size={12}
                      fill={"$color"}
                    />
                    <Text fontSize={"$3"}>{suggestion.name}</Text>
                  </XStack>
                  <Text
                    fontSize={"$1"}
                    numberOfLines={1}
                    ellipse
                    fontWeight={300}
                    color={"$color06"}
                  >
                    {suggestion.full_address}
                  </Text>

                  {suggestion.distance && (
                    <XStack
                      items={"center"}
                      gap={"$1"}
                    >
                      <Route
                        size={12}
                        fill={"$color06"}
                      />
                      <Text
                        fontSize={"$1"}
                        color={"$color06"}
                      >
                        {formatDistance(suggestion.distance)}
                      </Text>
                    </XStack>
                  )}
                </YStack>
              ))
            ) : (
              <View
                height={200}
                justify="center"
                items="center"
                width={"100%"}
              >
                <Text>No results found</Text>
              </View>
            )}
          </View>
        </View>

        {/* minimized state */}
        {isMinimized && currentMinimizedSearchId.current && (
          <View
            position="absolute"
            b={"$8"}
            l={0}
            r={0}
            z={1000}
            items={"center"}
            width={"100%"}
          >
            <XStack
              gap={"$3"}
              p={"$3"}
              rounded={"$6"}
              bg={"$background"}
              width={"auto"}
              onPress={handleSuggestionPress(currentMinimizedSearchId.current)}
              cursor={"pointer"}
              items={"center"}
              maxW={"80%"}
            >
              <PulsatingDot
                size={10}
                color="$accent1"
              />
              <YStack
                gap={"$1"}
                flex={1}
              >
                <Text
                  fontSize={"$3"}
                  numberOfLines={1}
                  ellipse
                  color={"$color"}
                >
                  {currentRetrievedCachedResults.current[currentMinimizedSearchId.current].properties.name}
                </Text>
                <Text
                  fontSize={"$1"}
                  numberOfLines={1}
                  ellipse
                  fontWeight={300}
                  color={"$color06"}
                >
                  {currentRetrievedCachedResults.current[currentMinimizedSearchId.current].properties.full_address}
                </Text>
              </YStack>

              {currentRetrievedCachedResults.current[currentMinimizedSearchId.current].properties.distance && (
                <Text
                  fontSize={"$1"}
                  color={"$accentColor"}
                  bg={"$accentBackground"}
                  py={"$1"}
                  px={"$2"}
                  rounded={10000}
                >
                  {formatDistance(
                    currentRetrievedCachedResults.current[currentMinimizedSearchId.current].properties.distance
                  )}
                </Text>
              )}

              <FilledButton
                p={0}
                height={28}
                width={28}
                rounded={"$3"}
                justify={"center"}
                items={"center"}
                icon={
                  <ArrowUp
                    size={16}
                    stroke={"$background"}
                  />
                }
                onPress={(e) => {
                  e.stopPropagation();
                  setIsMinimized(false);
                }}
              />
            </XStack>
          </View>
        )}
      </>
    );
  }
);

export default Search;
