import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface AestheticBackdropProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  gradientColors?: [string, string, ...string[]];
  showOrbs?: boolean;
  showGrain?: boolean;
}

// Ultra-fine high quality SVG noise grain
const GRAIN_NOISE_SVG = `data:image/svg+xml;utf8,<svg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>`;

export function AestheticBackdrop({
  children,
  style,
  gradientColors = ['#050a06', '#0d180e', '#060907'],
  showOrbs = true,
  showGrain = true,
}: AestheticBackdropProps) {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Blurred Ambient Liquid Gradient Orbs */}
      {showOrbs && (
        <>
          {/* Top-Left Lime Ambient Glow */}
          <View
            style={[
              styles.orb,
              {
                top: -60,
                left: -50,
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: 'rgba(178, 255, 89, 0.14)',
              },
            ]}
            pointerEvents="none"
          />
          {/* Center-Right Cyan-Emerald Liquid Glow */}
          <View
            style={[
              styles.orb,
              {
                top: '32%',
                right: -70,
                width: 340,
                height: 340,
                borderRadius: 170,
                backgroundColor: 'rgba(16, 185, 129, 0.09)',
              },
            ]}
            pointerEvents="none"
          />
          {/* Bottom-Left Lime Ambient Glow */}
          <View
            style={[
              styles.orb,
              {
                bottom: 30,
                left: -40,
                width: 280,
                height: 280,
                borderRadius: 140,
                backgroundColor: 'rgba(178, 255, 89, 0.10)',
              },
            ]}
            pointerEvents="none"
          />
        </>
      )}

      {/* Subtle Aesthetic Film Grain Texture Overlay */}
      {showGrain && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={{ uri: GRAIN_NOISE_SVG }}
            style={styles.grainImage}
            contentFit="cover"
          />
        </View>
      )}

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    ...Platform.select({
      web: {
        filter: 'blur(75px)',
      },
      default: {
        // Native fallback opacity rendering for clean performance
      },
    }),
  },
  grainImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.04,
  },
});
