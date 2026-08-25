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
  size?: number | { width?: number | string; height?: number; minWidth?: number };
  borderRadius?: number;
  showGlint?: boolean;
  glintPosition?: 'bottom-left' | 'top-right' | 'top-left' | 'bottom-right';
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
  const isFullWidth = styleFlattened.width === '100%' || width === '100%';

  // Variant color definitions
  const isLime = variant === 'lime';
  const isWhite = variant === 'white';
  const isGlass = variant === 'glass';

  let baseBg = 'rgba(16, 24, 12, 0.75)';
  let borderColor = 'rgba(229, 255, 31, 0.35)';
  let innerBorderColor = 'rgba(255, 255, 255, 0.12)';

  if (isLime) {
    baseBg = 'rgba(229, 255, 31, 0.94)';
    borderColor = 'rgba(255, 255, 255, 0.75)';
    innerBorderColor = 'rgba(255, 255, 255, 0.45)';
  } else if (isWhite) {
    baseBg = 'rgba(255, 255, 255, 0.20)';
    borderColor = 'rgba(255, 255, 255, 0.45)';
    innerBorderColor = 'rgba(255, 255, 255, 0.2)';
  } else if (isGlass) {
    baseBg = 'rgba(255, 255, 255, 0.08)';
    borderColor = 'rgba(255, 255, 255, 0.25)';
    innerBorderColor = 'rgba(255, 255, 255, 0.15)';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[
        styles.buttonContainer,
        {
          width: width as any,
          height: height as any,
          minWidth,
          borderRadius: effectiveRadius,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0,
          shadowRadius: 5,
          elevation: Platform.OS === 'android' ? (isLime ? 2 : 0) : 2,
          opacity: disabled ? 0.55 : 1,
          alignItems: isFixedNumber ? 'center' : (isFullWidth ? 'stretch' : 'center'),
        },
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
            borderColor,
            borderWidth: 1,
            ...(isFixedNumber ? { width: size, height: size } : {}),
            ...(isFullWidth ? { width: '100%' } : {}),
            ...(height !== undefined ? { height } : {}),
            ...(minWidth !== undefined ? { minWidth } : {}),
            ...(isWeb
              ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any)
              : {}),
          },
        ]}
      >
        {/* 2. Inner Bevel Highlight (Simulates Glass Thickness without clipping glitch) */}
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
                  'rgba(255, 255, 255, 0.65)',
                  'rgba(255, 255, 255, 0.22)',
                  'rgba(255, 255, 255, 0.04)',
                  'transparent',
                ]
              : [
                  'rgba(255, 255, 255, 0.32)',
                  'rgba(255, 255, 255, 0.12)',
                  'rgba(255, 255, 255, 0.02)',
                  'transparent',
                ]
          }
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.topGloss,
            {
              borderTopLeftRadius: effectiveRadius,
              borderTopRightRadius: effectiveRadius,
            },
          ]}
          pointerEvents="none"
        />

        {/* 4. Razor-Thin Top Specular Light Catch */}
        <View
          style={[
            styles.topSpecularLine,
            {
              borderTopLeftRadius: effectiveRadius,
              borderTopRightRadius: effectiveRadius,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.15)',
              'rgba(255, 255, 255, 0.90)',
              'rgba(255, 255, 255, 1)',
              'rgba(255, 255, 255, 0.90)',
              'rgba(255, 255, 255, 0.15)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* 5. Bottom Rim Refraction */}
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.16)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.bottomRefraction,
            {
              borderBottomLeftRadius: effectiveRadius,
              borderBottomRightRadius: effectiveRadius,
            },
          ]}
          pointerEvents="none"
        />

        <View
          style={[
            styles.content,
            isFixedNumber ? { width: size, height: size } : {},
            isFullWidth ? { width: '100%' } : {},
            contentStyle,
          ]}
        >
          {children}
        </View>
      </View>

      {/* 6. Corner Specular Star Glint */}
      {showGlint && (
        <View
          style={[
            styles.glintContainer,
            glintPosition === 'bottom-left' && {
              left: Math.max(1, effectiveRadius * 0.12),
              bottom: Math.max(1, effectiveRadius * 0.12),
            },
            glintPosition === 'top-right' && {
              right: Math.max(1, effectiveRadius * 0.12),
              top: Math.max(1, effectiveRadius * 0.12),
            },
            glintPosition === 'top-left' && {
              left: Math.max(1, effectiveRadius * 0.12),
              top: Math.max(1, effectiveRadius * 0.12),
            },
            glintPosition === 'bottom-right' && {
              right: Math.max(1, effectiveRadius * 0.12),
              bottom: Math.max(1, effectiveRadius * 0.12),
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={13} height={13} viewBox="0 0 14 14">
            <Defs>
              <RadialGradient id="btnGlintAura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={7} cy={7} r={6} fill="url(#btnGlintAura)" />
            <Path
              d="M 7 0 Q 7 7 0 7 Q 7 7 7 14 Q 7 7 14 7 Q 7 7 7 0 Z"
              fill="#FFFFFF"
            />
          </Svg>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBody: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  topSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.2,
  },
  bottomRefraction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '32%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  glintContainer: {
    position: 'absolute',
    zIndex: 30,
  },
});
