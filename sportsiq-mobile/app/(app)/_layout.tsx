import { Colors } from "@/constants/colors";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
  const { loading } = useAuthUser();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-profile"
        options={{ title: "Create profile", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ title: "Edit profile", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="transfer-points"
        options={{ title: "Transfer points", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="scan"
        options={{ title: "Scan QR Code", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="submit-predictions/[id]"
        options={{ title: "Predictor", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="submit-bingo-cards/[id]"
        options={{ title: "Bingo", headerBackTitle: "Back" }}
      />
    </Stack>
  );
}
