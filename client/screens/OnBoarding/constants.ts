import { EOnboardingStages } from "@/definitions/enums";
import { EApplicableStage } from "./enum";
import { IFormData } from "./type";

export const GET_STARTED_TABS = [
  {
    title: "Explore Nearby Events",
    description: "Get notified about nearby food events and much more. Register for notifications and much more.",
    renderComponent: () => null
  },
  {
    title: "Event Exploration made Simple",
    description:
      "Discover, book, and track events seamlessly with calendar integration and personalized event curation",
    renderComponent: () => null
  }
];

export const ONBOARDING_STAGES_TEXT = {
  [EOnboardingStages.EmailVerification]: {
    title: "Welcome!",
    description: "Let's get started by verifying your email address."
  },
  [EOnboardingStages.BasicInfo]: {
    title: "Basic Information",
    description: "Tell us a bit about yourself to personalize your experience."
  },
  [EOnboardingStages.ProfileSetup]: {
    title: "Profile Setup",
    description: "Set up your profile to connect with other event-goers."
  },
  [EOnboardingStages.InterestSelection]: {
    title: "Your Interests",
    description: "Select your interests to get personalized event recommendations."
  },
  [EOnboardingStages.Login]: {
    title: "Welcome Back!",
    description: "Sign in to your account to continue."
  },
  [EOnboardingStages.ForgotPassword]: {
    title: "Forgot Password",
    description: "Enter your email address and we'll send you a link to reset your password."
  }
} as const;

export const APPLICABLE_STAGES_MAP = {
  [EApplicableStage.EmailExists]: {
    stages: [EOnboardingStages.EmailVerification, EOnboardingStages.Login],
    skippableStages: []
  },
  [EApplicableStage.NotOnboarded]: {
    stages: [EOnboardingStages.BasicInfo, EOnboardingStages.ProfileSetup, EOnboardingStages.InterestSelection],
    skippableStages: [EOnboardingStages.InterestSelection]
  },
  [EApplicableStage.NewUser]: {
    stages: [EOnboardingStages.BasicInfo, EOnboardingStages.ProfileSetup, EOnboardingStages.InterestSelection],
    skippableStages: [EOnboardingStages.InterestSelection]
  }
};

export const getStageLevelFields = (stage: EOnboardingStages, isUserComingFromSocialAuth: boolean) => {
  const fields = {
    [EOnboardingStages.EmailVerification]: ["email"],
    [EOnboardingStages.Login]: ["email", "password"],
    [EOnboardingStages.BasicInfo]: [
      "firstName",
      "lastName",
      "email",
      ...(isUserComingFromSocialAuth ? [] : ["password", "verifyPassword"])
    ],
    [EOnboardingStages.ProfileSetup]: ["username", "profilePic", "location"],
    [EOnboardingStages.InterestSelection]: ["interests"],
    [EOnboardingStages.ForgotPassword]: ["email"]
  };

  return fields[stage] as (keyof IFormData)[];
};
