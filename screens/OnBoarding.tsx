import GoogleIcon from "@/assets/svg/GoogleIcon";
import { BaseButton, FilledButton } from "@/components/ui/Buttons";
import { ArrowLeft, ChevronDown, Github, Mail } from "@tamagui/lucide-icons";
import React, { memo, useState } from "react";
import {
  Button,
  H3,
  Image,
  Input,
  Paragraph,
  Sheet,
  Spinner,
  StackProps,
  styled,
  Text,
  View,
  XStack,
  YStack
} from "tamagui";
import AuthForm from "./Auth/Form";
import { Controller, useForm } from "react-hook-form";
import { UserService } from "@/features";
import { useUserService } from "@/hooks";
import { Mapbox } from "@/features/maps";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  verifyPassword?: string;
};

const OvalCard = ({ image, width, height }: { image: string; width: number; height?: number }) => {
  return (
    <Image
      source={{
        uri: image,
        width: width,
        height: height ? height : width * 1.3
      }}
      rounded={10000}
      overflow={"hidden"}
    />
  );
};

type OvalCardConfig = {
  image: string;
  width: number;
  height?: number;
};

type OnBoardingConfig = {
  stacks: {
    gap?: StackProps["gap"];
    flexDirection?: "column" | "column-reverse";
    items?: StackProps["items"];
    justify?: StackProps["justify"];
    cards: OvalCardConfig[];
  }[];
};

const defaultConfig: OnBoardingConfig = {
  stacks: [
    {
      gap: "$4",
      items: "center",
      justify: "center",
      cards: [
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 80
        },
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 140
        }
      ]
    },
    {
      gap: "$4",
      flexDirection: "column-reverse",
      items: "center",
      justify: "center",
      cards: [
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 80
        },
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 140
        }
      ]
    }
  ]
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

    <FilledButton icon={<GoogleIcon size={20} />}>
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
const GetStartedContents = ({ setPosition }: { setPosition: (position: number) => void }) => {
  const userService = useUserService();
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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      email: ""
    },
    mode: "all"
  });

  const allValues = watch();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  const [authStage, setAuthStage] = useState<"emailCheck" | "signup" | "location" | "avatarAndUsername">("location");

  // TODO: Implement login user common functionality
  const loginUser = async () => {};

  const stageHandlers = {
    emailCheck: async ({ data }: { data: FormData }) => {
      const res = (await userService.getUserByEmail(data.email)) || {};
      if (res.error) throw new Error(res.error.message);
      if (!res.data?.length) {
        // user doesn't exist, create user
        setAuthStage("signup");
      } else {
        await loginUser();
      }
    },
    signup: async () => {
      const res = await userService.create({});
    },
    location: async () => {},
    avatarAndUsername: async () => {}
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

  const stageTexts: Record<keyof typeof stageHandlers, { title: string; description: string }> = {
    emailCheck: {
      title: "Continue with Email",
      description: "Sign in or Sign up with your email"
    },
    signup: {
      title: "Let's get started",
      description: "Please fill out the details to continue"
    },
    location: {
      title: "Location",
      description: "Please select your location to continue"
    },
    avatarAndUsername: {
      title: "One more step",
      description: "Choose an avatar and username"
    }
  };

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
            setPosition(1);
            setShowForm(false);
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

        {authStage === "signup" && (
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

        <YStack
          gap="$2.5"
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

        {authStage === "signup" && (
          <>
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

        {authStage === "location" && (
          <Mapbox.MapView
            style={{
              width: "100%",
              height: 200
            }}
          />
        )}
        <BaseButton
          onPress={handleSubmit(handleContinueClick)}
          animation="quick"
          mt={"auto"}
          disabled={!!Object.keys(errors).length || isLoading}
          opacity={!!Object.keys(errors).length || isLoading ? 0.5 : 1}
          cursor={!!Object.keys(errors).length || isLoading ? "not-allowed" : "pointer"}
          icon={
            isLoading ? (
              <Spinner
                size="small"
                width={16}
                height={16}
              />
            ) : undefined
          }
        >
          Continue
        </BaseButton>
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

const OnBoarding = ({ config = defaultConfig }: { config?: OnBoardingConfig }) => {
  const [position, setPosition] = useState(0);
  return (
    <>
      <XStack
        gap={"$4"}
        items={"center"}
        justify={"center"}
        mt={"7vh"}
      >
        {config.stacks.map((stack, i) => (
          <YStack
            key={i}
            gap={stack.gap ?? "$2"}
            flexDirection={stack.flexDirection || "column"}
            items={stack.items}
            justify={stack.justify}
          >
            {stack.cards.map((card, j) => (
              <OvalCard
                key={j}
                {...card}
              />
            ))}
          </YStack>
        ))}
      </XStack>

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
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          bg={"transparent"}
        />

        {/* <Sheet.Handle
          bg={"$accent12"}
          opacity={0.9}
        /> */}
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
