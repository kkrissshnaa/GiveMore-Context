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

// Ultra-fine tactile film noise grain
const GRAIN_NOISE_SVG = `data:image/svg+xml;utf8,<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.16 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.75'/></svg>`;

// Exact vector replica SVG matching the user's reference image (Dark Charcoal + Top Emerald Glow + Diagonal Lime-Emerald Ray)
const EXACT_GRADIENT_RAY_SVG = `data:image/svg+xml;utf8,<svg width='1000' height='1000' viewBox='0 0 1000 1000' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='bgGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23060b07'/><stop offset='45%' stop-color='%230d140e'/><stop offset='100%' stop-color='%23050806'/></linearGradient><radialGradient id='topArc' cx='25%' cy='8%' r='65%'><stop offset='0%' stop-color='%2346c354' stop-opacity='0.65'/><stop offset='30%' stop-color='%232e9a3d' stop-opacity='0.40'/><stop offset='65%' stop-color='%23184f22' stop-opacity='0.16'/><stop offset='100%' stop-color='%23070c08' stop-opacity='0'/></radialGradient><linearGradient id='beamCross' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23050806' stop-opacity='0'/><stop offset='15%' stop-color='%231b4820' stop-opacity='0.15'/><stop offset='32%' stop-color='%233ca848' stop-opacity='0.40'/><stop offset='46%' stop-color='%237ce387' stop-opacity='0.80'/><stop offset='50%' stop-color='%23a4f4ab' stop-opacity='0.98'/><stop offset='54%' stop-color='%237ce387' stop-opacity='0.80'/><stop offset='68%' stop-color='%233ca848' stop-opacity='0.40'/><stop offset='85%' stop-color='%231b4820' stop-opacity='0.15'/><stop offset='100%' stop-color='%23050806' stop-opacity='0'/></linearGradient></defs><rect width='1000' height='1000' fill='url(%23bgGrad)'/><rect width='1000' height='1000' fill='url(%23topArc)'/><g transform='rotate(-42 600 400)'><rect x='-200' y='-300' width='1400' height='1400' fill='url(%23beamCross)'/></g></svg>`;

export function AestheticBackdrop({
  children,
  style,
  gradientColors = ['#060b07', '#0d140e', '#050806'],
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
      {/* Exact Vector Backdrop SVG (Contains Top Glow + Angled Diagonal Ray) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={{ uri: EXACT_GRADIENT_RAY_SVG }}
          style={styles.fullImage}
          contentFit="cover"
        />
      </View>

      {/* Layered Hardware Accelerated Fallback / Ambient Elements */}
      {showOrbs && (
        <>
          {/* Top-Left Ambient Emerald Arc */}
          <View
            style={[
              styles.orb,
              {
                top: -90,
                left: -70,
                width: 380,
                height: 380,
                borderRadius: 190,
                backgroundColor: 'rgba(70, 195, 84, 0.22)',
              },
            ]}
            pointerEvents="none"
          />

          {/* Diagonal Light Beam (Ray) - Rotated Fallback Strip */}
          {showBeam && (
            <View style={styles.beamWrapper} pointerEvents="none">
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(27, 72, 32, 0.10)',
                  'rgba(60, 168, 72, 0.35)',
                  'rgba(124, 227, 135, 0.70)',
                  'rgba(164, 244, 171, 0.92)',
                  'rgba(124, 227, 135, 0.70)',
                  'rgba(60, 168, 72, 0.35)',
                  'rgba(27, 72, 32, 0.10)',
                  'transparent',
                ]}
                locations={[0, 0.15, 0.32, 0.46, 0.5, 0.54, 0.68, 0.85, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.beamGradient}
              />
            </View>
          )}
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
    backgroundColor: '#060b07',
  },
  fullImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.95,
  },
  orb: {
    position: 'absolute',
    ...Platform.select({
      web: {
        filter: 'blur(90px)',
      },
      default: {
        opacity: 0.85,
      },
    }),
  },
  beamWrapper: {
    position: 'absolute',
    top: '-35%',
    right: '-45%',
    width: '150%',
    height: '170%',
    transform: [{ rotate: '-42deg' }],
    ...Platform.select({
      web: {
        filter: 'blur(28px)',
      },
      default: {
        opacity: 0.85,
      },
    }),
  },
  beamGradient: {
    width: '100%',
    height: '100%',
  },
  grainImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.08,
  },
});

