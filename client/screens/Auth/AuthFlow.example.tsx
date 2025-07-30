/**
 * Example of how to integrate the Email Verification screen into your authentication flow
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import EmailVerification from './Verification';
import { useEmailVerification } from '@/hooks/useEmailVerification';

// Example authentication states
enum AuthState {
  SignUp = 'signup',
  EmailVerification = 'email-verification',
  Complete = 'complete'
}

export default function AuthFlowExample() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(AuthState.SignUp);
  const [userEmail, setUserEmail] = useState('');

  // This would be called after successful sign up
  const onSignUpSuccess = (email: string) => {
    setUserEmail(email);
    setAuthState(AuthState.EmailVerification);
    
    // Navigate to verification screen with email parameter
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  // Example of using the verification screen inline
  const {
    isResending,
    resendCooldown,
    resendEmail,
    updateEmail
  } = useEmailVerification({
    email: userEmail,
    onVerificationComplete: () => {
      setAuthState(AuthState.Complete);
      // Navigate to home or onboarding
      router.push('/home');
    }
  });

  if (authState === AuthState.EmailVerification) {
    return (
      <EmailVerification
        email={userEmail}
        onResendEmail={resendEmail}
        onUpdateEmail={() => {
          // Go back to sign up
          setAuthState(AuthState.SignUp);
          router.push('/onboarding');
        }}
        resendCooldown={resendCooldown}
        isResending={isResending}
      />
    );
  }

  // Your other auth screens would go here
  return null;
}

/**
 * Alternative: Direct navigation approach
 * 
 * In your sign up handler:
 * 
 * const handleSignUp = async (data: SignUpData) => {
 *   try {
 *     const response = await signUp(data);
 *     if (response.requiresEmailVerification) {
 *       router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
 *     }
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */

/**
 * API Integration Example:
 * 
 * // In your API client
 * export const authAPI = {
 *   resendVerificationEmail: async (email: string) => {
 *     const response = await fetch('/api/auth/resend-verification', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ email })
 *     });
 *     return response.json();
 *   },
 *   
 *   checkVerificationStatus: async (email: string) => {
 *     const response = await fetch(`/api/auth/check-verification?email=${email}`);
 *     return response.json();
 *   }
 * };
 */