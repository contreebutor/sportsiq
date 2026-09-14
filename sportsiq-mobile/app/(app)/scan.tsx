import { Colors } from "@/constants/colors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    let path: string | null = null;

    // Handle mobile deep link: sportsiqmobile://submit-predictions/{id}
    if (data.startsWith("sportsiqmobile://")) {
      path = data.replace("sportsiqmobile://", "/");
    } else {
      // Handle web URL: https://domain/submit-predictions/{id}
      try {
        const url = new URL(data);
        path = url.pathname;
      } catch {
        // Not a valid URL
      }
    }

    if (path) {
      const predictorMatch = path.match(/^\/submit-predictions\/(.+)$/);
      const bingoMatch = path.match(/^\/submit-bingo-cards\/(.+)$/);

      if (predictorMatch) {
        router.replace(`/(app)/submit-predictions/${predictorMatch[1]}`);
        return;
      }
      if (bingoMatch) {
        router.replace(`/(app)/submit-bingo-cards/${bingoMatch[1]}`);
        return;
      }
    }

    Alert.alert(
      "Invalid QR Code",
      "This QR code is not a valid SportsIQ contest.",
      [{ text: "Scan Again", onPress: () => setScanned(false) }]
    );
  };

  if (!permission) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#050912" }}
        edges={["bottom"]}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#94A3B8", fontSize: 16 }}>
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#050912" }}
        edges={["bottom"]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
            gap: 20,
          }}
        >
          <Ionicons name="camera-outline" size={64} color="#94A3B8" />
          <Text
            style={{
              color: "#F8FAFC",
              fontSize: 18,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Camera Access Required
          </Text>
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            We need camera access to scan QR codes for contest games.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={{
              backgroundColor: "#5545D3",
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 12,
            }}
          >
            <Text
              style={{ color: "#F8FAFC", fontSize: 16, fontWeight: "700" }}
            >
              Grant Permission
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#050912" }}
      edges={["bottom"]}
    >
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />

        {/* Overlay with scan frame */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
          pointerEvents="none"
        >
          <View
            style={{
              width: 250,
              height: 250,
              borderWidth: 2,
              borderColor: "#5545D3",
              borderRadius: 16,
            }}
          />
          <Text
            style={{
              color: "#F8FAFC",
              fontSize: 16,
              fontWeight: "600",
              marginTop: 24,
              textAlign: "center",
            }}
          >
            Point camera at a contest QR code
          </Text>
        </View>

        {/* Scan again button when scanned */}
        {scanned && (
          <View
            style={{
              position: "absolute",
              bottom: 40,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => setScanned(false)}
              style={{
                backgroundColor: "#5545D3",
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 12,
              }}
            >
              <Text
                style={{ color: "#F8FAFC", fontSize: 16, fontWeight: "700" }}
              >
                Scan Again
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
