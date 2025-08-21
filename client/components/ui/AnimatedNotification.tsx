import React from 'react';
import { styled, YStack, Text, XStack, View } from 'tamagui';
import { AlertCircle, CheckCircle, Info, X } from '@tamagui/lucide-icons';

interface AnimatedNotificationProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  size?: 'small' | 'medium' | 'large';
}

const NotificationContainer = styled(YStack, {
  name: "NotificationContainer",
  bg: "$color2",
  borderWidth: 1,
  borderRadius: "$4",
  padding: "$3",
  gap: "$2",
  animation: "bouncy",
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  pressStyle: {
    scale: 0.98
  },
  hoverStyle: {
    scale: 1.01,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  },
  
  variants: {
    type: {
      success: {
        borderColor: "$green8",
        bg: "$green2",
        hoverStyle: {
          borderColor: "$green9",
          bg: "$green3"
        }
      },
      error: {
        borderColor: "$red8",
        bg: "$red2",
        hoverStyle: {
          borderColor: "$red9",
          bg: "$red3"
        }
      },
      warning: {
        borderColor: "$yellow8",
        bg: "$yellow2",
        hoverStyle: {
          borderColor: "$yellow9",
          bg: "$yellow3"
        }
      },
      info: {
        borderColor: "$blue8",
        bg: "$blue2",
        hoverStyle: {
          borderColor: "$blue9",
          bg: "$blue3"
        }
      }
    },
    size: {
      small: {
        padding: "$2",
        gap: "$1"
      },
      medium: {
        padding: "$3",
        gap: "$2"
      },
      large: {
        padding: "$4",
        gap: "$3"
      }
    }
  },
  defaultVariants: {
    type: "info",
    size: "medium"
  }
});

const NotificationHeader = styled(XStack, {
  name: "NotificationHeader",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$2",
  animation: "lazy"
});

const IconContainer = styled(View, {
  name: "IconContainer",
  animation: "bouncy"
});

const CloseButton = styled(View, {
  name: "CloseButton",
  padding: "$1",
  borderRadius: "$2",
  cursor: "pointer",
  animation: "quick",
  pressStyle: {
    scale: 0.9,
    bg: "$color4"
  },
  hoverStyle: {
    scale: 1.1,
    bg: "$color4"
  }
});

const NotificationTitle = styled(Text, {
  name: "NotificationTitle",
  fontSize: "$4",
  fontWeight: "600",
  color: "$color12",
  animation: "lazy"
});

const NotificationMessage = styled(Text, {
  name: "NotificationMessage",
  fontSize: "$3",
  color: "$color11",
  animation: "lazy"
});

const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  autoClose = false,
  duration = 5000,
  size = 'medium'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="$green9" />;
      case 'error':
        return <AlertCircle size={20} color="$red9" />;
      case 'warning':
        return <AlertCircle size={20} color="$yellow9" />;
      case 'info':
        return <Info size={20} color="$blue9" />;
      default:
        return <Info size={20} color="$blue9" />;
    }
  };

  return (
    <NotificationContainer
      type={type}
      size={size}
      animation="bouncy"
      enterStyle={{
        opacity: 0,
        scale: 0.9,
        y: -20
      }}
      exitStyle={{
        opacity: 0,
        scale: 0.9,
        y: -20
      }}
    >
      <NotificationHeader>
        <XStack alignItems="center" gap="$2">
          <IconContainer>
            {getIcon()}
          </IconContainer>
          {title && (
            <NotificationTitle>
              {title}
            </NotificationTitle>
          )}
        </XStack>
        
        {onClose && (
          <CloseButton onPress={onClose}>
            <X size={16} color="$color10" />
          </CloseButton>
        )}
      </NotificationHeader>
      
      {message && (
        <NotificationMessage>
          {message}
        </NotificationMessage>
      )}
    </NotificationContainer>
  );
};

export default AnimatedNotification;