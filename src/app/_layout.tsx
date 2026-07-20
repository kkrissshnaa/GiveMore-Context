import { Feather } from '@expo/vector-icons';
import { router } from "expo-router";
import { Drawer, DrawerContentScrollView } from "expo-router/drawer";
import { useState } from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";

function NavItem({ icon, label, badge, onPress }: { icon: any, label: string, badge?: string, onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center gap-3 px-3 py-3 rounded-[14px]">
      <Feather name={icon} size={17} color="#bababa" />
      <Text className="text-[13.5px] font-medium text-[#bababa]">{label}</Text>
      {badge && (
        <View className="ml-auto px-2 py-0.5 rounded-full bg-[#ff6d29]/20">
          <Text className="text-[9.5px] font-bold tracking-wider text-[#ffa15c]">{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<string[]>([]);

  const handleNewChat = () => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory([`Generation at ${timeString}`, ...history]);
    props.navigation.navigate('index');
  };

  return (
    <View className="flex-1 bg-[#181314]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Logo */}
        <View className="px-2 pb-8">
          <Text className="text-[22px] font-bold leading-tight text-white">give more</Text>
          <Text className="text-[22px] font-bold leading-tight text-[#ff6d29]">—context</Text>
        </View>

        {/* New Generation Button */}
        <TouchableOpacity
          onPress={handleNewChat}
          className="flex-row items-center gap-3 px-3 py-3 mb-5 rounded-[16px] bg-[#ff6d29]/15 border border-[#ffa15c]/40"
        >
          <View className="w-[30px] h-[30px] rounded-full bg-[#ff6d29] items-center justify-center shadow-lg shadow-[#ff6d29]/50">
            <Feather name="plus" size={14} color="#1a1210" />
          </View>
          <Text className="text-[13.5px] font-bold text-white">New generation</Text>
        </TouchableOpacity>

        {/* Nav Items */}
        <View className="flex-col gap-1">
          <NavItem icon="compass" label="Explore" onPress={() => router.push('/(tabs)/explore')} />
          <NavItem icon="folder" label="Folder" onPress={() => router.push('/(tabs)/folder')} />
          <NavItem icon="star" label="Subscription" badge="PRO" onPress={() => router.push('/(tabs)/subscription')} />
          <NavItem icon="settings" label="Settings" onPress={() => router.push('/(tabs)/settings')} />
        </View>

        {/* Divider if history exists */}
        {history.length > 0 && <View className="h-[1px] bg-white/10 my-4 mx-2" />}

        {/* History */}
        {history.map((h, i) => (
          <TouchableOpacity key={i} className="flex-row items-center gap-3 px-3 py-3 rounded-[14px]">
            <Feather name="message-square" size={16} color="#8a8385" />
            <Text className="text-[13.5px] font-medium text-[#bababa]">{h}</Text>
          </TouchableOpacity>
        ))}

      </DrawerContentScrollView>

      {/* Account Bottom */}
      <View className="p-4 border-t border-white/5 mb-4">
        <View className="flex-row items-center gap-3 px-3 py-3 rounded-[16px] bg-white/5 border border-white/10">
          <View className="w-[34px] h-[34px] rounded-full bg-[#453027] items-center justify-center">
            <Text className="text-[12.5px] font-bold text-[#e8e2dd]">KV</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[12.5px] font-bold text-white">Krishna</Text>
            <Text className="text-[10.5px] font-bold text-[#ffa15c] mt-0.5">Pro plan</Text>
          </View>
          <Feather name="chevron-right" size={15} color="#8a8385" />
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#181314',
          width: '76%',
          maxWidth: 300,
        },
        sceneStyle: {
          backgroundColor: '#0e0b0e',
        }
      }}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="(auth)/signin" />
      <Drawer.Screen name="(auth)/signup" />
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}