import { createOtp, needsOtp } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TERMS_URL = "https://www.lumen-iq.com/sportsiq/terms.html";

const formatPhone = (digits: string): string => {
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function PhoneScreen() {
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { setPhone } = useUserStore();

  const handleChange = (value: string) => {
    setDigits(value.replace(/\D/g, "").slice(0, 10));
  };

  const submit = async () => {
    if (digits.length < 10) {
      Alert.alert("Invalid", "Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = `+1${digits}`;
      const otpRequired = await needsOtp(formattedPhone);
      if (!otpRequired) {
        // OTP verified within last 7 days — skip verification
        setPhone(formattedPhone);
        router.replace("/(app)");
        return;
      }
      await createOtp(formattedPhone);
      router.replace({
        pathname: "/verify-phone",
        params: { phone: formattedPhone },
      });
    } catch {
      Alert.alert("Error", "Could not send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-12">
          <Text className="text-2xl font-bold text-slate-50 mb-2">
            Enter your phone number
          </Text>

          <Text className="text-lg text-slate-400 mb-8">
            We will send you a 5-digit verification code.
          </Text>
          <View className="h-16 bg-slate-800 rounded-xl flex flex-row items-center mb-5">
            <View className="h-10 items-center justify-center px-4">
              <Text className="text-xl">{"\uD83C\uDDFA\uD83C\uDDF8"}</Text>
            </View>
            <TextInput
              className="text-xl text-slate-50 leading-tight flex-1"
              placeholder="(123) 456-7890"
              placeholderTextColor="#888"
              value={formatPhone(digits)}
              onChangeText={handleChange}
              keyboardType="phone-pad"
              autoFocus
              editable={!loading}
            />
          </View>
          <Pressable
            className="flex-row items-start gap-3 mb-5"
            onPress={() => setAgreed(!agreed)}
          >
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center mt-0.5 ${
                agreed ? "bg-blue-500 border-blue-500" : "border-slate-500"
              }`}
            >
              {agreed && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </View>
            <Text className="flex-1 text-slate-300 text-sm leading-5">
              {"I have read and agree to the "}
              <Text
                className="text-blue-400 underline font-semibold"
                onPress={() => Linking.openURL(TERMS_URL)}
              >
                Terms and Conditions
              </Text>
            </Text>
          </Pressable>
          <Pressable
            className={`rounded-xl py-4 items-center justify-center min-h-[52px] bg-blue-500 ${loading || !agreed ? "opacity-50" : ""}`}
            onPress={submit}
            disabled={loading || !agreed}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-[17px] font-semibold">
                Continue
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
