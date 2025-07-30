import React, { useState } from "react";
import { YStack, XStack, H2, Paragraph, Button, Circle, AnimatePresence } from "tamagui";
import { Mail } from "@tamagui/lucide-icons";

interface EmailVerificationProps {
  email?: string;
  onResendEmail?: () => void;
  onUpdateEmail?: () => void;
  resendCooldown?: number;
  isResending?: boolean;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email = "hamza@app.com",
  onResendEmail,
  onUpdateEmail,
  resendCooldown = 0,
  isResending: isResendingProp = false
}) => {
  const [localIsResending, setLocalIsResending] = useState(false);
  const isResending = isResendingProp || localIsResending;

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setLocalIsResending(true);
    try {
      onResendEmail?.();
      // Add your resend email logic here
    } finally {
      setTimeout(() => setLocalIsResending(false), 2000);
    }
  };

  const handleUpdateEmail = () => {
    onUpdateEmail?.();
    // Add your update email logic here
  };

  const getResendButtonText = () => {
    if (isResending) return "Sending...";
    if (resendCooldown > 0) return `Resend in ${resendCooldown}s`;
    return "Resend email";
  };

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="#000000"
      padding="$4"
    >
      <YStack
        width="100%"
        maxWidth={520}
        padding="$10"
        gap="$6"
        backgroundColor="#1a1a1a"
        borderRadius="$4"
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.1)"
        alignItems="center"
        animation="quick"
        enterStyle={{
          opacity: 0,
          scale: 0.95,
          y: 20
        }}
        exitStyle={{
          opacity: 0,
          scale: 0.95,
          y: -20
        }}
      >
        {/* Email Icon with dots */}
        <YStack
          position="relative"
          width={100}
          height={100}
          alignItems="center"
          justifyContent="center"
          animation="bouncy"
          enterStyle={{
            scale: 0,
            opacity: 0
          }}
          animateOnly={["transform", "opacity"]}
        >
          {/* Main circle with email icon */}
          <Circle
            size={80}
            backgroundColor="#ffffff"
            alignItems="center"
            justifyContent="center"
            elevation="$2"
          >
            <Mail size={40} color="#000000" strokeWidth={1.5} />
          </Circle>
          
          {/* Blue dot */}
          <Circle
            size={16}
            backgroundColor="#4a90e2"
            position="absolute"
            top={8}
            right={20}
            animation="bouncy"
            enterStyle={{
              scale: 0,
              opacity: 0
            }}
            animateOnly={["transform", "opacity"]}
            delay={200}
          />
          
          {/* Purple dot */}
          <Circle
            size={16}
            backgroundColor="#9b59b6"
            position="absolute"
            bottom={8}
            right={8}
            animation="bouncy"
            enterStyle={{
              scale: 0,
              opacity: 0
            }}
            animateOnly={["transform", "opacity"]}
            delay={300}
          />
        </YStack>

        {/* Title */}
        <H2
          size="$8"
          color="#ffffff"
          textAlign="center"
          fontWeight="600"
          animation="quick"
          enterStyle={{
            opacity: 0,
            y: 10
          }}
          delay={100}
        >
          Please verify your email
        </H2>

        {/* Description */}
        <YStack gap="$2" alignItems="center">
          <Paragraph
            size="$4"
            color="rgba(255, 255, 255, 0.6)"
            textAlign="center"
            animation="quick"
            enterStyle={{
              opacity: 0,
              y: 10
            }}
            delay={150}
          >
            We just sent an email to {email}.
          </Paragraph>
          <Paragraph
            size="$4"
            color="rgba(255, 255, 255, 0.6)"
            textAlign="center"
            animation="quick"
            enterStyle={{
              opacity: 0,
              y: 10
            }}
            delay={200}
          >
            Click the link in the email to verify your account.
          </Paragraph>
        </YStack>

        {/* Buttons */}
        <XStack
          gap="$3"
          width="100%"
          justifyContent="center"
          marginTop="$4"
          animation="quick"
          enterStyle={{
            opacity: 0,
            y: 10
          }}
          delay={250}
        >
          <Button
            size="$4"
            backgroundColor={resendCooldown > 0 ? "rgba(255, 255, 255, 0.8)" : "#ffffff"}
            color="#000000"
            pressStyle={{
              backgroundColor: resendCooldown > 0 ? "rgba(255, 255, 255, 0.8)" : "#e0e0e0",
              scale: resendCooldown > 0 ? 1 : 0.98
            }}
            hoverStyle={{
              backgroundColor: resendCooldown > 0 ? "rgba(255, 255, 255, 0.8)" : "#f0f0f0"
            }}
            onPress={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            borderRadius="$6"
            paddingHorizontal="$8"
            paddingVertical="$3"
            fontWeight="500"
            animation="quick"
            disabledStyle={{
              opacity: 0.6,
              cursor: resendCooldown > 0 ? "not-allowed" : "default"
            }}
          >
            {getResendButtonText()}
          </Button>

          <Button
            size="$4"
            backgroundColor="transparent"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.3)"
            color="#ffffff"
            pressStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              scale: 0.98,
              borderColor: "rgba(255, 255, 255, 0.4)"
            }}
            hoverStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderColor: "rgba(255, 255, 255, 0.4)"
            }}
            onPress={handleUpdateEmail}
            borderRadius="$6"
            paddingHorizontal="$8"
            paddingVertical="$3"
            fontWeight="500"
            animation="quick"
          >
            Update email
          </Button>
        </XStack>
      </YStack>
    </YStack>
  );
};

export default EmailVerification;