import { createOtp, verifyOtp } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CODE_LENGTH = 5;
const RESEND_COOLDOWN_SEC = 60;

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setPhone } = useUserStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const submit = async () => {
    if (!phone) {
      router.replace("/enter-phone");
      return;
    }
    if (code.length !== CODE_LENGTH) {
      Alert.alert("Invalid", "Please enter the 5-digit code.");
      return;
    }
    setLoading(true);
    try {
      const verified = await verifyOtp(phone, parseInt(code, 10));
      if (!verified) {
        Alert.alert(
          "Verification failed",
          "Invalid or expired code. Try again."
        );
        return;
      }
      setPhone(phone);
      router.replace("/(app)");
    } catch {
      Alert.alert("Verification failed", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
  };

  const handleResend = async () => {
    if (!phone || resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await createOtp(phone);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      Alert.alert("Code sent", "A new verification code has been sent.");
    } catch {
      Alert.alert("Resend failed", "Could not send a new code. Try again.");
    } finally {
      setResendLoading(false);
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
            Enter verification code
          </Text>
          <Text className="text-lg text-slate-400 mb-1">
            We sent a 5-digit code to {phone ?? ""}
          </Text>
          <Pressable onPress={() => router.replace("/enter-phone")} className="mb-6">
            <Text className="text-blue-400 text-base font-medium">
              Change number
            </Text>
          </Pressable>
          <TextInput
            ref={inputRef}
            className="bg-slate-800 rounded-xl px-4 py-3.5 text-[28px] text-slate-50 text-center mb-6"
            style={{ letterSpacing: 8 }}
            placeholder="00000"
            placeholderTextColor="#64748b"
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            editable={!loading}
          />
          <Pressable
            className={`rounded-xl py-4 items-center justify-center min-h-[52px] bg-blue-500 ${loading ? "opacity-70" : ""}`}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-[17px] font-semibold">
                Verify
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="mt-6 py-3 items-center justify-center"
          >
            {resendLoading ? (
              <ActivityIndicator color="#94a3b8" size="small" />
            ) : resendCooldown > 0 ? (
              <Text className="text-slate-400 text-base">
                Resend code in {resendCooldown}s
              </Text>
            ) : (
              <Text className="text-blue-400 text-base font-medium">
                {"Didn't receive code?"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
