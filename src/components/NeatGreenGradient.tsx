import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface NeatGreenGradientProps {
  speed?: number; // Wave speed scale
  animated?: boolean;
}

/**
 * Neat 3D Mesh Wave Gradient Component (#E5FF1F Yellow-Lime Adaptation)
 * Inspired by https://neat.firecms.co/
 * 
 * Color Mapping:
 * - Color 1 (Primary Accent): #E5FF1F (Electric Yellow-Lime)
 * - Color 2 (Shadow Depth):   #1B1E02 (Deep Olive Shadow)
 * - Color 3 (Highlight Aura): #F5FFA8 (Soft Ice Yellow Highlight)
 * - Base Color:               #070801 (Midnight Dark Base)
 */
export function NeatGreenGradient({
  speed = 1.0,
  animated = true,
}: NeatGreenGradientProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const wavePhase = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      wavePhase.value = withRepeat(
        withTiming(1, {
          duration: 12000 / Math.max(0.2, speed),
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [animated, speed, wavePhase]);

  const svgWidth = windowWidth > 0 ? windowWidth : 1000;
  const svgHeight = windowHeight > 0 ? windowHeight : 1000;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base Dark Midnight Linear Gradient */}
      <LinearGradient
        colors={['#080902', '#121404', '#060701']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Neat 3D Wave Mesh Layer via Multi-Stop Radial SVG */}
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Main Electric Yellow-Lime Wave Blob (#E5FF1F) */}
          <RadialGradient
            id="neatPrimaryLimeWave"
            cx="48%"
            cy="36%"
            r="65%"
            fx="42%"
            fy="30%"
          >
            <Stop offset="0%" stopColor="#E5FF1F" stopOpacity="0.75" />
            <Stop offset="18%" stopColor="#DAF51A" stopOpacity="0.62" />
            <Stop offset="35%" stopColor="#C2DE14" stopOpacity="0.45" />
            <Stop offset="52%" stopColor="#9DB50F" stopOpacity="0.28" />
            <Stop offset="70%" stopColor="#748709" stopOpacity="0.14" />
            <Stop offset="88%" stopColor="#4B5904" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#070801" stopOpacity="0" />
          </RadialGradient>

          {/* Soft Ice Yellow Highlight Aura (#F5FFA8) */}
          <RadialGradient
            id="neatMintHighlightAura"
            cx="22%"
            cy="15%"
            r="55%"
          >
            <Stop offset="0%" stopColor="#FAFFD6" stopOpacity="0.65" />
            <Stop offset="20%" stopColor="#F5FFA8" stopOpacity="0.48" />
            <Stop offset="40%" stopColor="#EEFF7A" stopOpacity="0.30" />
            <Stop offset="62%" stopColor="#E2F84B" stopOpacity="0.15" />
            <Stop offset="82%" stopColor="#A2B51F" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#070801" stopOpacity="0" />
          </RadialGradient>

          {/* Deep Olive Shadow Depth (#1B1E02) */}
          <RadialGradient
            id="neatEmeraldShadowDepth"
            cx="80%"
            cy="70%"
            r="70%"
          >
            <Stop offset="0%" stopColor="#232803" stopOpacity="0.85" />
            <Stop offset="25%" stopColor="#1B1E02" stopOpacity="0.68" />
            <Stop offset="50%" stopColor="#111401" stopOpacity="0.48" />
            <Stop offset="75%" stopColor="#0A0C01" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#070801" stopOpacity="0" />
          </RadialGradient>

          {/* Secondary Bottom-Right Yellow-Lime Light Refraction */}
          <RadialGradient
            id="neatBottomLimeRefraction"
            cx="75%"
            cy="45%"
            r="50%"
          >
            <Stop offset="0%" stopColor="#DCFF33" stopOpacity="0.42" />
            <Stop offset="30%" stopColor="#BCE018" stopOpacity="0.26" />
            <Stop offset="60%" stopColor="#8EAA0D" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#070801" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Mesh Composite Layers */}
        <Rect width={svgWidth} height={svgHeight} fill="url(#neatPrimaryLimeWave)" />
        <Rect width={svgWidth} height={svgHeight} fill="url(#neatMintHighlightAura)" />
        <Rect width={svgWidth} height={svgHeight} fill="url(#neatEmeraldShadowDepth)" />
        <Rect width={svgWidth} height={svgHeight} fill="url(#neatBottomLimeRefraction)" />
      </Svg>
    </View>
  );
}
