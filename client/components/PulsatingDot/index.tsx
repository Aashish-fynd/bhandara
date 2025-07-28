import React from "react";
import { styled, View, YStack } from "tamagui";

interface PulsatingDotProps {
  size?: number;
  color?: string;
  pulseScale?: number;
  duration?: number;
}

const DotContainer = styled(YStack, {
  name: "PulsatingDotContainer",
  alignItems: "center",
  justifyContent: "center",
  animation: "lazy"
});

const PulseRing = styled(View, {
  name: "PulseRing",
  position: "absolute",
  borderRadius: "$12",
  animation: "lazy",
  transition: "all 1.2s ease-out infinite"
});

const MainDot = styled(View, {
  name: "MainDot",
  borderRadius: "$12",
  zIndex: 1,
  animation: "lazy"
});

const PulsatingDot: React.FC<PulsatingDotProps> = ({ 
  size = 16, 
  color = "$accent1", 
  pulseScale = 2.5, 
  duration = 1200 
}) => {
  return (
    <DotContainer>
      <View
        width={size}
        height={size}
        position="relative"
        alignItems="center"
        justifyContent="center"
      >
        <PulseRing
          width={size}
          height={size}
          bg={color}
          style={{
            transform: [{ scale: pulseScale }],
            opacity: 0,
            animation: `pulse ${duration}ms ease-out infinite`
          }}
        />
        <MainDot
          width={size}
          height={size}
          bg={color}
        />
      </View>
    </DotContainer>
  );
};

export default PulsatingDot;
