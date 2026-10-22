import {
  SubscriptionProvider,
  useSubscriptions,
} from "@/providers/SubscriptionContext";
import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { styled } from "nativewind";
import { Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function AppLayout() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn || !userId || !sessionId) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <SubscriptionProvider key={`${userId}:${sessionId}`}>
      <AppLayoutContent />
    </SubscriptionProvider>
  );
}

function AppLayoutContent() {
  const { isDevelopmentMode } = useSubscriptions();

  return (
    <View className="flex-1 bg-background">
      {isDevelopmentMode && (
        <SafeAreaView edges={["top"]} className="border-b border-border bg-card">
          <View
            accessibilityRole="alert"
            accessibilityLabel="Development data — resets on reload"
            className="items-center justify-center px-4 py-1.5"
          >
            <Text className="text-center text-xs font-sans-medium text-muted-foreground">
              Development data — resets on reload
            </Text>
          </View>
        </SafeAreaView>
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
