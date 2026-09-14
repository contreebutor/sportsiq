import { createUser, uploadAvatar } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreateProfileScreen() {
  const { phone } = useUserStore();
  const [form, setForm] = useState<{
    nickname: string;
    avatarUri: string | null;
  }>({
    nickname: "",
    avatarUri: null,
  });
  const [loading, setLoading] = useState(false);

  const setNickname = (nickname: string) =>
    setForm((prev) => ({ ...prev, nickname }));
  const setAvatarUri = (avatarUri: string | null) =>
    setForm((prev) => ({ ...prev, avatarUri }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to photos to upload avatar."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!phone) {
      Alert.alert("Error", "Phone number not found. Please sign in again.");
      return;
    }
    const trimmed = form.nickname.trim();
    if (!trimmed) {
      Alert.alert("Required", "Please enter a nickname.");
      return;
    }
    setLoading(true);
    try {
      let avatar_url = null;
      if (form.avatarUri) {
        avatar_url = await uploadAvatar(form.avatarUri);
      }
      await createUser(phone, trimmed, avatar_url);
      router.replace("/(app)");
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Could not create profile. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-900"
    >
      <View className="flex-1 p-6 pt-8">
        <Pressable onPress={pickImage} className="self-center mb-8">
          {form.avatarUri ? (
            <Image
              source={{ uri: form.avatarUri }}
              className="w-[120px] h-[120px] rounded-full"
            />
          ) : (
            <View className="w-[120px] h-[120px] rounded-full bg-slate-800 items-center justify-center">
              <Ionicons name="camera" size={40} color="#64748b" />
              <Text className="mt-2 text-sm text-slate-500">Add photo</Text>
            </View>
          )}
        </Pressable>

        <Text className="text-base font-semibold text-slate-50 mb-2">
          Nickname
        </Text>
        <TextInput
          className="bg-slate-800 rounded-xl p-4 text-xl text-slate-50 mb-6 leading-tight"
          placeholder="Enter nickname"
          placeholderTextColor="#64748b"
          value={form.nickname}
          onChangeText={setNickname}
          autoCapitalize="words"
          editable={!loading}
        />

        <Pressable
          className={`rounded-xl py-4 items-center bg-blue-500 ${loading ? "opacity-70" : ""}`}
          onPress={submit}
          disabled={loading}
        >
          <Text className="text-white text-[17px] font-semibold">
            Create profile
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
