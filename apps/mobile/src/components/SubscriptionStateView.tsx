import { useSubscriptions } from "@/providers/SubscriptionContext";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function SubscriptionStateView() {
  const { state, retry } = useSubscriptions();

  if (
    state.status === "authentication-loading" ||
    state.status === "loading-subscriptions"
  ) {
    const label =
      state.status === "loading-subscriptions"
        ? "Loading subscriptions..."
        : "Checking authentication...";
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base font-sans-medium text-primary">
          {label}
        </Text>
      </View>
    );
  }

  if (state.status === "backend-not-connected") {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-2xl font-sans-bold text-primary">
          Backend not connected
        </Text>
        <Text className="mt-3 text-center text-base font-sans-medium text-muted-foreground">
          Subscription features are unavailable because no backend is connected.
        </Text>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-2xl font-sans-bold text-primary">
          Subscriptions unavailable
        </Text>
        <Text className="mt-3 text-center text-base font-sans-medium text-destructive">
          {state.failure.message}
        </Text>
        {state.failure.retryable && (
          <Pressable
            className="auth-button mt-6 w-full"
            onPress={() => void retry()}
          >
            <Text className="auth-button-text">Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return null;
}
