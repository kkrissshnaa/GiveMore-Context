import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

export interface RealisticGlassButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: 'lime' | 'white' | 'dark' | 'glass';
  tintColor?: string;
  size?: number | { width?: number | string; height?: number; minWidth?: number };
  borderRadius?: number;
  showGlint?: boolean;
  glintPosition?: 'bottom-left' | 'top-right' | 'top-left' | 'bottom-right';
}

/**
 * Specular Star Glint Component
 * Renders a delicate 4-pointed optical lens flare/glint on the curved glass corner/rim.
 */
function SpecularGlint({
  size = 20,
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
          <RadialGradient id="btnGlintAura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="25%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#E5FF1F" stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Central Soft Halo */}
        <Circle cx={half} cy={half} r={half * 0.9} fill="url(#btnGlintAura)" />

        {/* 4-Point Specular Diamond Star */}
        <Path
          d={`M ${half} 0 Q ${half} ${half} 0 ${half} Q ${half} ${half} ${half} ${size} Q ${half} ${half} ${size} ${half} Q ${half} ${half} ${half} 0 Z`}
          fill={color}
          opacity={0.95}
        />

        {/* Inner intense core */}
        <Circle cx={half} cy={half} r={size * 0.14} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

/**
 * 3D Realistic Glass Button Component
 *
 * Implements the full physical optical glass button shown in the reference diagram:
 * - Increased transparency (translucent refractive base)
 * - Specular highlights (sharp white top edge reflection)
 * - Blurred effect / frosted appearance
 * - Soft shadows (diffuse drop shadow + contact shadow)
 * - Inner glow & shadow (inset beveled edge)
 * - Glossy & reflective (upper convex dome gradient + corner star sparkle glint)
 * - Flexible auto-sizing for preset pills, action chips, and circular icon buttons
 */
export function RealisticGlassButton({
  children,
  onPress,
  disabled = false,
  activeOpacity = 0.75,
  style,
  contentStyle,
  variant = 'lime',
  tintColor,
  size,
  borderRadius = 20,
  showGlint = false,
  glintPosition = 'bottom-left',
}: RealisticGlassButtonProps) {
  const isWeb = Platform.OS === 'web';

  const isFixedNumber = typeof size === 'number';
  const width = isFixedNumber ? size : size?.width;
  const height = isFixedNumber ? size : size?.height;
  const minWidth = typeof size === 'object' ? size?.minWidth : undefined;
  const effectiveRadius = isFixedNumber ? size / 2 : borderRadius;
  const styleFlattened = StyleSheet.flatten(style) || {};
  const isFlex = styleFlattened.flex !== undefined;
  const isFullWidth = styleFlattened.width === '100%' || width === '100%' || isFlex;

  // Variant color definitions
  const isLime = variant === 'lime';
  const isWhite = variant === 'white';
  const isGlass = variant === 'glass';

  let baseBg = 'rgba(14, 22, 12, 0.45)';
  let borderColor = 'rgba(229, 255, 31, 0.28)';
  let innerBorderColor = 'rgba(255, 255, 255, 0.12)';

  if (tintColor) {
    baseBg = tintColor;
    borderColor = 'rgba(255, 255, 255, 0.25)';
    innerBorderColor = 'rgba(255, 255, 255, 0.15)';
  } else if (isLime) {
    baseBg = 'rgba(229, 255, 31, 0.38)';
    borderColor = 'rgba(229, 255, 31, 0.75)';
    innerBorderColor = 'rgba(255, 255, 255, 0.45)';
  } else if (isWhite) {
    baseBg = 'rgba(255, 255, 255, 0.18)';
    borderColor = 'rgba(255, 255, 255, 0.45)';
    innerBorderColor = 'rgba(255, 255, 255, 0.20)';
  } else if (isGlass) {
    baseBg = 'rgba(255, 255, 255, 0.035)';
    borderColor = 'rgba(255, 255, 255, 0.14)';
    innerBorderColor = 'rgba(255, 255, 255, 0.08)';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[
        styles.buttonContainer,
        {
          borderRadius: effectiveRadius,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0,
          shadowRadius: 4,
          elevation: 0,
          opacity: disabled ? 0.55 : 1,
          alignSelf: isFullWidth ? 'stretch' : (isFixedNumber ? 'center' : 'auto'),
          alignItems: isFixedNumber ? 'center' : (isFullWidth ? 'stretch' : 'center'),
        },
        isFixedNumber ? { width: size, height: size } : {},
        width !== undefined ? { width: width as any } : (isFullWidth ? { width: '100%' } : {}),
        height !== undefined ? { height: height as any } : {},
        minWidth !== undefined ? { minWidth } : {},
        style,
      ]}
    >
      {/* 1. Main Glass Capsule Body */}
      <View
        style={[
          styles.glassBody,
          {
            borderRadius: effectiveRadius,
            backgroundColor: baseBg,
            borderWidth: 1,
            borderColor,
            ...(isFixedNumber ? { width: size, height: size } : {}),
            ...(isFullWidth ? { width: '100%' } : (width !== undefined ? { width: width as any } : {})),
            ...(height !== undefined ? { height: height as any } : (isFlex ? { height: '100%' } : {})),
            ...(minWidth !== undefined ? { minWidth } : {}),
            ...(isFlex ? { flex: 1 } : {}),
            ...(isWeb
              ? ({
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              } as any)
              : {}),
          },
        ]}
      >
        {/* 2. Inner Glow Bevel Line (Creates 3D Refraction Thickness) */}
        <View
          style={{
            position: 'absolute',
            top: 1,
            left: 1,
            right: 1,
            bottom: 1,
            borderRadius: Math.max(0, effectiveRadius - 1),
            borderWidth: 1,
            borderColor: innerBorderColor,
          }}
          pointerEvents="none"
        />

        {/* 3. Upper Convex Glossy Reflection Sheen */}
        <LinearGradient
          colors={
            isLime
              ? [
                'rgba(255, 255, 255, 0.38)',
                'rgba(255, 255, 255, 0.15)',
                'rgba(255, 255, 255, 0.02)',
                'transparent',
              ]
              : [
                'rgba(255, 255, 255, 0.18)',
                'rgba(255, 255, 255, 0.05)',
                'rgba(255, 255, 255, 0.01)',
                'transparent',
              ]
          }
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.glossyTopSheen,
            {
              borderTopLeftRadius: effectiveRadius,
              borderTopRightRadius: effectiveRadius,
            },
          ]}
          pointerEvents="none"
        />

        {/* 4. Razor-Thin Top Edge Specular Line (Light Catch) */}
        <View
          style={[
            styles.specularTopLine,
            {
              borderTopLeftRadius: effectiveRadius,
              borderTopRightRadius: effectiveRadius,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={
              isLime
                ? [
                  'rgba(255, 255, 255, 0.2)',
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 255, 255, 1)',
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 255, 255, 0.2)',
                ]
                : [
                  'rgba(255, 255, 255, 0.1)',
                  'rgba(255, 255, 255, 0.85)',
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 255, 255, 0.85)',
                  'rgba(255, 255, 255, 0.1)',
                ]
            }
            locations={[0, 0.2, 0.5, 0.8, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.specularTopGradient}
          />
        </View>

        {/* 5. Bottom Rim Refraction Sheen */}
        <LinearGradient
          colors={
            isLime
              ? ['transparent', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.35)']
              : ['transparent', 'rgba(229, 255, 31, 0.03)', 'rgba(255, 255, 255, 0.12)']
          }
          locations={[0, 0.65, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.bottomRefractionSheen,
            {
              borderBottomLeftRadius: effectiveRadius,
              borderBottomRightRadius: effectiveRadius,
            },
          ]}
          pointerEvents="none"
        />

        {/* 6. Button Content Container */}
        <View
          style={[
            styles.contentContainer,
            isFixedNumber ? { width: size, height: size, alignItems: 'center', justifyContent: 'center' } : {},
            isFullWidth ? { width: '100%' } : {},
            height !== undefined ? { height: '100%' } : (isFlex ? { height: '100%', flex: 1 } : {}),
            contentStyle,
          ]}
        >
          {children}
        </View>
      </View>

      {/* 7. Optional Specular Corner Glint */}
      {showGlint && (glintPosition === 'bottom-left') && (
        <SpecularGlint
          size={18}
          color="#FFFFFF"
          style={{
            position: 'absolute',
            left: Math.max(3, effectiveRadius * 0.25),
            bottom: Math.max(2, effectiveRadius * 0.15),
            zIndex: 40,
          }}
        />
      )}

      {showGlint && (glintPosition === 'top-right') && (
        <SpecularGlint
          size={16}
          color="#FFFFFF"
          style={{
            position: 'absolute',
            right: Math.max(4, effectiveRadius * 0.3),
            top: Math.max(2, effectiveRadius * 0.15),
            zIndex: 40,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  glassBody: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 1.2,
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
    height: '38%',
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
