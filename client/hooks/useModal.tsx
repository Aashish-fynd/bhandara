import { useState, useMemo } from "react";
import { Adapt, Sheet } from "tamagui";
import { Dialog } from "tamagui";

interface UseDialogProps {
  disableAdapt?: boolean;
  hideOnOutsideClick?: boolean;
  defaultOpen?: boolean;
}

interface UseDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  RenderContent: React.FC<{ children: React.ReactNode }>;
}

// Create the base dialog component outside the hook
const createDialogContent = (
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  disableAdapt: boolean,
  hideOnOutsideClick: boolean
) => {
  const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      {!disableAdapt && (
        <Adapt
          when="gtMd"
          platform="touch"
        >
          <Sheet
            animation="quick"
            modal
            dismissOnSnapToBottom
          >
            <Sheet.Frame
              p={"$4"}
              gap={"$4"}
              z={200}
            >
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay
              bg="$shadow6"
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              z={199}
            />
          </Sheet>
        </Adapt>
      )}

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          bg="$shadow6"
          animateOnly={["transform", "opacity"]}
          animation={[
            "quick",
            {
              opacity: {
                overshootClamping: true
              }
            }
          ]}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          onPress={() => {
            if (hideOnOutsideClick) {
              close();
            }
          }}
          z={199}
        />
        <Dialog.Content
          width={400}
          gap={"$4"}
          bordered
          elevate
          elevation={"$4"}
          shadowColor={"$shadow1"}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );

  return DialogContent;
};

export function useDialog({
  disableAdapt = false,
  hideOnOutsideClick = false,
  defaultOpen = false
}: UseDialogProps = {}): UseDialogReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  // Memoize the DialogContent component
  const RenderContent = useMemo(
    () => createDialogContent(isOpen, setIsOpen, disableAdapt, hideOnOutsideClick),
    [isOpen, setIsOpen, disableAdapt, hideOnOutsideClick]
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    RenderContent
  };
}
