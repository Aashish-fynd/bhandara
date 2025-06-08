import { Adapt, Button, Input, Label, Popover, PopoverProps, XStack, YStack } from "tamagui";

interface IProps extends PopoverProps {
  children?: React.ReactNode;
  shouldAdapt?: boolean;
  trigger?: React.ReactNode;
}

export function PopoverWrapper({ children, shouldAdapt, trigger, ...props }: IProps) {
  return (
    <Popover
      size="$5"
      allowFlip
      stayInFrame
      offset={15}
      resize
      {...props}
    >
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>

      {shouldAdapt && (
        <Adapt
          when="gtMd"
          platform="touch"
        >
          <Popover.Sheet
            animation="quick"
            modal
            dismissOnSnapToBottom
          >
            <Popover.Sheet.Frame>
              <Adapt.Contents />
            </Popover.Sheet.Frame>
            <Popover.Sheet.Overlay
              bg="$shadowColor"
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Popover.Sheet>
        </Adapt>
      )}

      {children}
    </Popover>
  );
}
