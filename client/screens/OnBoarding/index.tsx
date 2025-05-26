import GoogleIcon from "@/assets/svg/GoogleIcon";
import { OutlineButton, FilledButton } from "@/components/ui/Buttons";
import { ArrowLeft, CircleCheck, Mail, MapPin, Navigation, SquareArrowOutUpRight } from "@tamagui/lucide-icons";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { debounce, H3, Sheet, Text, Tooltip, useDebounce, View, XStack, YStack } from "tamagui";
import { useForm } from "react-hook-form";
import { getUserByEmail, getUserByUsername, updateUser } from "@/common/api/user.action";

import { useToastController } from "@tamagui/toast";

import * as Location from "expo-location";
import AvatarSelection from "./AvatarSelection";
import { ITag } from "@/definitions/types";
import InterestSelection from "./InterestSelection";
import OvalCardStack from "./OvalCard";

import { InputGroup } from "@/components/Form";
import { getAddressFromCoordinates } from "@/common/api/mapbox";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { isEmpty } from "@/utils";
import { getNavState, setNavState } from "@/lib/navigationStore";
import { getUUIDv4 } from "@/helpers";
import Loader from "@/components/ui/Loader";
import { loginWithEmailAndPassword, signInWithIdToken, signupWithEmailAndPassword } from "@/common/api/auth.action";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import config from "@/config";
import { Platform } from "react-native";

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
  _location?: string;
  interests?: ITag[];
};

WebBrowser.maybeCompleteAuthSession();

const SignUpCard = ({
  setPosition,
  setShowForm
}: {
  setPosition: (position: number) => void;
  setShowForm: (showForm: boolean) => void;
}) => {
  const toastController = useToastController();
  const [isSocialAuthenticationInProgress, setIsSocialAuthenticationInProgress] = useState(false);

  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token"
  };

  const redirectUri = makeRedirectUri({});
  const clientIds = {
    web: config.google.webClientId,
    ios: config.google.iosClientId,
    android: config.google.androidClientId
  };

  const clientId = clientIds[Platform.OS as keyof typeof clientIds] || config.google.webClientId;

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      scopes: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
      redirectUri: redirectUri,
      responseType: "code"
    },
    discovery
  );

  useEffect(() => {
    const handleGoogleAuth = async (response: any) => {
      try {
        if (response?.type === "dismissed") {
          throw new Error("Google sign in cancelled");
        }

        if (response?.type !== "success") throw new Error(response?.error?.message || "Error signing in with Google");

        const { code } = response?.params || {};

        if (!code) throw new Error("No code received from Google");

        const res = await signInWithIdToken(code, request?.codeVerifier || "", redirectUri);
        const { session, user } = res.data;

        if (!session || !user) throw new Error("No session or user received from Google");
        toastController.show("Signed in successfully");
      } catch (error: any) {
        toastController.show(error?.message || "Error signing in with Google");
      } finally {
        setIsSocialAuthenticationInProgress(false);
      }
    };
    handleGoogleAuth(response);
  }, [response]);

  return (
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
        disabled={isSocialAuthenticationInProgress}
        onPress={() => {
          setIsSocialAuthenticationInProgress(true);
          promptAsync();
        }}
        iconAfter={isSocialAuthenticationInProgress ? <Loader /> : undefined}
      >
        <Text
          fontSize={"$2"}
          color={"$accent12"}
        >
          Sign up with Google
        </Text>
      </FilledButton>
      {!isSocialAuthenticationInProgress && (
        <OutlineButton
          icon={<Mail size={20} />}
          onPress={() => {
            setShowForm(true);
            setPosition(0);
          }}
        >
          <Text fontSize={"$2"}>Sign up with Email</Text>
        </OutlineButton>
      )}

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
};

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
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const router = useRouter();

  const params = useLocalSearchParams();

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
      username: "",
      _location: ""
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

  const _getSetLocationFromCoordinates = async (coordinates: { latitude: number; longitude: number }) => {
    setIsLocationLoading(true);
    try {
      const res = await getAddressFromCoordinates({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });

      if (!res) return;

      setValue("location", {
        ...res,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });
      setValue("_location", res.address);
    } catch (error: any) {
      toastController.show(error?.message || "Error getting location");
    } finally {
      setIsLocationLoading(false);
    }
  };

  const debouncedGetUserByUsername = useCallback(debounce(_getUserByUsername, 300), []);
  const debouncedGetSetLocationFromCoordinates = useDebounce(_getSetLocationFromCoordinates, 300);

  async function askForLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      toastController.show("Permission to access location was denied");
      return;
    }

    await getCurrentLocation();
  }

  async function getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({});

    // if location is already set and didn't change, do nothing
    if (
      allValues.location?.latitude === location.coords.latitude &&
      allValues.location?.longitude === location.coords.longitude
    )
      return;

    debouncedGetSetLocationFromCoordinates.cancel();
    debouncedGetSetLocationFromCoordinates({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });
  }

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

  useEffect(() => {
    if (params.dataKey) {
      const location = getNavState(params.dataKey as string);
      if (!isEmpty(location)) {
        setValue("location", location);
        setValue("_location", location.address);
      }
    }
  }, [params.dataKey]);

  const stageHandlers = {
    emailCheck: async ({ data }: { data: FormData }) => {
      try {
        await getUserByEmail(data.email);
        setAuthStage(AuthStage.Login);
      } catch (error: any) {
        if (error.error?.status === 404) {
          setAuthStage(AuthStage.Signup);
        } else {
          toastController.show(error?.error?.message || "Error checking email");
        }
      }
    },
    login: async ({ data }: { data: FormData }) => {
      try {
        await loginWithEmailAndPassword(data.email, data.password);
        // do something with the new user
      } catch (error: any) {
        toastController.show(error?.error?.message || "Error logging in");
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
        toastController.show(error?.error?.message || "Error signing up");
      }
    },
    avatarAndUsername: async () => {
      setAuthStage(AuthStage.InterestSelection);
    },
    interestSelection: async () => {
      // save and update all the data
      try {
        const updateData = {
          address: allValues.location,
          username: allValues.username,
          profilePic: allValues.profilePic,
          interests: allValues.interests?.map((tag) => tag.id)
        };

        const res = await updateUser(newUser.id, updateData);
        console.log("res", res);
      } catch (error: any) {
        console.log("error", error);
        toastController.show(error?.error?.message || "Error saving data");
      }
    }
  };

  const handleContinueClick = async (data: FormData) => {
    try {
      setIsLoading(true);
      await stageHandlers[authStage]({ data });
    } catch (error) {
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

  const handleEditLocation = () => {
    if (!isEmpty(allValues.location)) {
      const locationKey = getUUIDv4();
      setNavState(locationKey, allValues.location);

      router.push({
        pathname: "/map",
        params: {
          dataKey: locationKey
        }
      });
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
            <InputGroup
              control={control}
              rules={{
                minLength: { value: 2, message: "First name must be at least 2 characters" },
                pattern: { value: /^[A-Za-z]+$/, message: "Please enter valid characters" }
              }}
              error={errors.firstName}
              placeHolder="First name"
              name="firstName"
              label="First name"
              rightLabel="Required"
            />
            <InputGroup
              control={control}
              rules={{
                minLength: { value: 2, message: "Last name must be at least 2 characters" },
                pattern: { value: /^[A-Za-z]+$/, message: "Please enter valid characters" }
              }}
              error={errors.lastName}
              placeHolder="Last name"
              name="lastName"
              label="Last name"
              rightLabel="Required"
            />
          </XStack>
        )}

        {[AuthStage.EmailCheck, AuthStage.Signup, AuthStage.Login].includes(authStage) && (
          <>
            <InputGroup
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address"
                }
              }}
              error={errors.email}
              placeHolder="Email address"
              label="Email address"
              rightLabel="Required"
              inputProps={{
                keyboardType: "email-address",
                borderColor: errors.email ? "$red8" : undefined,
                disabled: authStage !== "emailCheck",
                opacity: authStage !== "emailCheck" ? 0.5 : 1,
                bg: authStage !== "emailCheck" ? "$color4" : undefined,
                cursor: authStage !== "emailCheck" ? "not-allowed" : "auto"
              }}
            />
          </>
        )}

        {[AuthStage.Login, AuthStage.Signup].includes(authStage) && !isUserComingFromSocialAuth && (
          <InputGroup
            name="password"
            control={control}
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
            placeHolder="Password"
            label="Password"
            rightLabel="Required"
            inputProps={{
              secureTextEntry: true
            }}
          />
        )}
        {authStage === AuthStage.Signup && !isUserComingFromSocialAuth && (
          <InputGroup
            control={control}
            name="verifyPassword"
            rules={{
              required: "Verify password is required",
              validate: (value: string | null) => {
                if (value !== allValues.password) {
                  return "Passwords do not match";
                }
                return true;
              }
            }}
            error={errors.verifyPassword}
            placeHolder="Re-enter your password"
            label="Verify password"
            rightLabel="Required"
          />
        )}

        {authStage === AuthStage.AvatarAndUsername && (
          <>
            <AvatarSelection
              cb={(avatar) => {
                setValue("profilePic.url", avatar);
              }}
            />
            <InputGroup
              control={control}
              name="username"
              rules={{
                required: "Username is required",
                pattern: {
                  value: /^[a-zA-Z0-9_]{8,20}$/,
                  message: "Please enter a valid username"
                }
              }}
              onChange={debouncedGetUserByUsername}
              iconAfter={
                (usernameLoading || isUsernameAvailable) &&
                allValues.username &&
                !errors.username && (
                  <View
                    items="flex-end"
                    justify="center"
                    animation={"quick"}
                    enterStyle={{ opacity: 0, scale: 0.5 }}
                    exitStyle={{ opacity: 0, scale: 0.5 }}
                  >
                    {usernameLoading && <Loader />}

                    {!usernameLoading && isUsernameAvailable && (
                      <CircleCheck
                        size={20}
                        color="$green10"
                      />
                    )}
                  </View>
                )
              }
              placeHolder="Enter your username"
              label="Username"
              rightLabel="Required"
              error={errors.username}
            />

            <InputGroup
              control={control}
              name="_location"
              label="Location"
              placeHolder="Use your current location"
              rules={{ required: "Location is required" }}
              error={errors._location}
              containerProps={{
                onPress: askForLocation,
                cursor: "pointer"
              }}
              inputProps={{
                editable: false
              }}
              iconAfter={
                isLocationLoading ? (
                  <Loader />
                ) : allValues._location ? (
                  <Tooltip delay={200}>
                    <Tooltip.Trigger>
                      <SquareArrowOutUpRight
                        size={20}
                        onPress={handleEditLocation}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <Text fontSize={"$2"}>Edit location</Text>
                    </Tooltip.Content>
                  </Tooltip>
                ) : (
                  <MapPin size={20} />
                )
              }
            />
          </>
        )}

        {authStage === AuthStage.InterestSelection && (
          <InterestSelection
            cb={(tags) => {
              setValue("interests", tags);
            }}
          />
        )}

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
            iconAfter={isLoading ? <Loader /> : undefined}
            width={[AuthStage.EmailCheck, AuthStage.Login].includes(authStage) ? "100%" : "auto"}
          >
            {authStage !== AuthStage.InterestSelection ? "Continue" : "Finish"}
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

            <OutlineButton
              width={"auto"}
              onPress={() => {
                const isLastTab = currentTab === tabs.length - 1;
                if (isLastTab) {
                  setShowSignUp(true);
                } else setCurrentTab(currentTab + 1);
              }}
            >
              <Text fontSize={"$2"}>Next</Text>
            </OutlineButton>
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
        snapPoints={["90%", 300]}
        onPositionChange={setPosition}
        position={position}
        snapPointsMode="mixed"
        disableDrag={true}
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
