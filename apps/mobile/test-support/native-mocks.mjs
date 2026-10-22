import React from "react";

// Only React/native-wiring test processes load this module.
process.env.EXPO_PUBLIC_DATA_MODE = "development";
process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN = "test-only";
process.env.EXPO_PUBLIC_POSTHOG_HOST = "https://example.invalid";

export const auth = { isLoaded: true, isSignedIn: true, userId: "test_user", sessionId: "test_session", signOut: async () => {} };
export const sessions = { isLoaded: true, sessions: [] };
export const useAuth = () => auth;
export const useSessionList = () => sessions;
export const styled = Component => Component;
export const View = "View";
export const Text = "Text";
export const Pressable = "Pressable";
export const ScrollView = "ScrollView";
export const TextInput = "TextInput";
export const Modal = "Modal";
export const KeyboardAvoidingView = "KeyboardAvoidingView";
export const ActivityIndicator = "ActivityIndicator";
export const SafeAreaView = "SafeAreaView";
export const Image = "Image";
export const Platform = { OS: "ios" };
export const alerts = [];
export const Alert = { alert: (...args) => alerts.push(args) };
export const Redirect = "Redirect";
export const Stack = () => React.createElement("Stack");
export const navigation = [];
export const router = { replace: value => navigation.push(value), back() {} };
export const useLocalSearchParams = () => ({ id: "test_sub" });
export const PostHogProvider = ({ children }) => children;
export const analytics = { constructions: 0, events: [] };
export default class PostHog {
  constructor() { analytics.constructions++; }
  capture(...args) { analytics.events.push(args); }
}
