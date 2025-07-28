import React from 'react';
import { styled, YStack, XStack, Text, View } from 'tamagui';

interface AnimatedLoaderProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
  color?: string;
}

const SpinnerContainer = styled(View, {
  name: "SpinnerContainer",
  justifyContent: "center",
  alignItems: "center",
  animation: "lazy",
  
  variants: {
    size: {
      small: {
        width: 20,
        height: 20
      },
      medium: {
        width: 32,
        height: 32
      },
      large: {
        width: 48,
        height: 48
      }
    }
  },
  defaultVariants: {
    size: "medium"
  }
});

const Spinner = styled(View, {
  name: "Spinner",
  borderRadius: "$12",
  borderWidth: 2,
  borderColor: "$color8",
  borderTopColor: "$accent1",
  animation: "lazy",
  enterStyle: {
    rotate: "0deg"
  },
  exitStyle: {
    rotate: "360deg"
  },
  transition: "rotate 1s linear infinite"
});

const DotsContainer = styled(XStack, {
  name: "DotsContainer",
  gap: "$1",
  justifyContent: "center",
  alignItems: "center"
});

const Dot = styled(View, {
  name: "Dot",
  borderRadius: "$12",
  bg: "$accent1",
  animation: "bouncy",
  
  variants: {
    size: {
      small: {
        width: 4,
        height: 4
      },
      medium: {
        width: 6,
        height: 6
      },
      large: {
        width: 8,
        height: 8
      }
    }
  },
  defaultVariants: {
    size: "medium"
  }
});

const PulseContainer = styled(View, {
  name: "PulseContainer",
  justifyContent: "center",
  alignItems: "center",
  animation: "lazy"
});

const PulseCircle = styled(View, {
  name: "PulseCircle",
  borderRadius: "$12",
  bg: "$accent1",
  animation: "lazy",
  enterStyle: {
    scale: 0.8,
    opacity: 0.8
  },
  exitStyle: {
    scale: 1.2,
    opacity: 0
  },
  transition: "all 1s ease-in-out infinite",
  
  variants: {
    size: {
      small: {
        width: 16,
        height: 16
      },
      medium: {
        width: 24,
        height: 24
      },
      large: {
        width: 32,
        height: 32
      }
    }
  },
  defaultVariants: {
    size: "medium"
  }
});

const SkeletonContainer = styled(YStack, {
  name: "SkeletonContainer",
  gap: "$2",
  animation: "lazy"
});

const SkeletonLine = styled(View, {
  name: "SkeletonLine",
  bg: "$color6",
  borderRadius: "$2",
  animation: "lazy",
  enterStyle: {
    opacity: 0.3
  },
  exitStyle: {
    opacity: 0.7
  },
  transition: "opacity 1.5s ease-in-out infinite",
  
  variants: {
    size: {
      small: {
        height: 12
      },
      medium: {
        height: 16
      },
      large: {
        height: 20
      }
    }
  },
  defaultVariants: {
    size: "medium"
  }
});

const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  size = 'medium',
  variant = 'spinner',
  text,
  color
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <SpinnerContainer size={size}>
            <Spinner size={size} />
          </SpinnerContainer>
        );
      
      case 'dots':
        return (
          <DotsContainer>
            {[0, 1, 2].map((index) => (
              <Dot
                key={index}
                size={size}
                animation="bouncy"
                enterStyle={{
                  scale: 0.8,
                  opacity: 0.5
                }}
                exitStyle={{
                  scale: 1.2,
                  opacity: 1
                }}
                transition={`all 0.6s ease-in-out infinite ${index * 0.2}s`}
              />
            ))}
          </DotsContainer>
        );
      
      case 'pulse':
        return (
          <PulseContainer size={size}>
            <PulseCircle size={size} />
          </PulseContainer>
        );
      
      case 'skeleton':
        return (
          <SkeletonContainer>
            <SkeletonLine size={size} width="100%" />
            <SkeletonLine size={size} width="80%" />
            <SkeletonLine size={size} width="60%" />
          </SkeletonContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <YStack
      gap="$3"
      alignItems="center"
      justifyContent="center"
      animation="lazy"
    >
      {renderLoader()}
      {text && (
        <Text
          fontSize="$3"
          color="$color11"
          textAlign="center"
          animation="lazy"
          enterStyle={{
            opacity: 0,
            y: 10
          }}
          exitStyle={{
            opacity: 1,
            y: 0
          }}
          transition="all 0.3s ease-out"
        >
          {text}
        </Text>
      )}
    </YStack>
  );
};

export default AnimatedLoader;