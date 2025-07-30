import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EmailVerification from '@/screens/Auth/Verification';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string || 'hamza@app.com';
  
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      // TODO: Add your API call here
      // await resendVerificationEmail(email);
      
      // Set cooldown
      setResendCooldown(60);
    } catch (error) {
      console.error('Failed to resend email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateEmail = () => {
    router.push('/onboarding');
  };

  return (
    <EmailVerification
      email={email}
      onResendEmail={handleResendEmail}
      onUpdateEmail={handleUpdateEmail}
      resendCooldown={resendCooldown}
      isResending={isResending}
    />
  );
}