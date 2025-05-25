import { getAllTags, getSubTags } from "@/common/api/tags.action";
import { ITag } from "@/definitions/types";
import { useDataLoader } from "@/hooks";
import React, { Fragment, useRef, useState } from "react";
import { Text, View, XStack } from "tamagui";
import { ChevronRight } from "@tamagui/lucide-icons";
import Loader from "@/components/ui/Loader";

const TagButton = ({
  tag,
  isSelected,
  isExpanded,
  onPress,
  isLoading,
  hasChildren
}: {
  tag: ITag;
  isSelected: boolean;
  isExpanded: boolean;
  onPress: () => void;
  isLoading: boolean;
  hasChildren: boolean;
}) => {
  const borderColor = isExpanded ? "$color02" : isSelected ? "$color7" : "$borderColor";
  const bg = isExpanded ? "$accent12" : !isSelected ? "inherit" : "$accent9";

  return (
    <XStack
      gap={"$2"}
      rounded={"$12"}
      px={"$3"}
      py={"$2"}
      items="center"
      borderWidth={1}
      borderColor={borderColor}
      bg={bg}
      cursor={"pointer"}
      onPress={onPress}
      hoverStyle={{ borderColor: "$color7", transition: "border-color 0.2s ease-in-out" }}
      transition="all 0.3s ease-in-out"
    >
      <Text>{tag.icon}</Text>
      <Text
        fontSize={"$2"}
        color={isSelected ? "$color1" : "$color08"}
      >
        {tag.name}
      </Text>
      {isLoading ? (
        <Loader />
      ) : hasChildren && (!isExpanded || !tag.subTags) ? (
        <ChevronRight
          size={16}
          color={isSelected ? "$color1" : "$color08"}
        />
      ) : null}
    </XStack>
  );
};

const InterestSelection = ({ cb }: { cb: (tag: ITag[]) => void }) => {
  const { loading, error } = useDataLoader(getAllTags, (data) => {
    setTags(data?.data || []);
  });
  const [tags, setTags] = useState<ITag[]>([]);
  const [loadingSubTagOf, setLoadingSubTagOf] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [expandedTagIds, setExpandedTagIds] = useState<string[]>([]);
  const subTagsLoadedParentIds = useRef<Set<string>>(new Set());

  const handleTagPress = async (tag: ITag) => {
    if (tag.hasChildren) {
      // Toggle expanded state
      setExpandedTagIds((prev) => (prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]));

      // Load subtags if not already loaded
      if (!subTagsLoadedParentIds.current.has(tag.id)) {
        setLoadingSubTagOf(tag.id);
        const { data: subTags, error: subTagsError } = await getSubTags(tag.id);

        if (subTags && !subTagsError) {
          setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, subTags } : t)));
          subTagsLoadedParentIds.current.add(tag.id);
        }
        setLoadingSubTagOf(null);
      }
    } else {
      // Handle selection of leaf tags
      const isAlreadySelected = selectedTags.some((t) => t.id === tag.id);
      const newSelectedTags = isAlreadySelected ? selectedTags.filter((t) => t.id !== tag.id) : [...selectedTags, tag];

      setSelectedTags(newSelectedTags);
      setExpandedTagIds((prev) => prev.filter((id) => id !== tag.id));
      cb(newSelectedTags);
    }
  };

  const isTagSelected = (tag: ITag, isExpanded: boolean) => {
    return !!(
      selectedTags.some((t) => t.id === tag.id) ||
      (!isExpanded && tag.subTags?.some((subTag) => selectedTags.some((selectedTag) => selectedTag.id === subTag.id)))
    );
  };

  if (loading) {
    return (
      <View
        height={"75%"}
        width={"100%"}
        justify="center"
        items="center"
      >
        <Loader />
      </View>
    );
  }

  return (
    <XStack
      flexWrap="wrap"
      gap={"$4"}
      maxH={"70%"}
      overflow="scroll"
    >
      {tags?.map((tag) => {
        const isExpanded = expandedTagIds.includes(tag.id);
        const isSelected = isTagSelected(tag, isExpanded);
        const hasChildTagsLoaded = subTagsLoadedParentIds.current.has(tag.id);

        return (
          <Fragment key={tag.id}>
            <TagButton
              tag={tag}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onPress={() => handleTagPress(tag)}
              isLoading={loadingSubTagOf === tag.id}
              hasChildren={!!tag.hasChildren}
            />

            {hasChildTagsLoaded &&
              isExpanded &&
              tag.subTags?.map((subTag) => (
                <TagButton
                  key={subTag.id}
                  tag={subTag}
                  isSelected={selectedTags.some((t) => t.id === subTag.id)}
                  isExpanded={false}
                  onPress={() => handleTagPress(subTag)}
                  isLoading={false}
                  hasChildren={false}
                />
              ))}
          </Fragment>
        );
      })}
    </XStack>
  );
};

export default InterestSelection;
