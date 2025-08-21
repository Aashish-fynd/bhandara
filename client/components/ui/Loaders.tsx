import { Spinner } from "tamagui";
import { View } from "tamagui";
import React from "react";
import { useTheme } from "@tamagui/core";
import AnimatedLoader from "./AnimatedLoader";

export const SpinningLoader = ({
  size = "small",
  color = "$accent11"
}: {
  size?: "small" | "large";
  color?: string;
}) => {
  return (
    <Spinner
      size={size}
      color={color}
      animation="lazy"
    />
  );
};

export const EnhancedSpinningLoader = ({
  size = "medium",
  variant = "spinner",
  text
}: {
  size?: "small" | "medium" | "large";
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  text?: string;
}) => {
  return (
    <AnimatedLoader
      size={size}
      variant={variant}
      text={text}
    />
  );
};

type CircularProgressLoaderProps = {
  progress: number;
  size?: number;
  color?: any;
  trackColor?: any;
  children?: React.ReactNode;
};

export const CircularProgressLoader = ({
  progress,
  size = 40,
  color = "$accent11",
  trackColor = "$color4",
  children
}: CircularProgressLoaderProps) => {
  if (progress < 0 || progress > 100) return null;

  const radius = size / 2;
  const strokeWidth = 4;
  const adjustedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * adjustedRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const theme = useTheme();

  const resolvedColor = theme[color]?.get();
  const resolvedTrackColor = theme[trackColor]?.get();

  return (
    <View
      width={size}
      height={size}
      position="relative"
      items="center"
      justify="center"
      animation="lazy"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={radius}
          cy={radius}
          r={adjustedRadius}
          fill="none"
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius}
          cy={radius}
          r={adjustedRadius}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${radius} ${radius})`}
          strokeLinecap="round"
          style={{ 
            transition: "stroke-dashoffset 0.6s ease-out",
            animation: "lazy"
          }}
        />
      </svg>

      {children && (
        <View
          position="absolute"
          items="center"
          justify="center"
          width={size}
          height={size}
          pointerEvents="none"
          animation="lazy"
        >
          {children}
        </View>
      )}
    </View>
  );
};
