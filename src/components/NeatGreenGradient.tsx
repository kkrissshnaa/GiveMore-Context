import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

export interface NeatGreenGradientProps {
  speed?: number; // Wave speed scale
  animated?: boolean;
}

/**
 * Neat 3D Mesh Wave Gradient Component (Lemon Preset Green Adaptation)
 * Inspired by https://neat.firecms.co/
 * 
 * Color Mapping:
 * - Color 1 (Primary Accent): #B2FF59 (Electric Lime Green)
 * - Color 2 (Shadow Depth):   #061B0A (Deep Emerald Forest)
 * - Color 3 (Highlight Aura): #D8FCDA (Soft Mint Ice Highlight)
 * - Base Color:               #050B06 (Midnight Dark Green)
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
      {/* Base Dark Midnight Green Linear Gradient */}
      <LinearGradient
        colors={['#050B06', '#08140A', '#040804']}
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
          {/* Main Electric Lime Wave Blob (#B2FF59) */}
          <RadialGradient
            id="neatPrimaryLimeWave"
            cx="48%"
            cy="36%"
            r="65%"
            fx="42%"
            fy="30%"
          >
            <Stop offset="0%" stopColor="#B2FF59" stopOpacity="0.75" />
            <Stop offset="18%" stopColor="#9DEE45" stopOpacity="0.62" />
            <Stop offset="35%" stopColor="#7CD22B" stopOpacity="0.45" />
            <Stop offset="52%" stopColor="#58B218" stopOpacity="0.28" />
            <Stop offset="70%" stopColor="#358B0A" stopOpacity="0.14" />
            <Stop offset="88%" stopColor="#195B03" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#050B06" stopOpacity="0" />
          </RadialGradient>

          {/* Soft Mint Ice Highlight Aura (#D8FCDA - Specular Highlights: 7) */}
          <RadialGradient
            id="neatMintHighlightAura"
            cx="22%"
            cy="15%"
            r="55%"
          >
            <Stop offset="0%" stopColor="#EBFDEB" stopOpacity="0.65" />
            <Stop offset="20%" stopColor="#D8FCDA" stopOpacity="0.48" />
            <Stop offset="40%" stopColor="#A8F6AC" stopOpacity="0.30" />
            <Stop offset="62%" stopColor="#6EE075" stopOpacity="0.15" />
            <Stop offset="82%" stopColor="#35A63D" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#050B06" stopOpacity="0" />
          </RadialGradient>

          {/* Deep Emerald Shadow Depth (#061B0A - Shadows: 4) */}
          <RadialGradient
            id="neatEmeraldShadowDepth"
            cx="80%"
            cy="70%"
            r="70%"
          >
            <Stop offset="0%" stopColor="#0E3D16" stopOpacity="0.85" />
            <Stop offset="25%" stopColor="#0A2D0F" stopOpacity="0.68" />
            <Stop offset="50%" stopColor="#061B0A" stopOpacity="0.48" />
            <Stop offset="75%" stopColor="#041006" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#050B06" stopOpacity="0" />
          </RadialGradient>

          {/* Secondary Bottom-Right Lime Light Refraction */}
          <RadialGradient
            id="neatBottomLimeRefraction"
            cx="75%"
            cy="45%"
            r="50%"
          >
            <Stop offset="0%" stopColor="#8BEB35" stopOpacity="0.42" />
            <Stop offset="30%" stopColor="#63C61B" stopOpacity="0.26" />
            <Stop offset="60%" stopColor="#3C950A" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#050B06" stopOpacity="0" />
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
