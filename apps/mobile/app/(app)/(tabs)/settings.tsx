import { posthog, sanitizePostHogProperties } from "@/adapters/posthog";
import { ACCOUNT_DELETION_DISABLED_MESSAGE } from "@/features/account/account-deletion";
import { useAuth, useSessionList } from "@clerk/expo";
import { styled } from "nativewind";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut, sessionId } = useAuth();
  const sessionList = useSessionList();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const otherSessions =
    sessionList.isLoaded && sessionId
      ? sessionList.sessions.filter((session) => session.id !== sessionId)
      : [];

  const handleSignOut = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await signOut();
      posthog?.capture(
        "user_signed_out",
        sanitizePostHogProperties({ source: "settings" }),
      );
      await posthog?.flush().catch(() => undefined);
      posthog?.reset();
    } catch (error) {
      posthog?.captureException(error, { auth_flow: "sign_out" });
      setMessage("We could not sign you out. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeOtherSessions = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await Promise.all(otherSessions.map((session) => session.remove()));
      setMessage("Other sessions registered on this device were signed out.");
    } catch (error) {
      posthog?.captureException(error, {
        auth_flow: "remove_other_sessions",
      });
      setMessage("Some sessions could not be removed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisabledDelete = () => {
    Alert.alert("Account Deletion", ACCOUNT_DELETION_DISABLED_MESSAGE);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 p-5">
        <Text className="text-3xl font-sans-bold text-primary">Settings</Text>

        <View className="mt-8 rounded-3xl bg-white p-5">
          <Text className="text-xl font-sans-bold text-primary">
            Account Security
          </Text>
          <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
            {sessionList.isLoaded
              ? `${otherSessions.length} other session${otherSessions.length === 1 ? "" : "s"} registered on this device`
              : "Checking sessions..."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out other sessions"
            className={`mt-5 rounded-2xl border border-accent px-5 py-4 ${
              (busy || otherSessions.length === 0) && "opacity-50"
            }`}
            disabled={
              busy || !sessionList.isLoaded || otherSessions.length === 0
            }
            onPress={removeOtherSessions}
          >
            <Text className="text-center text-base font-sans-bold text-primary">
              Sign Out Other Sessions
            </Text>
          </Pressable>
        </View>

        {message && (
          <Text className="mt-4 text-sm font-sans-medium text-primary">
            {message}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          className={`mt-5 rounded-2xl bg-accent px-5 py-4 ${
            busy && "opacity-50"
          }`}
          disabled={busy}
          onPress={handleSignOut}
        >
          <Text className="text-center text-base font-sans-bold text-primary">
            Sign Out
          </Text>
        </Pressable>

        <View className="mb-8 mt-8 rounded-3xl border border-red-200 bg-white p-5">
          <Text className="text-xl font-sans-bold text-red-700">
            Delete Account
          </Text>
          <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
            {ACCOUNT_DELETION_DISABLED_MESSAGE}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete account unavailable"
            className="mt-5 rounded-2xl bg-red-600/50 px-5 py-4"
            disabled={true}
            onPress={handleDisabledDelete}
          >
            <Text className="text-center text-base font-sans-bold text-white">
              Delete Account (Disabled)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
