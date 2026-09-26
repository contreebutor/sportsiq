import { TriviaGame } from "@/components/TriviaGame";
import { type UserInfo } from "@/store/user";
import { Text, View } from "react-native";

const BRAND = {
  bg: "#050912",
  muted: "#94A3B8",
} as const;

interface PlayScreenProps {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
}

export function PlayScreen({ user, setUser }: PlayScreenProps) {
  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      {user ? (
        <TriviaGame user={user} setUser={setUser} />
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: BRAND.muted, fontSize: 14 }}>Loading...</Text>
        </View>
      )}
    </View>
  );
}
