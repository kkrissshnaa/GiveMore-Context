import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

export interface RealisticGlassBoxProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  showGlint?: boolean;
  glintPosition?: 'bottom-left' | 'top-left' | 'top-right' | 'bottom-right' | 'both';
  tintColor?: string;
  glowColor?: string;
  borderWidth?: number;
  elevation?: number;
}

/**
 * Specular Star Glint Component
 * Renders a delicate 4-pointed optical lens flare/glint on the curved glass corner/rim.
 */
function SpecularGlint({
  size = 28,
  color = '#FFFFFF',
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const half = size / 2;
  return (
    <View style={[{ width: size, height: size, pointerEvents: 'none' }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="glintAura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="25%" stopColor={color} stopOpacity="0.7" />
            <Stop offset="60%" stopColor="#E5FF1F" stopOpacity="0.25" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Central Soft Halo */}
        <Circle cx={half} cy={half} r={half * 0.9} fill="url(#glintAura)" />

        {/* 4-Point Specular Diamond Star */}
        <Path
          d={`M ${half} 0 Q ${half} ${half} 0 ${half} Q ${half} ${half} ${half} ${size} Q ${half} ${half} ${size} ${half} Q ${half} ${half} ${half} 0 Z`}
          fill={color}
          opacity={0.92}
        />

        {/* Inner intense core */}
        <Circle cx={half} cy={half} r={size * 0.12} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

/**
 * RealisticGlassBox Component
 *
 * Implements a true 3D optical glass container modeled directly after the physical glass breakdown:
 * 1. Increased Transparency: Translucent core with subtle tint that allows backdrops to refract through.
 * 2. Specular Highlights: Razor-sharp linear light catches along top border and upper curved rim.
 * 3. Blurred Effect: Optical diffusion and frosted glass styling.
 * 4. Soft Shadows: Deep diffuse ambient drop shadow + immediate base contact shadow.
 * 5. Inner Glow and Shadow: Inset refraction border creating 3D physical glass bevel/lip thickness.
 * 6. Glossy & Reflective: Upper dome convex reflection gradient + SVG specular star glints on corners.
 */
export function RealisticGlassBox({
  children,
  style,
  contentStyle,
  borderRadius = 32,
  showGlint = false,
  glintPosition = 'bottom-left',
  tintColor = 'rgba(12, 18, 10, 0.72)',
  glowColor = '#E5FF1F',
  borderWidth = 1,
}: RealisticGlassBoxProps) {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.outerContainer, { borderRadius }, style]}>
      {/* 1. Soft Deep Ambient Shadow & Contact Glow Layer */}
      <View
        pointerEvents="none"
        style={[
          styles.shadowLayer,
          {
            borderRadius,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.65,
            shadowRadius: 28,
            elevation: 16,
          },
        ]}
      />

      {/* 2. Glass Capsule Body Container (Clips internal reflections) */}
      <View
        style={[
          styles.glassBody,
          {
            borderRadius,
            backgroundColor: tintColor,
            borderWidth,
            borderColor: 'rgba(255, 255, 255, 0.28)',
            ...(isWeb
              ? ({
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                } as any)
              : {}),
          },
        ]}
      >
        {/* 3. Inner Glow & Thickness Bevel (Double Inset Rim Simulation) */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: Math.max(0, borderRadius - 1),
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              margin: 1,
            },
          ]}
          pointerEvents="none"
        />

        {/* 4. Upper Convex Glossy Reflection Sheen (Overhead Studio Light Catch) */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.22)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0.01)',
            'transparent',
          ]}
          locations={[0, 0.25, 0.6, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.glossyTopSheen,
            {
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            },
          ]}
          pointerEvents="none"
        />

        {/* 5. Diagonal Crystal Highlight Wave */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.14)',
            'rgba(255, 255, 255, 0.03)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.8 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          pointerEvents="none"
        />

        {/* 6. Razor-Thin Top Specular Edge Line */}
        <View
          style={[
            styles.specularTopLine,
            {
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.1)',
              'rgba(255, 255, 255, 0.85)',
              'rgba(255, 255, 255, 0.95)',
              'rgba(255, 255, 255, 0.85)',
              'rgba(255, 255, 255, 0.1)',
            ]}
            locations={[0, 0.2, 0.5, 0.8, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.specularTopGradient}
          />
        </View>

        {/* 7. Bottom Rim Refraction & Ambient Bounce */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(229, 255, 31, 0.03)',
            'rgba(255, 255, 255, 0.12)',
            'rgba(255, 255, 255, 0.25)',
          ]}
          locations={[0, 0.6, 0.88, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.bottomRefractionSheen,
            {
              borderBottomLeftRadius: borderRadius,
              borderBottomRightRadius: borderRadius,
            },
          ]}
          pointerEvents="none"
        />

        {/* 8. Content Container */}
        <View style={[styles.contentContainer, contentStyle]}>{children}</View>
      </View>

      {/* 9. Specular Glints (Corner Sparkles as in the reference diagram) */}
      {showGlint && (glintPosition === 'bottom-left' || glintPosition === 'both') && (
        <SpecularGlint
          size={24}
          color="#FFFFFF"
          style={{
            position: 'absolute',
            left: Math.max(6, borderRadius * 0.35),
            bottom: Math.max(4, borderRadius * 0.25),
            zIndex: 40,
          }}
        />
      )}

      {showGlint && (glintPosition === 'top-right' || glintPosition === 'both') && (
        <SpecularGlint
          size={20}
          color="#FFFFFF"
          style={{
            position: 'absolute',
            right: Math.max(8, borderRadius * 0.4),
            top: Math.max(4, borderRadius * 0.25),
            zIndex: 40,
          }}
        />
      )}

      {showGlint && glintPosition === 'top-left' && (
        <SpecularGlint
          size={22}
          color="#FFFFFF"
          style={{
            position: 'absolute',
            left: Math.max(8, borderRadius * 0.4),
            top: Math.max(4, borderRadius * 0.25),
            zIndex: 40,
          }}
        />
      )}

      {showGlint && glintPosition === 'bottom-right' && (
        <SpecularGlint
          size={22}
          color="#FFFFFF"
          style={{
            position: 'absolute',
            right: Math.max(8, borderRadius * 0.4),
            bottom: Math.max(4, borderRadius * 0.25),
            zIndex: 40,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    width: '100%',
  },
  shadowLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  glassBody: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  glossyTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    overflow: 'hidden',
  },
  specularTopGradient: {
    width: '100%',
    height: '100%',
  },
  bottomRefractionSheen: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
  },
});
