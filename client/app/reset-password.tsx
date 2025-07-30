import React, { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { H3, Text, YStack } from "tamagui";
import { useForm } from "react-hook-form";
import { useToastController } from "@tamagui/toast";
import { resetPassword } from "@/common/api/auth.action";
import { FilledButton } from "@/components/ui/Buttons";
import { InputGroup } from "@/components/Form";
import { SpinningLoader } from "@/components/ui/Loaders";

interface IResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage = () => {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const toastController = useToastController();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<IResetPasswordForm>({
    mode: "all"
  });

  const password = watch("password");

  const handleResetPassword = async (data: IResetPasswordForm) => {
    if (!token) {
      toastController.show("Invalid reset link");
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(data.password, token as string);
      toastController.show("Password reset successfully");
      router.push("/onboarding?type=auth");
    } catch (error: any) {
      toastController.show(error?.error?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" bg="$accent12">
      <YStack gap="$4" width="100%" maxWidth={400}>
        <YStack gap="$2">
          <H3>Reset Password</H3>
          <Text fontSize="$2" fontWeight="100" color="$accent9">
            Enter your new password below
          </Text>
        </YStack>

        <InputGroup
          control={control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters"
            },
            pattern: {
              value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
              message: "Password must contain at least one letter and one number"
            }
          }}
          error={errors.password}
          placeHolder="New password"
          label="New password"
          rightLabel="Required"
          inputProps={{
            secureTextEntry: true
          }}
        />

        <InputGroup
          control={control}
          name="confirmPassword"
          rules={{
            required: "Please confirm your password",
            validate: (value: string) => value === password || "Passwords do not match"
          }}
          error={errors.confirmPassword}
          placeHolder="Confirm password"
          label="Confirm password"
          rightLabel="Required"
          inputProps={{
            secureTextEntry: true
          }}
        />

        <FilledButton
          onPress={handleSubmit(handleResetPassword)}
          disabled={isLoading || !!Object.keys(errors).length}
          opacity={isLoading || !!Object.keys(errors).length ? 0.5 : 1}
          cursor={isLoading || !!Object.keys(errors).length ? "not-allowed" : "pointer"}
          pointerEvents={isLoading || !!Object.keys(errors).length ? "none" : "auto"}
          iconAfter={isLoading ? <SpinningLoader /> : undefined}
        >
          Reset Password
        </FilledButton>
      </YStack>
    </YStack>
  );
};

export default ResetPasswordPage;