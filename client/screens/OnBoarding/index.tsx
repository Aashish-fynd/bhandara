import GoogleIcon from "@/assets/svg/GoogleIcon";
import { BaseButton, FilledButton } from "@/components/ui/Buttons";
import { ArrowLeft, CircleCheck, Mail } from "@tamagui/lucide-icons";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { debounce, H3, Input, Paragraph, Sheet, Spinner, Text, View, XStack, YStack } from "tamagui";
import { Controller, useForm } from "react-hook-form";
import {
  getUserByEmail,
  getUserByUsername,
  loginWithEmailAndPassword,
  signupWithEmailAndPassword
} from "@/common/api/user.action";
import { useToastController } from "@tamagui/toast";
import LocationInput from "@/components/Location";

import * as Location from "expo-location";
import AvatarSelection from "./AvatarSelection";
import { ITag } from "@/definitions/types";
import InterestSelection from "./InterestSelection";
import OvalCardStack from "./OvalCard";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  verifyPassword?: string;
  profilePic?: {
    url: string;
  };
  username?: string;
  tags?: ITag[];
  location?: {
    latitude: number;
    longitude: number;
  };
};

const SignUpCard = ({
  setPosition,
  setShowForm
}: {
  setPosition: (position: number) => void;
  setShowForm: (showForm: boolean) => void;
}) => (
  <>
    <H3>Get Started</H3>
    <Text
      fontSize={"$2"}
      fontWeight={"100"}
      color={"$accent9"}
    >
      Discover, book, and track events seamlessly with calendar integration and personalized event curation
    </Text>

    <FilledButton
      ml={"auto"}
      mr={"auto"}
      icon={<GoogleIcon size={20} />}
    >
      <Text
        fontSize={"$2"}
        color={"$accent12"}
      >
        Sign up with Google
      </Text>
    </FilledButton>
    <BaseButton icon={<Mail size={20} />}>
      <Text fontSize={"$2"}>Sign up with Email</Text>
    </BaseButton>
    <Text
      fontSize={"$2"}
      fontWeight={"100"}
      color={"$accent9"}
      mt={"$6"}
      mx={"auto"}
    >
      Already have an account?{" "}
      <Text
        fontSize={"$2"}
        fontWeight={"100"}
        cursor={"pointer"}
        onPress={() => {
          setPosition(0);
          setShowForm(true);
        }}
      >
        Login
      </Text>
    </Text>
  </>
);

enum AuthStage {
  EmailCheck = "emailCheck",
  Signup = "signup",
  AvatarAndUsername = "avatarAndUsername",
  InterestSelection = "interestSelection",
  Login = "login"
}

const GetStartedContents = ({ setPosition }: { setPosition: (position: number) => void }) => {
  const tabs = [
    {
      title: "Explore Nearby Events",
      description: "Get notified about nearby food events and much more. Register for notifications and much more.",
      renderComponent: () => <></>
    },
    {
      title: "Event Exploration made Simple",
      description:
        "Discover, book, and track events seamlessly with calendar integration and personalized event curation",
      renderComponent: () => <></>
    }
  ];

  const [currentTab, setCurrentTab] = useState(0);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const toastController = useToastController();
  const [newUser, setNewUser] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors,
    setValue
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      username: ""
    },
    mode: "all"
  });

  const allValues = watch();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  const [authStage, setAuthStage] = useState<AuthStage>(AuthStage.EmailCheck);
  const [usernameLoading, setUsernameLoading] = useState<boolean>(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean>(false);
  const [isUserComingFromSocialAuth, setIsUserComingFromSocialAuth] = useState<boolean>(false);

  const newUserStages = [AuthStage.Signup, AuthStage.AvatarAndUsername, AuthStage.InterestSelection];
  const progressTabs = useMemo(() => {
    return newUserStages;
  }, [isUserComingFromSocialAuth]);

  console.log(allValues);

  const _getUserByUsername = async (username: string) => {
    try {
      if (!username || errors.username) return;
      setUsernameLoading(true);
      await getUserByUsername(username);
      setError("username", { type: "custom", message: "Username is already taken" });
    } catch (error) {
      setUsernameLoading(false);
      setIsUsernameAvailable(true);
    }
  };

  const debouncedGetUserByUsername = useCallback(debounce(_getUserByUsername, 300), []);

  const stageFields = {
    emailCheck: ["email"],
    login: ["email", "password"],
    signup: ["firstName", "lastName", "email", ...(isUserComingFromSocialAuth ? [] : ["password", "verifyPassword"])],
    avatarAndUsername: ["username", "profilePic", "location"],
    interestSelection: ["interests"]
  };

  useEffect(() => {
    const _stageFields = { ...stageFields };
    delete _stageFields[authStage];
    Object.values(_stageFields)
      .flat()
      .forEach((field) => {
        clearErrors(field as keyof FormData);
      });
  }, [authStage]);

  const stageHandlers = {
    emailCheck: async ({ data }: { data: FormData }) => {
      try {
        await getUserByEmail(data.email);
        setAuthStage(AuthStage.Login);
      } catch (error: any) {
        setAuthStage(AuthStage.Signup);
        toastController.show(error?.error?.message);
      }
    },
    login: async ({ data }: { data: FormData }) => {
      try {
        await loginWithEmailAndPassword(data.email, data.password);
        // do something with the new user
      } catch (error: any) {
        toastController.show(error?.error?.message);
      }
    },
    signup: async ({ data }: { data: FormData }) => {
      try {
        if (!newUser) {
          const res = await signupWithEmailAndPassword({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            password: data.password
          });
          setNewUser(res.data.session.user);
        }
        setAuthStage(AuthStage.AvatarAndUsername);
      } catch (error: any) {
        toastController.show(error?.error?.message);
      }
    },
    avatarAndUsername: async () => {},
    interestSelection: async () => {}
  };

  const handleContinueClick = async (data: FormData) => {
    try {
      setIsLoading(true);
      await stageHandlers[authStage]({ data });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const stageTexts = {
    emailCheck: {
      title: "Continue with Email",
      description: "Sign in or Sign up with your email"
    },
    signup: {
      title: "Let's get started",
      description: "Please fill out the details to continue"
    },
    avatarAndUsername: {
      title: "One more step",
      description: "Choose an avatar and username"
    },
    interestSelection: {
      title: "Tell us your interests",
      description: "Choose between 3 and 10 interests, and we'll curate the best events for your feed"
    },
    login: {
      title: "Welcome back",
      description: "Sign in to your account"
    }
  };

  const isContinueButtonDisabled =
    !!Object.keys(errors).length ||
    isLoading ||
    !stageFields[authStage].every((field) => !!allValues[field as keyof FormData]);

  if (showForm)
    return (
      <YStack
        gap={"$4"}
        width={"100%"}
        flex={1}
      >
        <ArrowLeft
          size={24}
          color={"$accent1"}
          cursor={"pointer"}
          onPress={() => {
            setAuthStage((prev) => {
              const stages = Object.values(AuthStage);
              const currentIndex = stages.indexOf(prev);
              if (currentIndex === 0) {
                setPosition(1);
                setShowForm(false);
                return AuthStage.EmailCheck;
              }
              return stages[currentIndex - 1];
            });
          }}
        />
        <YStack gap={"$2"}>
          <H3>{stageTexts[authStage].title}</H3>
          <Text
            fontSize={"$2"}
            fontWeight={"100"}
            color={"$accent9"}
          >
            {stageTexts[authStage].description}
          </Text>
        </YStack>

        {authStage === AuthStage.Signup && (
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
                <Text minH={0}>First name</Text>
                <Paragraph
                  size="$1"
                  color="$color8"
                >
                  Required
                </Paragraph>
              </XStack>
              <Controller
                control={control}
                name="firstName"
                rules={{
                  minLength: { value: 2, message: "First name must be at least 2 characters" },
                  pattern: { value: /^[A-Za-z]+$/, message: "Please enter valid characters" }
                }}
                render={({ field }) => (
                  <>
                    <Input
                      placeholder="First name"
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={errors.firstName ? "$red8" : undefined}
                    />
                    {errors.firstName && (
                      <Text
                        color="$red10"
                        fontSize="$1"
                      >
                        {errors.firstName.message}
                      </Text>
                    )}
                  </>
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
                <Text>Last name</Text>
                <Paragraph
                  size="$1"
                  color="$color8"
                >
                  Required
                </Paragraph>
              </XStack>
              <Controller
                control={control}
                name="lastName"
                rules={{
                  minLength: { value: 2, message: "Last name must be at least 2 characters" },
                  pattern: { value: /^[A-Za-z]+$/, message: "Please enter valid characters" }
                }}
                render={({ field }) => (
                  <>
                    <Input
                      placeholder="Last name"
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={errors.lastName ? "$red8" : undefined}
                    />
                    {errors.lastName && (
                      <Text
                        color="$red10"
                        fontSize="$1"
                        width={"auto"}
                      >
                        {errors.lastName.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </YStack>
          </XStack>
        )}

        {[AuthStage.EmailCheck, AuthStage.Signup, AuthStage.Login].includes(authStage) && (
          <YStack
            gap="$2"
            position="relative"
          >
            <Text fontSize={"$3"}>Email address</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address"
                }
              }}
              render={({ field }) => (
                <>
                  <Input
                    placeholder="Enter your email address"
                    value={field.value}
                    onChangeText={field.onChange}
                    keyboardType="email-address"
                    borderColor={errors.email ? "$red8" : undefined}
                    disabled={authStage !== "emailCheck"}
                    opacity={authStage !== "emailCheck" ? 0.5 : 1}
                    bg={authStage !== "emailCheck" ? "$accent11" : undefined}
                    cursor={authStage !== "emailCheck" ? "not-allowed" : "auto"}
                  />
                  {errors.email && (
                    <Text
                      color="$red10"
                      fontSize="$1"
                    >
                      {errors.email.message}
                    </Text>
                  )}
                </>
              )}
            />
          </YStack>
        )}

        {[AuthStage.Login, AuthStage.Signup].includes(authStage) && !isUserComingFromSocialAuth && (
          <YStack gap="$2">
            <Text fontSize={"$3"}>Password</Text>
            <Controller
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
              render={({ field }) => (
                <>
                  <Input
                    placeholder="Enter your password"
                    secureTextEntry
                    value={field.value}
                    onChangeText={field.onChange}
                    borderColor={errors.password ? "$red8" : undefined}
                  />
                  {errors.password && (
                    <Text
                      color="$red10"
                      fontSize="$1"
                    >
                      {errors.password.message}
                    </Text>
                  )}
                </>
              )}
            />
          </YStack>
        )}
        {authStage === AuthStage.Signup && !isUserComingFromSocialAuth && (
          <>
            <YStack gap="$2">
              <Text fontSize={"$3"}>Verify Password</Text>
              <Controller
                control={control}
                name="verifyPassword"
                rules={{
                  required: "Verify password is required",
                  validate: (value) => {
                    if (value !== allValues.password) {
                      return "Passwords do not match";
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <>
                    <Input
                      placeholder="Re-enter your password"
                      secureTextEntry
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={errors.verifyPassword ? "$red8" : undefined}
                    />
                    {errors.verifyPassword && (
                      <Text
                        color="$red10"
                        fontSize="$1"
                      >
                        {errors.verifyPassword.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </YStack>
          </>
        )}

        {authStage === AuthStage.AvatarAndUsername && (
          <>
            <AvatarSelection
              cb={(avatar) => {
                setValue("profilePic.url", avatar);
              }}
            />
            <YStack
              gap="$2"
              position="relative"
            >
              <Text fontSize={"$3"}>Username</Text>
              <Controller
                control={control}
                name="username"
                rules={{
                  required: "Username is required",
                  pattern: {
                    value: /^[a-zA-Z0-9_]{8,20}$/,
                    message: "Please enter a valid username"
                  }
                }}
                render={({ field, fieldState: { error } }) => (
                  <YStack
                    position="relative"
                    gap={"$2"}
                  >
                    <Input
                      placeholder="Enter your username"
                      value={field.value}
                      onChangeText={(rest) => {
                        field.onChange(rest);

                        debouncedGetUserByUsername(rest);
                      }}
                      borderColor={error ? "$red8" : undefined}
                      // disabled={authStage !== "avatarAndUsername"}
                      // opacity={authStage !== "avatarAndUsername" ? 0.5 : 1}
                      // bg={authStage !== "avatarAndUsername" ? "$accent11" : undefined}
                      // cursor={authStage !== "avatarAndUsername" ? "not-allowed" : "auto"}
                    />

                    {(usernameLoading || isUsernameAvailable) && allValues.username && !error && (
                      <View
                        position="absolute"
                        t={0}
                        r={"$4"}
                        b={0}
                        items="flex-end"
                        justify="center"
                        animation={"quick"}
                        enterStyle={{ opacity: 0, scale: 0.5 }}
                        exitStyle={{ opacity: 0, scale: 0.5 }}
                      >
                        {usernameLoading && (
                          <Spinner
                            size="small"
                            color="$accent11"
                          />
                        )}

                        {!usernameLoading && isUsernameAvailable && (
                          <CircleCheck
                            size={20}
                            color="$green10"
                          />
                        )}
                      </View>
                    )}
                  </YStack>
                )}
              />

              {errors.username && (
                <Text
                  color="$red10"
                  fontSize="$1"
                >
                  {errors.username.message}
                </Text>
              )}
            </YStack>

            <LocationInput
              cb={(location) => {
                if (location.status === "granted" && location.location) {
                  const locationObject = {
                    latitude: location.location.coords.latitude,
                    longitude: location.location.coords.longitude
                  };

                  setValue("location", locationObject);
                }
              }}
            />
          </>
        )}

        {authStage === AuthStage.InterestSelection && <InterestSelection cb={(tags) => {}} />}
        {/* 
        {authStage === "location" && (
          <Mapbox.MapView
            style={{
              width: "100%",
              height: 200
            }}
          />
        )} */}
        <XStack
          mt={"auto"}
          width={"100%"}
          justify={"space-between"}
          items={"center"}
        >
          <XStack gap={"$2"}>
            {![AuthStage.EmailCheck, AuthStage.Login].includes(authStage) &&
              progressTabs.map((stage, i) => (
                <View
                  key={i}
                  onPress={handleSubmit(() => setAuthStage(stage))}
                  bg={authStage !== stage ? "$accent10" : "$accent1"}
                  rounded={10000}
                  width={authStage === stage ? "$3" : "$0.75"}
                  height={"$0.75"}
                  cursor={"pointer"}
                  animation={"quick"}
                />
              ))}
          </XStack>
          <FilledButton
            onPress={handleSubmit(handleContinueClick)}
            animation="quick"
            disabled={isContinueButtonDisabled}
            opacity={isContinueButtonDisabled ? 0.5 : 1}
            cursor={isContinueButtonDisabled ? "not-allowed" : "pointer"}
            items={"center"}
            iconAfter={isLoading ? <Spinner size="small" /> : undefined}
            width={[AuthStage.EmailCheck, AuthStage.Login].includes(authStage) ? "100%" : "auto"}
          >
            {authStage !== AuthStage.AvatarAndUsername ? "Continue" : "Finish"}
          </FilledButton>
        </XStack>
      </YStack>
    );

  return (
    <YStack
      gap={"$3"}
      width={"100%"}
      maxW={350}
      justify={"space-between"}
      height={250}
    >
      {showSignUp ? (
        <SignUpCard
          setPosition={setPosition}
          setShowForm={setShowForm}
        />
      ) : (
        <>
          <YStack gap={"$3"}>
            <Text fontSize={"$9"}>{tabs[currentTab].title}</Text>
            <Text
              fontSize={"$2"}
              fontWeight={"100"}
              color={"$accent9"}
            >
              {tabs[currentTab].description}
            </Text>
            {tabs[currentTab].renderComponent()}
          </YStack>

          <XStack
            items={"center"}
            justify={"space-between"}
          >
            <XStack gap={"$3"}>
              {Array.from({ length: tabs.length }).map((_, i) => (
                <View
                  key={i}
                  onPress={() => setCurrentTab(i)}
                  bg={currentTab !== i ? "$accent10" : "$accent1"}
                  rounded={"$12"}
                  width={"$3"}
                  height={"$0.75"}
                  cursor={"pointer"}
                />
              ))}
            </XStack>

            <BaseButton
              width={"auto"}
              onPress={() => {
                const isLastTab = currentTab === tabs.length - 1;
                if (isLastTab) {
                  setShowSignUp(true);
                } else setCurrentTab(currentTab + 1);
              }}
            >
              <Text fontSize={"$2"}>Next</Text>
            </BaseButton>
          </XStack>
        </>
      )}
    </YStack>
  );
};

const SheetContents = memo(({ setPosition, position }: any) => {
  return (
    <YStack
      gap="$2"
      items={"center"}
      width={"100%"}
      flex={1}
    >
      <GetStartedContents {...{ setPosition }} />
    </YStack>
  );
});

const OnBoarding = () => {
  const [position, setPosition] = useState(0);
  return (
    <>
      <OvalCardStack />
      <Sheet
        modal={false}
        open={true}
        zIndex={100_000}
        animation={"quick"}
        dismissOnOverlayPress={false}
        dismissOnSnapToBottom={false}
        snapPoints={["100%", 300]}
        onPositionChange={setPosition}
        position={position}
        snapPointsMode="mixed"
      >
        <Sheet.Overlay
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          bg={"transparent"}
        />

        <Sheet.Frame
          p="$4"
          py={"$6"}
          justify="flex-start"
          items="center"
          gap="$5"
          bg={"$accent12"}
          width={"100%"}
          mx={"auto"}
        >
          <SheetContents {...{ setPosition, position }} />
        </Sheet.Frame>
      </Sheet>
    </>
  );
};

export default OnBoarding;
