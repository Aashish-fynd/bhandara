import React from 'react';
import { styled, View, Text, YStack } from 'tamagui';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ProgressContainer = styled(YStack, {
  name: "ProgressContainer",
  gap: "$2",
  animation: "lazy"
});

const ProgressBarContainer = styled(View, {
  name: "ProgressBarContainer",
  bg: "$color4",
  borderRadius: "$4",
  overflow: "hidden",
  animation: "lazy",
  
  variants: {
    size: {
      small: {
        height: 8
      },
      medium: {
        height: 12
      },
      large: {
        height: 16
      }
    }
  },
  defaultVariants: {
    size: "medium"
  }
});

const ProgressFill = styled(View, {
  name: "ProgressFill",
  bg: "$accent1",
  borderRadius: "$4",
  animation: "lazy",
  transition: "width 0.6s ease-out"
});

const ProgressLabel = styled(Text, {
  name: "ProgressLabel",
  fontSize: "$3",
  color: "$color11",
  fontWeight: "500",
  animation: "lazy"
});

const ProgressText = styled(Text, {
  name: "ProgressText",
  fontSize: "$2",
  color: "$color10",
  animation: "lazy"
});

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height,
  color = "$accent1",
  backgroundColor = "$color4",
  showLabel = true,
  label,
  animated = true,
  size = 'medium'
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const progressWidth = `${clampedProgress}%`;

  return (
    <ProgressContainer>
      {(showLabel || label) && (
        <YStack gap="$1">
          {label && (
            <ProgressLabel>
              {label}
            </ProgressLabel>
          )}
          {showLabel && (
            <ProgressText>
              {Math.round(clampedProgress)}%
            </ProgressText>
          )}
        </YStack>
      )}
      
      <ProgressBarContainer
        size={size}
        bg={backgroundColor}
        height={height}
      >
        <ProgressFill
          bg={color}
          width={progressWidth}
          height="100%"
          animation={animated ? "lazy" : "none"}
        />
      </ProgressBarContainer>
    </ProgressContainer>
  );
};

export default AnimatedProgressBar;