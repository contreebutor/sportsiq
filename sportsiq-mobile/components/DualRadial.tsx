import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { View, ViewStyle } from "react-native";

interface Props {
  children: ReactNode;
  leftColor?: string;
  rightColor?: string;
  baseColor?: string;
  style?: ViewStyle;
}

/**
 * Mobile equivalent of the web's bg-dual-radial. Approximates the dual radial
 * gradient using two overlapping diagonal LinearGradient layers:
 *   - left blob: top-left corner → bottom-right (leftColor → transparent)
 *   - right blob: top-right corner → bottom-left (rightColor → transparent)
 * Both stacked over a dark base color.
 */
export default function DualRadial({
  children,
  leftColor = "#3C2B58",
  rightColor = "#25375B",
  baseColor = "#110e2a",
  style,
}: Props) {
  return (
    <View style={[{ backgroundColor: baseColor, overflow: "hidden" }, style]}>
      {/* Left blob: top-left → bottom-right */}
      <LinearGradient
        colors={[leftColor, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      {/* Right blob: top-right → bottom-left */}
      <LinearGradient
        colors={[rightColor, "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.85,
        }}
      />
      {children}
    </View>
  );
}
