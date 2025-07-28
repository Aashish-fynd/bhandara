import React from 'react';
import { Button, styled } from 'tamagui';

interface CheckInButtonProps {
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
}

const CheckInButtonBase = styled(Button, {
  bg: "$green11",
  color: "$green1",
  borderRadius: "$4",
  padding: "$3",
  alignItems: "center",
  justifyContent: "center",
  animation: "bouncy",
  pressStyle: {
    scale: 0.95,
    opacity: 0.8,
    y: 2,
    bg: "$green10"
  },
  hoverStyle: {
    scale: 1.02,
    y: -1,
    bg: "$green10",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
  transition: "all 0.2s ease-out",
  
  variants: {
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
    },
    loading: {
      true: {
        opacity: 0.7,
        cursor: "wait"
      }
    }
  }
});

const CheckInButton: React.FC<CheckInButtonProps> = ({ onPress, disabled = false, loading = false }) => {
    return (
        <CheckInButtonBase
            onPress={onPress}
            disabled={disabled || loading}
            loading={loading}
            animation="bouncy"
        >
            {loading ? "Checking In..." : "Check In Event"}
        </CheckInButtonBase>
    );
};

export default CheckInButton;
