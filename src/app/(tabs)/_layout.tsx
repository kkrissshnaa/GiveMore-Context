import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { RealisticGlassBox } from '../../components/RealisticGlassBox';
import { RealisticGlassButton } from '../../components/RealisticGlassButton';

interface CustomTabBarProps {
  state: {
    index: number;
    routes: { name: string; key: string }[];
  };
  navigation: {
    navigate: (name: string) => void;
  };
}

function SoftRadialGlow({ size = 110, opacity = 0.22, id = 'centerHeroGlow' }: { size?: number; opacity?: number; id?: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#E5FF1F" stopOpacity={opacity} />
            <Stop offset="30%" stopColor="#E5FF1F" stopOpacity={opacity * 0.5} />
            <Stop offset="65%" stopColor="#E5FF1F" stopOpacity={opacity * 0.15} />
            <Stop offset="85%" stopColor="#E5FF1F" stopOpacity={opacity * 0.03} />
            <Stop offset="100%" stopColor="#E5FF1F" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function CustomGlassTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'android'
    ? Math.max(insets.bottom, 20) + 12
    : Math.max(insets.bottom, 14) + 8;

  const currentRouteName = state.routes[state.index]?.name;
  const barWidth = 320;
  const barHeight = 62;
  const heroSize = 58;
  const heroRadius = heroSize / 2;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: safeBottom,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <View style={{ position: 'relative', width: barWidth, height: barHeight, alignItems: 'center', justifyContent: 'center' }}>
        {/* Floating Glass Dock Base Bar */}
        <RealisticGlassBox
          borderRadius={31}
          tintColor="rgba(9, 15, 8, 0.88)"
          showGlint={false}
          style={{
            width: barWidth,
            height: barHeight,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.6,
            shadowRadius: 24,
            elevation: 16,
          }}
          contentStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            height: barHeight,
            width: '100%',
          }}
        >
          {/* Explore Tab (Left Column) */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <RealisticGlassButton
              onPress={() => navigation.navigate('explore')}
              variant={currentRouteName === 'explore' ? 'lime' : 'glass'}
              size={44}
              borderRadius={22}
              showGlint={false}
            >
              <Feather
                name="compass"
                size={21}
                color={currentRouteName === 'explore' ? '#0b1405' : '#ffffff'}
              />
            </RealisticGlassButton>
          </View>

          {/* Reserved Center Column for Overgrown Hero Button */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} />

          {/* Profile Tab (Right Column) */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <RealisticGlassButton
              onPress={() => navigation.navigate('profile')}
              variant={currentRouteName === 'profile' ? 'lime' : 'glass'}
              size={44}
              borderRadius={22}
              showGlint={false}
            >
              <Feather
                name="user"
                size={21}
                color={currentRouteName === 'profile' ? '#0b1405' : '#ffffff'}
              />
            </RealisticGlassButton>
          </View>
        </RealisticGlassBox>

        {/* Center Overgrown Hero Generation Button (Mathematically centered & elevated) */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: -12,
            left: (barWidth - heroSize) / 2,
            width: heroSize,
            height: heroSize,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          {/* Multi-Stop Soft Radial Feathered Glow */}
          <SoftRadialGlow size={110} opacity={0.24} id="centerHeroSoftGlow" />

          <RealisticGlassButton
            onPress={() => router.navigate('/')}
            variant="lime"
            size={heroSize}
            borderRadius={heroRadius}
            showGlint={false}
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Feather name="zap" size={24} color="#0b1405" />
          </RealisticGlassButton>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="generation"
        options={{
          title: 'Generate',
          href: '/',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

