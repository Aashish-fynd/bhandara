import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import EmailVerification from '@/screens/Auth/Verification';
import { useEmailVerification } from '@/hooks/useEmailVerification';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string || 'hamza@app.com';

  const {
    isResending,
    resendCooldown,
    resendEmail,
    updateEmail
  } = useEmailVerification({ 
    email,
    onVerificationComplete: () => {
      console.log('Email verified successfully!');
    }
  });

  return (
    <EmailVerification
      email={email}
      onResendEmail={resendEmail}
      onUpdateEmail={updateEmail}
      resendCooldown={resendCooldown}
      isResending={isResending}
    />
  );
}