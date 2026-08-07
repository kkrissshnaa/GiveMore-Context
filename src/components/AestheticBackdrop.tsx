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
  showBeam?: boolean;
}

// Tactile film noise grain texture matching the reference image
const GRAIN_NOISE_SVG = `data:image/svg+xml;utf8,<svg viewBox='0 0 350 350' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.85'/></svg>`;

// Ultra-subtle, seamless atmospheric green & dark charcoal background SVG matching user's reference image
const SUBTLE_GREEN_GRAIN_BACKGROUND_SVG = `data:image/svg+xml;utf8,<svg width='1000' height='1000' viewBox='0 0 1000 1000' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='bgBase' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23060b07'/><stop offset='45%' stop-color='%230b120c'/><stop offset='100%' stop-color='%23050806'/></linearGradient><radialGradient id='softTopLeftGlow' cx='10%' cy='0%' r='110%'><stop offset='0%' stop-color='%2362c459' stop-opacity='0.55'/><stop offset='30%' stop-color='%2344a23d' stop-opacity='0.36'/><stop offset='60%' stop-color='%23225b1f' stop-opacity='0.16'/><stop offset='85%' stop-color='%230d1c0e' stop-opacity='0.04'/><stop offset='100%' stop-color='%23050806' stop-opacity='0'/></radialGradient><linearGradient id='subtleDiagonalWash' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%235bb754' stop-opacity='0.25'/><stop offset='35%' stop-color='%2362c459' stop-opacity='0.42'/><stop offset='55%' stop-color='%2382db75' stop-opacity='0.60'/><stop offset='75%' stop-color='%235bb754' stop-opacity='0.35'/><stop offset='100%' stop-color='%23183819' stop-opacity='0.08'/></linearGradient></defs><rect width='1000' height='1000' fill='url(%23bgBase)'/><rect width='1000' height='1000' fill='url(%23softTopLeftGlow)'/><g transform='rotate(-36 500 500)'><rect x='-400' y='-400' width='1800' height='1800' fill='url(%23subtleDiagonalWash)'/></g></svg>`;

export function AestheticBackdrop({
  children,
  style,
  gradientColors = ['#060b07', '#0b120c', '#050806'],
  showOrbs = true,
  showGrain = true,
  showBeam = true,
}: AestheticBackdropProps) {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Seamless Vector Backdrop SVG (Soft Top-Left Wash & Subtle Wide Diagonal Glow) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={{ uri: SUBTLE_GREEN_GRAIN_BACKGROUND_SVG }}
          style={styles.fullImage}
          contentFit="cover"
        />
      </View>

      {/* Atmospheric High-Blur Ambient Lighting (No sharp edges, seamlessly blended) */}
      {showOrbs && (
        <>
          {/* Super Diffuse Top-Left Lime-Emerald Aura */}
          <View
            style={[
              styles.orb,
              {
                top: -180,
                left: -140,
                width: 600,
                height: 600,
                borderRadius: 300,
                backgroundColor: 'rgba(98, 196, 89, 0.22)',
              },
            ]}
            pointerEvents="none"
          />

          {/* Ultra-Soft Wide Diagonal Wash */}
          {showBeam && (
            <View style={styles.beamWrapper} pointerEvents="none">
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(24, 56, 25, 0.08)',
                  'rgba(68, 162, 61, 0.22)',
                  'rgba(130, 219, 117, 0.45)',
                  'rgba(155, 235, 143, 0.58)',
                  'rgba(130, 219, 117, 0.45)',
                  'rgba(68, 162, 61, 0.22)',
                  'rgba(24, 56, 25, 0.08)',
                  'transparent',
                ]}
                locations={[0, 0.18, 0.35, 0.48, 0.5, 0.52, 0.65, 0.82, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.beamGradient}
              />
            </View>
          )}
        </>
      )}

      {/* Tactile Noise Grain Overlay */}
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
    backgroundColor: '#060b07',
  },
  fullImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.98,
  },
  orb: {
    position: 'absolute',
    ...Platform.select({
      web: {
        filter: 'blur(150px)',
      },
      default: {
        opacity: 0.75,
      },
    }),
  },
  beamWrapper: {
    position: 'absolute',
    top: '-45%',
    right: '-55%',
    width: '210%',
    height: '210%',
    transform: [{ rotate: '-36deg' }],
    ...Platform.select({
      web: {
        filter: 'blur(55px)',
      },
      default: {
        opacity: 0.8,
      },
    }),
  },
  beamGradient: {
    width: '100%',
    height: '100%',
  },
  grainImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.14,
  },
});
