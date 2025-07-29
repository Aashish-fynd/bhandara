import React from 'react';
import { styled, Switch, YStack, Text, XStack } from 'tamagui';

interface AnimatedToggleProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ToggleContainer = styled(YStack, {
  name: "AnimatedToggleContainer",
  gap: "$2",
  animation: "lazy"
});

const ToggleRow = styled(XStack, {
  name: "ToggleRow",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$3",
  animation: "lazy"
});

const LabelContainer = styled(YStack, {
  name: "LabelContainer",
  flex: 1,
  gap: "$1",
  animation: "lazy"
});

const ToggleLabel = styled(Text, {
  name: "ToggleLabel",
  fontSize: "$4",
  fontWeight: "500",
  color: "$color12",
  animation: "lazy"
});

const ToggleDescription = styled(Text, {
  name: "ToggleDescription",
  fontSize: "$3",
  color: "$color11",
  animation: "lazy"
});

const StyledSwitch = styled(Switch, {
  name: "AnimatedSwitch",
  animation: "bouncy",
  pressStyle: {
    scale: 0.95
  },
  hoverStyle: {
    scale: 1.05
  },
  
  variants: {
    size: {
      small: {
        scale: 0.8
      },
      medium: {
        scale: 1
      },
      large: {
        scale: 1.2
      }
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: "not-allowed",
        pressStyle: {
          scale: 1
        },
        hoverStyle: {
          scale: 1
        }
      }
    }
  },
  defaultVariants: {
    size: "medium"
  }
});

const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  value = false,
  onValueChange,
  label,
  description,
  disabled = false,
  size = 'medium'
}) => {
  return (
    <ToggleContainer>
      <ToggleRow>
        {(label || description) && (
          <LabelContainer>
            {label && (
              <ToggleLabel>
                {label}
              </ToggleLabel>
            )}
            {description && (
              <ToggleDescription>
                {description}
              </ToggleDescription>
            )}
          </LabelContainer>
        )}
        
        <StyledSwitch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          size={size}
          animation="bouncy"
        />
      </ToggleRow>
    </ToggleContainer>
  );
};

export default AnimatedToggle;