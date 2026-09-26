import { Colors } from "@/constants/colors";
import { getTriviaSocket } from "@/lib/socket";
import { type UserInfo } from "@/store/user";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import CustomImg from "./CustomImg";

type Screen = "menu" | "creating" | "joining" | "waiting" | "error";

interface LobbyData {
  roomCode: string;
  players: { name: string; avatarUrl: string | null }[];
  canStart: boolean;
}

interface PrivateChallengeProps {
  user: UserInfo;
  onGameStarted: () => void;
  onBack: () => void;
}

export function PrivateChallenge({
  user,
  onGameStarted,
  onBack,
}: PrivateChallengeProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [lobby, setLobby] = useState<LobbyData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isHost, setIsHost] = useState(false);
  const socketRef = useRef(getTriviaSocket());

  useEffect(() => {
    const socket = socketRef.current;

    const onCreated = (data: { roomCode: string }) => {
      setRoomCode(data.roomCode);
      setScreen("waiting");
      setIsHost(true);
    };

    const onLobby = (data: LobbyData) => {
      setLobby(data);
      setRoomCode(data.roomCode);
      setScreen("waiting");
    };

    const onError = (data: { message: string }) => {
      setErrorMsg(data.message);
      setScreen("error");
    };

    const onQuestion = () => {
      onGameStarted();
    };

    socket.on("trivia:private_created", onCreated);
    socket.on("trivia:private_lobby", onLobby);
    socket.on("trivia:private_error", onError);
    socket.on("trivia:question", onQuestion);

    return () => {
      socket.off("trivia:private_created", onCreated);
      socket.off("trivia:private_lobby", onLobby);
      socket.off("trivia:private_error", onError);
      socket.off("trivia:question", onQuestion);
    };
  }, [onGameStarted]);

  const handleCreate = useCallback(() => {
    setScreen("creating");
    const socket = socketRef.current;
    if (!socket.connected) socket.connect();
    socket.emit("trivia:create_private", {
      userId: user.id,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatar_url,
    });
  }, [user]);

  const handleJoin = useCallback(() => {
    if (joinCode.length !== 4) {
      Alert.alert("Invalid code", "Please enter a 4-digit room code.");
      return;
    }
    const socket = socketRef.current;
    if (!socket.connected) socket.connect();
    socket.emit("trivia:join_private", {
      roomCode: joinCode,
      userId: user.id,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatar_url,
    });
  }, [joinCode, user]);

  const handleStart = useCallback(() => {
    socketRef.current.emit("trivia:start_private", { roomCode });
  }, [roomCode]);

  const handleShare = useCallback(() => {
    Share.share({
      message: `Join my SportsIQ trivia game! Code: ${roomCode}`,
    });
  }, [roomCode]);

  const handleLeave = useCallback(() => {
    socketRef.current.emit("trivia:leave_private");
    setScreen("menu");
    setLobby(null);
    setRoomCode("");
    setIsHost(false);
  }, []);

  // ---------- Menu ----------
  if (screen === "menu") {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Pressable onPress={onBack} style={{ position: "absolute", top: 16, left: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#94a3b8" />
        </Pressable>

        <Ionicons
          name="people"
          size={56}
          color="#3b82f6"
          style={{ marginBottom: 16 }}
        />

        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: "#f8fafc",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Play with Friends
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#94a3b8",
            textAlign: "center",
            marginBottom: 32,
            lineHeight: 22,
          }}
        >
          Create a private game or join with a code. 2-8 players, 10 questions.
        </Text>

        <Pressable
          onPress={handleCreate}
          style={{
            backgroundColor: "#3b82f6",
            borderRadius: 14,
            paddingVertical: 16,
            width: "100%",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
            Create Game
          </Text>
        </Pressable>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            width: "100%",
            marginTop: 8,
          }}
        >
          <TextInput
            value={joinCode}
            onChangeText={(v) => setJoinCode(v.replace(/\D/g, "").slice(0, 4))}
            placeholder="Code"
            placeholderTextColor="#475569"
            keyboardType="number-pad"
            maxLength={4}
            style={{
              flex: 1,
              backgroundColor: "#1e293b",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 18,
              color: "#f8fafc",
              textAlign: "center",
              letterSpacing: 6,
            }}
          />
          <Pressable
            onPress={handleJoin}
            style={{
              backgroundColor: "#1e293b",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: "#334155",
            }}
          >
            <Text style={{ color: "#60a5fa", fontSize: 16, fontWeight: "700" }}>
              Join
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------- Creating spinner ----------
  if (screen === "creating") {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 15 }}>
          Creating room...
        </Text>
      </View>
    );
  }

  // ---------- Error ----------
  if (screen === "error") {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#f87171",
            marginTop: 12,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {errorMsg || "Something went wrong"}
        </Text>
        <Pressable
          onPress={() => setScreen("menu")}
          style={{ marginTop: 16, paddingVertical: 10 }}
        >
          <Text style={{ color: "#60a5fa", fontSize: 15, fontWeight: "600" }}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---------- Waiting room ----------
  return (
    <View className="flex-1 px-6 pt-6">
      <Pressable onPress={handleLeave} style={{ marginBottom: 16 }}>
        <Ionicons name="arrow-back" size={24} color="#94a3b8" />
      </Pressable>

      {/* Room code display */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 13,
            color: "#64748b",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          Room Code
        </Text>
        <Text
          style={{
            fontSize: 44,
            fontWeight: "900",
            color: "#f8fafc",
            letterSpacing: 8,
            fontVariant: ["tabular-nums"],
          }}
        >
          {roomCode}
        </Text>
        <Pressable
          onPress={handleShare}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: "#1e293b",
            borderRadius: 10,
          }}
        >
          <Ionicons name="share-outline" size={16} color="#60a5fa" />
          <Text style={{ color: "#60a5fa", fontSize: 14, fontWeight: "600" }}>
            Share Code
          </Text>
        </Pressable>
      </View>

      {/* Player list */}
      <Text
        style={{
          fontSize: 12,
          color: "#64748b",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 12,
        }}
      >
        Players ({lobby?.players.length ?? 0}/8)
      </Text>

      <View style={{ gap: 8, flex: 1 }}>
        {lobby?.players.map((p, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#1e293b",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: "#334155",
              }}
            >
              <CustomImg
                uri={p.avatarUrl ?? undefined}
                width={36}
                height={36}
              />
            </View>
            <Text style={{ color: "#f1f5f9", fontSize: 15, fontWeight: "600" }}>
              {p.name}
            </Text>
            {i === 0 && (
              <View
                style={{
                  backgroundColor: "rgba(234,179,8,0.15)",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginLeft: "auto",
                }}
              >
                <Text style={{ color: "#eab308", fontSize: 11, fontWeight: "700" }}>
                  HOST
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Start button (host only) */}
      {isHost && (
        <Pressable
          onPress={handleStart}
          disabled={!lobby?.canStart}
          style={{
            backgroundColor: lobby?.canStart ? "#22c55e" : "#334155",
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 24,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              color: lobby?.canStart ? "#fff" : "#64748b",
              fontSize: 17,
              fontWeight: "800",
            }}
          >
            {lobby?.canStart
              ? "Start Game"
              : `Need ${2 - (lobby?.players.length ?? 0)} more player${(lobby?.players.length ?? 0) < 1 ? "s" : ""}`}
          </Text>
        </Pressable>
      )}

      {!isHost && (
        <View
          style={{
            alignItems: "center",
            marginBottom: 24,
            marginTop: 16,
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: 15 }}>
            Waiting for host to start...
          </Text>
        </View>
      )}
    </View>
  );
}
