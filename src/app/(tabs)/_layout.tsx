import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

function SoftRadialGlow({ size, id, opacity = 0.35 }: { size: number; id: string; opacity?: number }) {
  return (
    <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient
            id={id}
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor="#E5FF1F" stopOpacity={opacity} />
            <Stop offset="40%" stopColor="#E5FF1F" stopOpacity={opacity * 0.45} />
            <Stop offset="75%" stopColor="#E5FF1F" stopOpacity={opacity * 0.12} />
            <Stop offset="100%" stopColor="#E5FF1F" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Lift floating pill comfortably above bottom gesture/navigation bars on Android & iOS
  const safeBottom = Platform.OS === 'android'
    ? Math.max(insets.bottom, 24) + 16
    : Math.max(insets.bottom, 16) + 12;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#E5FF1F',
        tabBarInactiveTintColor: '#8a8385',
        tabBarStyle: {
          position: 'absolute',
          bottom: safeBottom + 3,
          left: 0,
          right: 0,
          marginHorizontal: 25,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(8, 14, 9, 0.94)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.16)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 12,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: 12,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
        },
        tabBarItemStyle: {
          height: 64,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
          margin: 0,
          overflow: 'visible',
        },
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <SoftRadialGlow size={68} id="explore-tab-glow" opacity={0.35} />}
              <View style={styles.iconWrapper}>
                <Feather name="compass" size={28} color={color} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="generation"
        options={{
          title: 'Generate',
          href: '/',
          tabBarIcon: () => (
            <View style={styles.iconContainer}>
              <SoftRadialGlow size={108} id="generate-hero-glow" opacity={0.45} />
              <View style={styles.pseudo3dCircle}>
                <Feather name="zap" size={30} color="#060e03" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <SoftRadialGlow size={68} id="settings-tab-glow" opacity={0.35} />}
              <View style={styles.iconWrapper}>
                <Feather name="settings" size={28} color={color} />
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pseudo3dCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E5FF1F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
