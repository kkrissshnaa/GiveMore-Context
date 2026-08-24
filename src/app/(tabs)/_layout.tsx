import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

function CustomGlassTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'android'
    ? Math.max(insets.bottom, 20) + 12
    : Math.max(insets.bottom, 14) + 8;

  const currentRouteName = state.routes[state.index]?.name;

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
      <RealisticGlassBox
        borderRadius={34}
        tintColor="rgba(9, 15, 8, 0.82)"
        showGlint={false}
        style={{
          width: 270,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.6,
          shadowRadius: 24,
          elevation: 16,
        }}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 8,
          height: 64,
        }}
      >
        {/* Explore Tab */}
        <RealisticGlassButton
          onPress={() => navigation.navigate('explore')}
          variant={currentRouteName === 'explore' ? 'lime' : 'glass'}
          size={46}
          borderRadius={23}
          showGlint={false}
        >
          <Feather
            name="compass"
            size={22}
            color={currentRouteName === 'explore' ? '#0b1405' : '#ffffff'}
          />
        </RealisticGlassButton>

        {/* Generate Hero Button (Center) */}
        <RealisticGlassButton
          onPress={() => router.navigate('/')}
          variant="lime"
          size={50}
          borderRadius={25}
          showGlint={false}
        >
          <Feather name="zap" size={24} color="#0b1405" />
        </RealisticGlassButton>

        {/* Profile Tab */}
        <RealisticGlassButton
          onPress={() => navigation.navigate('profile')}
          variant={currentRouteName === 'profile' ? 'lime' : 'glass'}
          size={46}
          borderRadius={23}
          showGlint={false}
        >
          <Feather
            name="user"
            size={22}
            color={currentRouteName === 'profile' ? '#0b1405' : '#ffffff'}
          />
        </RealisticGlassButton>
      </RealisticGlassBox>
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

