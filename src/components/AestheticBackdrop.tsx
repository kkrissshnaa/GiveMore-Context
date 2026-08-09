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

// 100% Seamless Multi-Stop Radial Green Vignette SVG (Fades to 0 opacity inside <rect> - ZERO sharp lines or circle cutoffs on Android/iOS/Web)
const SEAMLESS_RADIAL_GREEN_BACKGROUND_SVG = `data:image/svg+xml;utf8,<svg width='1000' height='1000' viewBox='0 0 1000 1000' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='bgBase' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23050906'/><stop offset='45%' stop-color='%230b140c'/><stop offset='100%' stop-color='%23040705'/></linearGradient><radialGradient id='smoothCenterRadial' cx='50%' cy='32%' r='70%'><stop offset='0%' stop-color='%2374d468' stop-opacity='0.68'/><stop offset='12%' stop-color='%2362c459' stop-opacity='0.58'/><stop offset='25%' stop-color='%2350b248' stop-opacity='0.45'/><stop offset='38%' stop-color='%233e9b37' stop-opacity='0.32'/><stop offset='50%' stop-color='%232e8228' stop-opacity='0.22'/><stop offset='62%' stop-color='%2320681b' stop-opacity='0.14'/><stop offset='75%' stop-color='%23144e11' stop-opacity='0.08'/><stop offset='88%' stop-color='%230b3208' stop-opacity='0.03'/><stop offset='96%' stop-color='%23061905' stop-opacity='0.01'/><stop offset='100%' stop-color='%23040705' stop-opacity='0'/></radialGradient><radialGradient id='softTopLeftAura' cx='10%' cy='8%' r='65%'><stop offset='0%' stop-color='%238be57d' stop-opacity='0.48'/><stop offset='18%' stop-color='%2372d367' stop-opacity='0.36'/><stop offset='35%' stop-color='%2357b94d' stop-opacity='0.24'/><stop offset='52%' stop-color='%233e9835' stop-opacity='0.14'/><stop offset='70%' stop-color='%23267220' stop-opacity='0.06'/><stop offset='88%' stop-color='%2312450e' stop-opacity='0.02'/><stop offset='100%' stop-color='%23040705' stop-opacity='0'/></radialGradient></defs><rect width='1000' height='1000' fill='url(%23bgBase)'/><rect width='1000' height='1000' fill='url(%23smoothCenterRadial)'/><rect width='1000' height='1000' fill='url(%23softTopLeftAura)'/></svg>`;

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
      {/* Seamless Multi-Stop Radial Green SVG (Zero sharp circle edges on any device) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={{ uri: SEAMLESS_RADIAL_GREEN_BACKGROUND_SVG }}
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

      {/* Secondary Soft Translucent Ambient Halo Layer */}
      {showOrbs && (
        <View
          style={{
            position: 'absolute',
            top: '-20%',
            left: '5%',
            width: typeof backdropWidth === 'number' ? backdropWidth * 1.4 : 600,
            height: typeof backdropWidth === 'number' ? backdropWidth * 1.4 : 600,
            borderRadius: typeof backdropWidth === 'number' ? (backdropWidth * 1.4) / 2 : 300,
            backgroundColor: 'rgba(98, 196, 89, 0.12)',
            opacity: 0.85,
          }}
          pointerEvents="none"
        />
      )}

      {/* 100% Native-Compatible PNG Film Grain Noise Texture (Visually prominent on Android, iOS & Web) */}
      {showGrain && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={require('../../assets/images/grain_noise.png')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: backdropWidth as any,
              height: backdropHeight as any,
              opacity: 0.32,
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
