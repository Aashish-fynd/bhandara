import React, { useState } from 'react';
import { styled, YStack, XStack, Text, View } from 'tamagui';
import { AnimatePresence } from 'tamagui';

interface InteractiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  size?: 'small' | 'medium' | 'large';
}

const CardContainer = styled(YStack, {
  name: "InteractiveCard",
  bg: "$color3",
  borderRadius: "$4",
  borderWidth: 1,
  borderColor: "$color8",
  overflow: "hidden",
  animation: "bouncy",
  pressStyle: {
    scale: 0.98,
    opacity: 0.9,
    y: 2
  },
  hoverStyle: {
    scale: 1.02,
    y: -2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderColor: "$color9"
  },
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  transition: "all 0.3s ease-out",
  cursor: "pointer",

  variants: {
    variant: {
      default: {
        bg: "$color3",
        borderColor: "$color8"
      },
      elevated: {
        bg: "$color2",
        borderColor: "$color7",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
        hoverStyle: {
          scale: 1.03,
          y: -3,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 12
        }
      },
      outlined: {
        bg: "transparent",
        borderColor: "$color8",
        borderWidth: 2,
        hoverStyle: {
          borderColor: "$color9",
          bg: "$color2",
          scale: 1.02,
          y: -2
        }
      }
    },
    size: {
      small: {
        padding: "$2",
        gap: "$2"
      },
      medium: {
        padding: "$3",
        gap: "$3"
      },
      large: {
        padding: "$4",
        gap: "$4"
      }
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: "not-allowed",
        pressStyle: {
          scale: 1,
          opacity: 0.5,
          y: 0
        },
        hoverStyle: {
          scale: 1,
          y: 0
        }
      }
    }
  },
  defaultVariants: {
    variant: "default",
    size: "medium"
  }
});

const RippleEffect = styled(View, {
  position: "absolute",
  borderRadius: "$4",
  bg: "$color12",
  opacity: 0.3,
  animation: "quick",
  scale: 0,
  enterStyle: {
    scale: 0,
    opacity: 0.3
  },
  exitStyle: {
    scale: 4,
    opacity: 0
  }
});

const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  variant = 'default',
  size = 'medium'
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = (event: any) => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // Create ripple effect
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    onLongPress?.();
  };

  return (
    <CardContainer
      variant={variant}
      size={size}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      position="relative"
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <RippleEffect
            key={ripple.id}
            position="absolute"
            left={ripple.x - 10}
            top={ripple.y - 10}
            width={20}
            height={20}
            animation="quick"
            enterStyle={{
              scale: 0,
              opacity: 0.3
            }}
            exitStyle={{
              scale: 4,
              opacity: 0
            }}
          />
        ))}
      </AnimatePresence>
      
      {children}
    </CardContainer>
  );
};

export default InteractiveCard;