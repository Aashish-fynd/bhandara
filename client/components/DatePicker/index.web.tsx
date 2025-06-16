import "react-day-picker/src/style.css";

import { useState } from "react";
import { Platform } from "react-native";
import { YStack, XStack, Button, Text, styled, useMedia } from "tamagui";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Day, DayButton, DayPicker, Weekday, Weekdays } from "react-day-picker";
import { OutlineButton } from "../ui/Buttons";
import { QUICK_RANGES } from "./quickRanges";

const SidebarButton = styled(Button, {
  justify: "flex-start",
  rounded: 0,
  bg: "transparent",
  color: "$color",
  px: "$3",
  py: "$2",
  hoverStyle: { bg: "$black2" },
  pressStyle: { bg: "$black3" }
});

const CalendarContainer = styled(XStack, {
  rounded: "$4",
  borderWidth: 1,
  borderColor: "$black6",
  bg: "$background",
  p: "$4",
  gap: "$4",
  overflow: "hidden"
});

const DateRangeDisplay = ({ from, to }: { from?: Date; to?: Date }) => (
  <XStack gap="$2">
    <Text>{from ? from.toDateString() : "Start"}</Text>
    <Text>-</Text>
    <Text>{to ? to.toDateString() : "End"}</Text>
  </XStack>
);

const StyledDayButton = styled(DayButton, {
  variants: {
    isSelected: {
      true: {
        bg: "$color6",
        borderWidth: 1,
        borderColor: "$color6"
      }
    },
    isInRange: {
      true: {
        bg: "$color2",
        borderWidth: 0,
        rounded: 0,
        borderColor: "transparent"
      }
    },
    isToday: {
      true: {
        borderWidth: 1,
        borderColor: "$color12",
        bg: "$color12"
      }
    }
  } as const
});

const StyledDay = styled(Day, {
  variants: {
    isInRange: {
      true: {
        background: "$color6"
      }
    },
    isStart: {
      true: {
        background: "$color6",
        borderTopLeftRadius: 10000,
        borderBottomLeftRadius: 10000
      }
    },
    isEnd: {
      true: {
        background: "$color6",
        borderTopRightRadius: 10000,
        borderBottomRightRadius: 10000
      }
    }
  } as const
});

export default function DateRangePicker() {
  const media = useMedia();
  const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date }>({});
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("00:00");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showSidebar = media.md || sidebarOpen;

  const handleTimeChange = (key: "from" | "to", value: string) => {
    const [h, m] = value.split(":");
    setSelectedRange((prev) => {
      const date = prev[key] || new Date();
      const newDate = new Date(date);
      newDate.setHours(parseInt(h, 10));
      newDate.setMinutes(parseInt(m, 10));
      return { ...prev, [key]: newDate } as any;
    });
    key === "from" ? setStartTime(value) : setEndTime(value);
  };

  return (
    <CalendarContainer>
      {!showSidebar && (
        <Button
          onPress={() => setSidebarOpen(true)}
          size={"$2"}
          mb="$2"
        >
          Show options
        </Button>
      )}
      {showSidebar && (
        <YStack
          width={150}
          gap="$2"
        >
          {!media.md && (
            <Button
              size={"$2"}
              mb="$2"
              onPress={() => setSidebarOpen(false)}
            >
              Hide options
            </Button>
          )}
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

      <YStack
        gap="$4"
        flex={1}
        justify="space-between"
      >
        {Platform.OS === "web" ? (
          <XStack
            gap="$4"
            overflowX="scroll"
          >
            <DayPicker
              mode="range"
              animate={true}
              components={{
                Weekday: ({ children, ...props }) => {
                  return (
                    <Weekday {...props}>
                      <Text>{children}</Text>
                    </Weekday>
                  );
                },
                Day: ({ children, ...props }) => {
                  const { onBlur, onFocus, onMouseEnter, onMouseLeave, onClick, modifiers } = props;

                  const isInRange = modifiers.range_middle;
                  const isStart = modifiers.range_start;
                  const isEnd = modifiers.range_end;

                  return (
                    <StyledDay
                      {...(props as any)}
                      isInRange={isInRange}
                      isStart={isStart}
                      isEnd={isEnd}
                    >
                      {children}
                    </StyledDay>
                  );
                },
                DayButton: ({ children, ...props }) => {
                  const { modifiers } = props;

                  const isSelected = modifiers.selected || modifiers.range_start || modifiers.range_end;
                  const isInRange = modifiers.range_middle;

                  const isToday = modifiers.today;

                  return (
                    <StyledDayButton
                      {...(props as any)}
                      isSelected={isSelected}
                      isInRange={isInRange}
                      isToday={isToday}
                    >
                      <Text fontSize={"$4"}>{children}</Text>
                    </StyledDayButton>
                  );
                }
              }}
              selected={{
                from: selectedRange.from,
                to: selectedRange.to
              }}
              onSelect={(range) => setSelectedRange(range || {})}
              month={new Date(2025, 0)}
              numberOfMonths={1}
              defaultMonth={new Date(2025, 0)}
            />
          </XStack>
        ) : (
          <YStack gap="$2">
            <Button onPress={() => setShowStart(true)}>
              {selectedRange?.from?.toDateString() || "Pick Start Date"}
            </Button>
            <Button onPress={() => setShowEnd(true)}>{selectedRange?.to?.toDateString() || "Pick End Date"}</Button>
            {showStart && (
              <DateTimePicker
                value={selectedRange?.from || new Date()}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowStart(false);
                  if (date) setSelectedRange((prev) => ({ ...prev, from: date }));
                }}
              />
            )}
            {showEnd && (
              <DateTimePicker
                value={selectedRange?.to || new Date()}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowEnd(false);
                  if (date) setSelectedRange((prev) => ({ ...prev, to: date }));
                }}
              />
            )}
          </YStack>
        )}

        <XStack
          gap="$2"
          mb="$2"
        >
          <input
            type="time"
            value={startTime}
            onChange={(e) => handleTimeChange("from", e.target.value)}
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => handleTimeChange("to", e.target.value)}
          />
        </XStack>

        <YStack
          justify="space-between"
          items="center"
          gap={"$2"}
        >
          <DateRangeDisplay
            from={selectedRange?.from}
            to={selectedRange?.to}
          />
          <XStack
            gap="$2"
            justify={"flex-end"}
            width="100%"
          >
            <OutlineButton
              onPress={() => setSelectedRange({})}
              size={"medium"}
            >
              Cancel
            </OutlineButton>
            <OutlineButton size={"medium"}>Apply</OutlineButton>
          </XStack>
        </YStack>
      </YStack>
    </CalendarContainer>
  );
}
