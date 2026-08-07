import React from 'react';
import { View, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface AestheticBackdropProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  gradientColors?: [string, string, ...string[]];
  showOrbs?: boolean;
  showGrain?: boolean;
  fullWindowAlign?: boolean;
}

// SVG with soft-edged green circles fading to 0 opacity at r=96% (zero hard lines)
const SOFT_CIRCLES_GREEN_BACKGROUND_SVG = `data:image/svg+xml;utf8,<svg width='1000' height='1000' viewBox='0 0 1000 1000' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='bgBase' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23050906'/><stop offset='45%' stop-color='%230b140c'/><stop offset='100%' stop-color='%23040705'/></linearGradient><radialGradient id='greenCircleGlow' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='%237ce370' stop-opacity='0.78'/><stop offset='18%' stop-color='%2362c459' stop-opacity='0.62'/><stop offset='38%' stop-color='%234ea844' stop-opacity='0.44'/><stop offset='58%' stop-color='%23388b30' stop-opacity='0.26'/><stop offset='76%' stop-color='%2324651f' stop-opacity='0.12'/><stop offset='88%' stop-color='%2312400e' stop-opacity='0.03'/><stop offset='96%' stop-color='%23071a06' stop-opacity='0.005'/><stop offset='100%' stop-color='%23000000' stop-opacity='0'/></radialGradient><radialGradient id='auraCircleGlow' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='%2395eb87' stop-opacity='0.55'/><stop offset='25%' stop-color='%2362c459' stop-opacity='0.36'/><stop offset='55%' stop-color='%232b6e26' stop-opacity='0.16'/><stop offset='85%' stop-color='%230d280a' stop-opacity='0.02'/><stop offset='100%' stop-color='%23000000' stop-opacity='0'/></radialGradient></defs><rect width='1000' height='1000' fill='url(%23bgBase)'/><circle cx='500' cy='320' r='380' fill='url(%23greenCircleGlow)'/><circle cx='120' cy='80' r='280' fill='url(%23auraCircleGlow)'/></svg>`;

export function AestheticBackdrop({
  children,
  style,
  gradientColors = ['#050906', '#0b140c', '#040705'],
  showOrbs = true,
  showGrain = true,
  fullWindowAlign = true,
}: AestheticBackdropProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const backdropWidth = fullWindowAlign && windowWidth > 0 ? windowWidth : '100%';
  const backdropHeight = fullWindowAlign && windowHeight > 0 ? windowHeight : '100%';

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Background SVG with Soft Green Circles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={{ uri: SOFT_CIRCLES_GREEN_BACKGROUND_SVG }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: backdropWidth as any,
            height: backdropHeight as any,
            opacity: 0.98,
          }}
          contentFit="cover"
        />
      </View>

      {/* Atmospheric Soft Blur Halo Ambient Layer */}
      {showOrbs && (
        <View
          style={{
            position: 'absolute',
            top: '-15%',
            left: '8%',
            width: typeof backdropWidth === 'number' ? backdropWidth * 1.3 : 550,
            height: typeof backdropWidth === 'number' ? backdropWidth * 1.3 : 550,
            borderRadius: typeof backdropWidth === 'number' ? (backdropWidth * 1.3) / 2 : 275,
            backgroundColor: 'rgba(98, 196, 89, 0.10)',
            opacity: 0.8,
          }}
          pointerEvents="none"
        />
      )}

      {/* Film Grain Texture Masked & Concentrated Over the Circle Glow */}
      {showGrain && (
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: backdropWidth as any,
            height: backdropHeight as any,
            overflow: 'hidden',
          }} 
          pointerEvents="none"
        >
          <Image
            source={require('../../assets/images/grain_noise.png')}
            style={{
              position: 'absolute',
              top: '5%',
              left: '10%',
              width: typeof backdropWidth === 'number' ? backdropWidth * 0.8 : '80%',
              height: typeof backdropWidth === 'number' ? backdropWidth * 0.8 : '80%',
              borderRadius: typeof backdropWidth === 'number' ? (backdropWidth * 0.8) / 2 : 200,
              opacity: 0.38,
            }}
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
    backgroundColor: '#050906',
  },
});
