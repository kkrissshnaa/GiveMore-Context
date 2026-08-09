import React from 'react';
import { View, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { NeatGreenGradient } from './NeatGreenGradient';

interface AestheticBackdropProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  gradientColors?: [string, string, ...string[]];
  showOrbs?: boolean;
  showGrain?: boolean;
  fullWindowAlign?: boolean;
}

export function AestheticBackdrop({
  children,
  style,
  showGrain = true,
  fullWindowAlign = true,
}: AestheticBackdropProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const backdropWidth = fullWindowAlign && windowWidth > 0 ? windowWidth : '100%';
  const backdropHeight = fullWindowAlign && windowHeight > 0 ? windowHeight : '100%';

  return (
    <View style={[styles.container, style]}>
      {/* Neat 3D Mesh Gradient (Lemon Preset Adapted to Green Theme) */}
      <NeatGreenGradient animated={true} speed={1.0} />

      {/* 100% Native-Compatible PNG Film Grain Noise Texture (Grain: 0.2) */}
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
              opacity: 0.20,
            }}
            contentFit="cover"
          />
        </View>
      )}

      {children}
    </View>
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
