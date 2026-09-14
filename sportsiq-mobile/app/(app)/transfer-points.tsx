import { transferPoints } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { router } from "expo-router";
import { useState } from "react";
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

export default function TransferPointsScreen() {
  const { phone, user, setUser } = useUserStore();
  const [targetPhone, setTargetPhone] = useState("");
  const [amountText, setAmountText] = useState("");
  const [transferring, setTransferring] = useState(false);

  const availablePoints = user?.points ?? 0;
  const amount = parseInt(amountText || "0", 10) || 0;
  const fee = Math.round(amount * 0.03);
  const totalDeducted = amount + fee;
  const insufficient = amount > 0 && totalDeducted > availablePoints;

  const handleTransfer = async () => {
    const cleanedSource = phone?.trim();
    const cleanedTarget = targetPhone.trim();

    if (!cleanedSource) {
      Alert.alert("Error", "Your phone number is not available.");
      return;
    }

    if (!cleanedTarget) {
      Alert.alert("Invalid", "Please enter a target phone number.");
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid", "Please enter a valid number of points.");
      return;
    }

    if (amount < 50) {
      Alert.alert("Invalid", "Minimum points to transfer is 50.");
      return;
    }

    if (insufficient) {
      Alert.alert(
        "Not enough points",
        "You do not have enough points to transfer this amount including the fee."
      );
      return;
    }

    setTransferring(true);
    try {
      await transferPoints(cleanedSource, cleanedTarget, totalDeducted);
      if (user) {
        const updatedPoints = Math.max(0, user.points - totalDeducted);
        setUser({ ...user, points: updatedPoints });
      }
      setTargetPhone("");
      setAmountText("");
      router.back();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to transfer points. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 p-6 pt-2">
          <Text className="text-sm text-slate-400 mb-5">
            Minimum transfer is 50 points.
          </Text>
          <Text className="text-base font-semibold text-slate-50 mb-2">
            Recipient phone number
          </Text>
          <TextInput
            className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3.5 text-base text-slate-50 mb-5"
            placeholder="+11234567890"
            placeholderTextColor="#64748b"
            value={targetPhone}
            onChangeText={setTargetPhone}
            keyboardType="phone-pad"
            editable={!transferring}
          />
          <Text className="text-base font-semibold text-slate-50 mb-2">
            Points to transfer
          </Text>
          <TextInput
            className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3.5 text-base text-slate-50 mb-5"
            placeholder="Points to transfer"
            placeholderTextColor="#64748b"
            value={amountText}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "");
              setAmountText(digits.replace(/^0+/, ""));
            }}
            keyboardType="number-pad"
            editable={!transferring}
          />
          {amount > 0 && (
            <Text
              className={`text-[13px] mb-2 ${insufficient ? "text-red-400" : "text-slate-400"}`}
            >
              You will be charged {totalDeducted} points (amount {amount} + 3%
              fee {fee}).
            </Text>
          )}
          {insufficient && (
            <Text className="text-[13px] text-red-400 mb-2">
              You do not have enough points for this transfer including the fee.
            </Text>
          )}
          <View className="flex-row justify-end gap-3 mt-6">
            <Pressable
              className={`py-3.5 px-5 rounded-xl border border-slate-600 ${transferring ? "opacity-70" : ""}`}
              onPress={() => router.back()}
              disabled={transferring}
            >
              <Text className="text-base font-semibold text-slate-200">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              className={`py-3.5 px-6 rounded-xl bg-blue-500 min-w-[120px] items-center justify-center ${transferring || insufficient ? "opacity-70" : ""}`}
              onPress={handleTransfer}
              disabled={transferring || insufficient}
            >
              {transferring ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Transfer
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
