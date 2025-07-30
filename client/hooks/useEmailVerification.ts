import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

interface UseEmailVerificationProps {
  email: string;
  onVerificationComplete?: () => void;
}

interface UseEmailVerificationReturn {
  isResending: boolean;
  resendCooldown: number;
  canResend: boolean;
  resendEmail: () => Promise<void>;
  updateEmail: () => void;
  checkVerificationStatus: () => Promise<void>;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function useEmailVerification({ 
  email, 
  onVerificationComplete 
}: UseEmailVerificationProps): UseEmailVerificationReturn {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);

  // Handle cooldown timer
  useEffect(() => {
    if (lastResendTime) {
      const elapsed = Math.floor((Date.now() - lastResendTime) / 1000);
      const remaining = Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
      setResendCooldown(remaining);

      if (remaining > 0) {
        const interval = setInterval(() => {
          const newElapsed = Math.floor((Date.now() - lastResendTime) / 1000);
          const newRemaining = Math.max(0, RESEND_COOLDOWN_SECONDS - newElapsed);
          setResendCooldown(newRemaining);

          if (newRemaining === 0) {
            clearInterval(interval);
          }
        }, 1000);

        return () => clearInterval(interval);
      }
    }
  }, [lastResendTime]);

  // Check verification status periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
      checkVerificationStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [email]);

  const resendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to resend email');
      }

      setLastResendTime(Date.now());
      // Show success toast
      console.log('Verification email resent successfully');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      // Show error toast
    } finally {
      setIsResending(false);
    }
  };

  const updateEmail = () => {
    // Navigate back to signup/login with email pre-filled
    router.push('/onboarding');
  };

  const checkVerificationStatus = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/auth/check-verification?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.verified) {
        onVerificationComplete?.();
        // Navigate to next screen or home
        router.push('/home');
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
    }
  };

  return {
    isResending,
    resendCooldown,
    canResend: resendCooldown === 0 && !isResending,
    resendEmail,
    updateEmail,
    checkVerificationStatus
  };
}