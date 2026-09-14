import { useUserStore } from "@/store/user";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const phone = useUserStore((s) => s.phone);
  const hydrated = useUserStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#7C6EF5" size="large" />
      </View>
    );
  }

  if (phone === null) {
    return <Redirect href="/enter-phone" />;
  }

  return <Redirect href="/(app)" />;
}
