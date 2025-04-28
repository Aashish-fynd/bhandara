import { useState } from "react";
import { Button, H2, Input, Paragraph, Separator, XStack, YStack, AnimatePresence } from "tamagui";
import { Github, ChevronDown } from "@tamagui/lucide-icons";
import GoogleIcon from "@/assets/svg/GoogleIcon";
import Label from "@/components/ui/Label";
import { Controller, useForm } from "react-hook-form";

// Simple Google SVG icon component

function AuthForm({ isLogin }: { isLogin?: boolean }) {
  const [isSignUp, setIsSignUp] = useState(!isLogin);
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: ""
    }
  });
  const onSubmit = (data: any) => console.log(data);

  return (
    <YStack
      width={400}
      m="auto"
      p="$4"
      gap="$5"
      animation="bouncy"
      enterStyle={{ height: 0 }}
      animateOnly={["height"]}
      background={"#111111"}
      rounded={"$6"}
      borderWidth={1}
      borderColor={"#222222"}
    >
      {/* Header */}
      <YStack gap="$2">
        <H2
          text="center"
          animation="quick"
          enterStyle={{ opacity: 0, scale: 0.9 }}
          exitStyle={{ opacity: 0, scale: 0.9 }}
        >
          {isSignUp ? "Create your account" : "Sign in"}
        </H2>
        <Paragraph
          text="center"
          color="$color10"
          animation="quick"
          enterStyle={{ opacity: 0, y: -10 }}
          exitStyle={{ opacity: 0, y: 10 }}
        >
          {isSignUp
            ? "Welcome! Please fill in the details to get started."
            : "Welcome back! Please sign in to continue"}
        </Paragraph>
      </YStack>

      {/* Social Login */}
      <XStack gap="$2">
        <Button
          flex={1}
          icon={<Github size="$1" />}
          borderWidth={1}
        >
          GitHub
        </Button>
        <Button
          flex={1}
          icon={<GoogleIcon />}
          borderWidth={1}
        >
          Google
        </Button>
      </XStack>

      <XStack
        items="center"
        gap="$2"
      >
        <Separator />
        <Paragraph
          size="$2"
          color="$color8"
        >
          or
        </Paragraph>
        <Separator />
      </XStack>

      {/* Form Fields */}
      <YStack gap="$5">
        {/* TODO: Try fixing one more time if not discard */}
        {/* <AnimatePresence
          onExitComplete={() => {
            console.log("exit complete");
          }}
        > */}
        {isSignUp ? (
          <XStack
            gap="$4"
            animation={"quick"}
            enterStyle={{ opacity: 0, y: 15 }}
            exitStyle={{ opacity: 0, y: -15 }}
            key="signup-fields"
            width="100%"
            height={"auto"}
          >
            <YStack
              flex={1}
              gap="$2"
            >
              <XStack
                gap="$2"
                justify="space-between"
                items="center"
              >
                <Label minH={0}>First name</Label>
                <Paragraph
                  size="$1"
                  color="$color8"
                >
                  Optional
                </Paragraph>
              </XStack>
              <Controller
                control={control}
                name="firstName"
                render={({ field }) => (
                  <Input
                    placeholder="First name"
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                )}
              />
            </YStack>
            <YStack
              flex={1}
              gap="$2"
            >
              <XStack
                gap="$2"
                justify="space-between"
                items="center"
              >
                <Label>Last name</Label>
                <Paragraph
                  size="$1"
                  color="$color8"
                >
                  Optional
                </Paragraph>
              </XStack>
              <Controller
                control={control}
                name="lastName"
                render={({ field }) => (
                  <Input
                    placeholder="Last name"
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                )}
              />
            </YStack>
          </XStack>
        ) : null}
        {/* </AnimatePresence> */}

        <YStack
          gap="$2"
          position="relative"
        >
          <Label>Email address</Label>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                placeholder="Enter your email address"
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="email-address"
              />
            )}
          />
        </YStack>

        <YStack gap="$2">
          <Label>Password</Label>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                placeholder="Enter your password"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        </YStack>
      </YStack>

      {/* Submit Button */}
      <Button
        onPress={handleSubmit(onSubmit)}
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.9 }}
        exitStyle={{ opacity: 0, scale: 0.9 }}
      >
        {isSignUp ? "Continue" : "Sign in"}
      </Button>

      {/* Form Toggle */}
      <XStack
        justify="center"
        gap="$2"
        animation="quick"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      >
        <Paragraph color="$color10">{isSignUp ? "Already have an account?" : "Don't have an account?"}</Paragraph>
        <Paragraph
          unstyled
          cursor="pointer"
          color="$blue10"
          textDecorationLine="underline"
          hoverStyle={{ opacity: 0.9 }}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Paragraph>
      </XStack>
    </YStack>
  );
}

export default AuthForm;
