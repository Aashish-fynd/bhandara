import React, { useState } from "react";
import { Button, Text, YStack, XStack, styled } from "tamagui";
import DateTimePicker from "@react-native-community/datetimepicker";
import { QUICK_RANGES } from "./quickRanges";

const SidebarButton = styled(Button, {
  justify: "flex-start",
  rounded: 0,
  bg: "transparent",
  color: "$color",
  px: "$3",
  py: "$2",
  pressStyle: { bg: "$black3" }
});

export default function DateRangePicker() {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date }>({});

  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);


  const formatDate = (date?: Date) => (date ? date.toDateString() : "Select Date");
  const formatTime = (date?: Date) =>
    date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Select Time";

  return (
    <YStack gap="$2">
      <Button
        onPress={() => setShowOptions((p) => !p)}
        size="$2"
      >
        {showOptions ? "Hide options" : "Show options"}
      </Button>
      {showOptions && (
        <YStack gap="$2">
          {QUICK_RANGES.map(({ label, range }) => (
            <SidebarButton
              key={label}
              onPress={() => setSelectedRange(range)}
            >
              {label}
            </SidebarButton>
          ))}
        </YStack>
      )}

      <XStack gap="$2">
        <Button onPress={() => setShowStartDate(true)}>{formatDate(selectedRange.from)}</Button>
        <Button onPress={() => setShowStartTime(true)}>{formatTime(selectedRange.from)}</Button>
      </XStack>
      <XStack gap="$2">
        <Button onPress={() => setShowEndDate(true)}>{formatDate(selectedRange.to)}</Button>
        <Button onPress={() => setShowEndTime(true)}>{formatTime(selectedRange.to)}</Button>
      </XStack>

      {showStartDate && (
        <DateTimePicker
          value={selectedRange.from || new Date()}
          mode="date"
          onChange={(e, date) => {
            setShowStartDate(false);
            if (date) setSelectedRange((prev) => ({ ...prev, from: date }));
          }}
        />
      )}
      {showEndDate && (
        <DateTimePicker
          value={selectedRange.to || new Date()}
          mode="date"
          onChange={(e, date) => {
            setShowEndDate(false);
            if (date) setSelectedRange((prev) => ({ ...prev, to: date }));
          }}
        />
      )}
      {showStartTime && (
        <DateTimePicker
          value={selectedRange.from || new Date()}
          mode="time"
          onChange={(e, date) => {
            setShowStartTime(false);
            if (date) setSelectedRange((prev) => ({ ...prev, from: date }));
          }}
        />
      )}
      {showEndTime && (
        <DateTimePicker
          value={selectedRange.to || new Date()}
          mode="time"
          onChange={(e, date) => {
            setShowEndTime(false);
            if (date) setSelectedRange((prev) => ({ ...prev, to: date }));
          }}
        />
      )}
    </YStack>
  );
}
