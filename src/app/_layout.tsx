import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { router } from "expo-router";
import { Drawer, DrawerContentScrollView } from "expo-router/drawer";
import { useState, useEffect, useCallback } from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import { getChats, ChatItem } from '../lib/chatService';
import { chatEvents } from '../lib/chatEvents';

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
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchInitialChats = useCallback(async () => {
    const initial = await getChats(10, 0);
    setHistory(initial);
    setPage(0);
    setHasMore(initial.length === 10);
  }, []);

  const fetchMoreChats = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const more = await getChats(10, nextPage * 10);
    if (more.length > 0) {
      setHistory(prev => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(more.length === 10);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchInitialChats();
    const unsub = chatEvents.subscribe((event) => {
      if (event.type === 'CHAT_SAVED' || event.type === 'NEW_CHAT') {
        fetchInitialChats();
      }
    });
    return () => unsub();
  }, [fetchInitialChats]);

  const handleNewChat = () => {
    chatEvents.emitNewChat();
    props.navigation.navigate('index');
    props.navigation.closeDrawer();
  };

  const handleSelectChat = (chatItem: ChatItem) => {
    chatEvents.emitLoadChat(chatItem);
    props.navigation.navigate('index');
    props.navigation.closeDrawer();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToBottom) {
      fetchMoreChats();
    }
  };

  return (
    <View className="flex-1 bg-[#181314]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
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

        {/* History Header & List */}
        {history.length > 0 && (
          <>
            <View className="h-[1px] bg-white/10 my-4 mx-2" />
            <Text className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a8385]">
              Recent Generations ({history.length})
            </Text>
            {history.map((chat) => (
              <TouchableOpacity 
                key={chat.id} 
                onPress={() => handleSelectChat(chat)}
                className="flex-row items-center gap-2.5 px-3 py-2.5 mb-1 rounded-[14px] bg-white/5 border border-white/5 active:bg-white/10"
              >
                <Feather name="message-square" size={15} color="#ff6d29" />
                <View className="flex-1 overflow-hidden">
                  <Text className="text-[13px] font-medium text-white" numberOfLines={1}>
                    {chat.title}
                  </Text>
                  <Text className="text-[10px] font-semibold text-[#8a8385] mt-0.5 uppercase tracking-wider">
                    {chat.model} · {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {loadingMore && (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color="#ff6d29" />
              </View>
            )}
          </>
        )}

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}