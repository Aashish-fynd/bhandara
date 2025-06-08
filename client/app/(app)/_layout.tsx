import { BackButtonHeader } from "@/components/ui/common-components";
import Loader from "@/components/ui/Loader";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { isEmpty } from "@/utils";
import { Redirect, Stack, useRouter } from "expo-router";
import { View } from "tamagui";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

function _Layout() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View
        flex={1}
        height="100%"
        width="100%"
        justify="center"
        items="center"
      >
        <Loader />
      </View>
    );
  }

  if (!isLoading && isEmpty(user)) {
    return <Redirect href="/onboarding?type=auth" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="new-event"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="event/[id]"
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <AuthLayout>
      <_Layout />
    </AuthLayout>
  );
}
