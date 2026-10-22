import { SubscriptionProvider } from "@/providers/SubscriptionContext";
import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { View } from "react-native";

export default function AppLayout() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn || !userId || !sessionId) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <SubscriptionProvider key={`${userId}:${sessionId}`}>
      <View className="flex-1 bg-background">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </SubscriptionProvider>
  );
}
