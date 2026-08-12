import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
        tabBarActiveTintColor: '#b2ff59',
        tabBarInactiveTintColor: '#8a8385',
        tabBarStyle: {
          position: 'absolute',
          bottom: safeBottom,
          left: 20,
          right: 20,
          height: 60,
          borderRadius: 30,
          backgroundColor: 'rgba(8, 14, 9, 0.92)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.16)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 12,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: 12,
        },
        tabBarItemStyle: {
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
          margin: 0,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Feather name="compass" size={22} color={color} />
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
            <View style={styles.pseudo3dCircle}>
              <Feather name="zap" size={25} color="#060e03" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Feather name="settings" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.35)',
  },
  pseudo3dCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#b2ff59',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    borderWidth: 2,
    borderColor: '#d2ff8c',
    borderTopColor: '#ffffff',
    borderBottomColor: '#75be1d',
    borderLeftColor: '#c4ff75',
    borderRightColor: '#93e82b',
    shadowColor: '#b2ff59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },
});
