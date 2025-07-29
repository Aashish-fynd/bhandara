import React from 'react';
import { styled, Input, YStack, Text, XStack } from 'tamagui';
import { AlertCircle, CheckCircle } from '@tamagui/lucide-icons';

interface AnimatedInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  size?: 'small' | 'medium' | 'large';
}

const InputContainer = styled(YStack, {
  name: "AnimatedInputContainer",
  gap: "$2",
  animation: "lazy"
});

const InputLabel = styled(Text, {
  name: "InputLabel",
  fontSize: "$3",
  color: "$color11",
  fontWeight: "500",
  animation: "lazy"
});

const StyledInput = styled(Input, {
  name: "AnimatedInput",
  bg: "$color2",
  borderWidth: 1,
  borderColor: "$color7",
  borderRadius: "$4",
  animation: "bouncy",
  focusStyle: {
    borderColor: "$accent1",
    bg: "$color1",
    scale: 1.01,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  hoverStyle: {
    borderColor: "$color8",
    bg: "$color3"
  },
  pressStyle: {
    scale: 0.99
  },
  
  variants: {
    size: {
      small: {
        fontSize: "$3",
        padding: "$2"
      },
      medium: {
        fontSize: "$4",
        padding: "$3"
      },
      large: {
        fontSize: "$5",
        padding: "$4"
      }
    },
    error: {
      true: {
        borderColor: "$red8",
        focusStyle: {
          borderColor: "$red9",
          bg: "$red1",
          scale: 1.01
        }
      }
    },
    success: {
      true: {
        borderColor: "$green8",
        focusStyle: {
          borderColor: "$green9",
          bg: "$green1",
          scale: 1.01
        }
      }
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: "not-allowed",
        focusStyle: {
          scale: 1,
          bg: "$color2"
        },
        hoverStyle: {
          bg: "$color2"
        }
      }
    }
  },
  defaultVariants: {
    size: "medium"
  }
});

const ErrorText = styled(Text, {
  name: "ErrorText",
  fontSize: "$2",
  color: "$red9",
  animation: "quick"
});

const SuccessText = styled(Text, {
  name: "SuccessText",
  fontSize: "$2",
  color: "$green9",
  animation: "quick"
});

const IconContainer = styled(XStack, {
  name: "IconContainer",
  position: "absolute",
  right: "$2",
  top: "50%",
  transform: [{ translateY: -8 }],
  animation: "bouncy"
});

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  success = false,
  disabled = false,
  type = 'text',
  size = 'medium'
}) => {
  return (
    <InputContainer>
      {label && (
        <InputLabel>
          {label}
        </InputLabel>
      )}
      
      <YStack position="relative">
        <StyledInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          disabled={disabled}
          size={size}
          error={!!error}
          success={success}
          type={type}
          secureTextEntry={type === 'password'}
          keyboardType={type === 'email' ? 'email-address' : type === 'number' ? 'numeric' : 'default'}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={type === 'email' ? false : true}
        />
        
        {(error || success) && (
          <IconContainer>
            {error ? (
              <AlertCircle size={16} color="$red9" />
            ) : success ? (
              <CheckCircle size={16} color="$green9" />
            ) : null}
          </IconContainer>
        )}
      </YStack>
      
      {error && (
        <ErrorText>
          {error}
        </ErrorText>
      )}
      
      {success && !error && (
        <SuccessText>
          Looks good!
        </SuccessText>
      )}
    </InputContainer>
  );
};

export default AnimatedInput;