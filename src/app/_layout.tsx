import 'react-native-url-polyfill/auto';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { router } from "expo-router";
import { Drawer, DrawerContentScrollView } from "expo-router/drawer";
import React, { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClerkProvider, useUser, useAuth } from '@clerk/expo';
import { tokenCache } from '../lib/tokenCache';
import "../../global.css";
import { getChats, ChatItem } from '../lib/chatService';
import { chatEvents } from '../lib/chatEvents';
import { AestheticBackdrop } from '../components/AestheticBackdrop';

const clerkPublishableKey = (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '').trim();

const isKeyValid = Boolean(
  clerkPublishableKey &&
  (clerkPublishableKey.startsWith('pk_test_') || clerkPublishableKey.startsWith('pk_live_')) &&
  !clerkPublishableKey.includes('replace_with')
);

interface ErrorBoundaryProps {
  children: ReactNode;
  devDomain: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ClerkErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isCookieError =
        this.state.error?.message?.includes('Unable to authenticate this browser') ||
        this.state.error?.message?.includes('cookies');

      return (
        <View className="flex-1 bg-[#070801] justify-center items-center p-6">
          <View className="bg-red-500/15 border border-red-500/40 rounded-2xl p-5 w-full max-w-md">
            <Text className="text-red-400 text-lg font-bold mb-2 font-display">
              Clerk Dev Authentication Required
            </Text>
            <Text className="text-gray-300 text-xs leading-5 mb-4 font-sans">
              {isCookieError
                ? 'Your web browser requires a one-time dev authentication session from your Clerk development instance to allow localhost requests.'
                : (this.state.error?.message || 'Failed to initialize Clerk.')}
            </Text>

            <TouchableOpacity
              onPress={() => Linking.openURL(`https://${this.props.devDomain}`)}
              className="bg-[#E5FF1F] py-3 px-4 rounded-xl items-center mb-3 active:opacity-90"
            >
              <Text className="text-[#070801] font-bold text-xs font-display">
                1. Authenticate Browser ({this.props.devDomain})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => this.setState({ hasError: false, error: null })}
              className="bg-white/10 py-2.5 px-4 rounded-xl items-center active:bg-white/20"
            >
              <Text className="text-white font-semibold text-xs font-sans">
                2. Retry Application
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

function NavItem({ icon, label, badge, onPress }: { icon: any, label: string, badge?: string, onPress?: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] active:bg-white/[0.08] mb-1.5 border border-white/[0.05]"
    >
      <View className="flex-row items-center gap-3">
        <Feather name={icon} size={17} color="#E5FF1F" />
        <Text className="text-white text-xs font-semibold font-sans">{label}</Text>
      </View>
      {badge && (
        <View className="bg-[#E5FF1F]/20 border border-[#E5FF1F]/40 px-2 py-0.5 rounded-full">
          <Text className="text-[#E5FF1F] text-[10px] font-bold font-mono">{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function UserAccountSection({
  onNavigateSignIn,
  onNavigateSignUp,
}: {
  onNavigateSignIn: () => void;
  onNavigateSignUp: () => void;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();

  const userDisplayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User';
  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  const userInitials = (user?.firstName ? user.firstName[0] : '') + (user?.lastName ? user.lastName[0] : userEmail[0] || 'U');

  if (isLoaded && isSignedIn) {
    return (
      <View className="flex-row items-center justify-between px-3 py-3 rounded-[16px] bg-white/5 border border-white/10">
        <View className="flex-row items-center gap-3 flex-1 overflow-hidden mr-2">
          <View className="w-[34px] h-[34px] rounded-full bg-[#182813] items-center justify-center border border-[#E5FF1F]/40">
            <Text className="text-[12.5px] font-bold text-[#E5FF1F] font-display uppercase">
              {userInitials.toUpperCase()}
            </Text>
          </View>
          <View className="flex-1 overflow-hidden">
            <Text className="text-[12.5px] font-bold text-white font-display" numberOfLines={1}>
              {userDisplayName}
            </Text>
            <Text className="text-[10.5px] font-bold text-[#E5FF1F] mt-0.5 font-sans" numberOfLines={1}>
              Authenticated
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => signOut()}
          className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 active:bg-red-500/20"
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={15} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={onNavigateSignIn}
        className="flex-1 flex-row items-center justify-center gap-2 py-3 px-3 rounded-[14px] bg-white/5 border border-white/10 active:bg-white/10"
        activeOpacity={0.8}
      >
        <Feather name="log-in" size={15} color="#E5FF1F" />
        <Text className="text-white text-xs font-bold font-display">Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNavigateSignUp}
        className="flex-1 flex-row items-center justify-center gap-2 py-3 px-3 rounded-[14px] bg-[#E5FF1F] active:opacity-90 shadow-lg shadow-[#E5FF1F]/20"
        activeOpacity={0.8}
      >
        <Feather name="user-plus" size={15} color="#070801" />
        <Text className="text-[#070801] text-xs font-bold font-display">Sign Up</Text>
      </TouchableOpacity>
    </View>
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
    const load = async () => {
      await fetchInitialChats();
    };
    void load();
    const unsub = chatEvents.subscribe((event) => {
      if (event.type === 'CHAT_SAVED' || event.type === 'NEW_CHAT') {
        void fetchInitialChats();
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

  const handleNavigateAuth = (path: '/(auth)/signin' | '/(auth)/signup') => {
    props.navigation.closeDrawer();
    router.push(path);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToBottom) {
      fetchMoreChats();
    }
  };

  return (
    <AestheticBackdrop
      gradientColors={['#050906', '#0b140c', '#040705']}
      fullWindowAlign={true}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        {/* Logo */}
        <View className="px-2 pb-8">
          <Text className="text-[22px] font-bold leading-tight text-white font-display">give more</Text>
          <Text className="text-[22px] font-bold leading-tight text-[#E5FF1F] font-display">—context</Text>
        </View>

        {/* New Generation Button */}
        <TouchableOpacity
          onPress={handleNewChat}
          className="flex-row items-center gap-3 px-3 py-3 mb-5 rounded-[16px] bg-[#E5FF1F]/15 border border-[#E5FF1F]/40"
        >
          <View className="w-[30px] h-[30px] rounded-full bg-[#E5FF1F] items-center justify-center shadow-lg shadow-[#E5FF1F]/40">
            <Feather name="plus" size={14} color="#0b1405" />
          </View>
          <Text className="text-[13.5px] font-bold text-white font-display">New generation</Text>
        </TouchableOpacity>

        {/* Nav Items - Explore and Settings only */}
        <View className="flex-col gap-1">
          <NavItem icon="compass" label="Explore" onPress={() => { props.navigation.closeDrawer(); router.push('/(tabs)/explore'); }} />
          <NavItem icon="settings" label="Settings" onPress={() => { props.navigation.closeDrawer(); router.push('/(tabs)/settings'); }} />
        </View>

        {/* History Header & List */}
        {history.length > 0 && (
          <>
            <View className="h-[1px] bg-white/10 my-4 mx-2" />
            <Text className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a8385] font-display">
              Recent Generations ({history.length})
            </Text>
            {history.map((chat) => (
              <TouchableOpacity 
                key={chat.id} 
                onPress={() => handleSelectChat(chat)}
                className="flex-row items-center gap-2.5 px-3 py-2.5 mb-1 rounded-[14px] bg-white/5 border border-white/5 active:bg-white/10"
              >
                <Feather name="message-square" size={15} color="#E5FF1F" />
                <View className="flex-1 overflow-hidden">
                  <Text className="text-[13px] font-medium text-white font-sans" numberOfLines={1}>
                    {chat.title}
                  </Text>
                  <Text className="text-[10px] font-semibold text-[#8a8385] mt-0.5 uppercase tracking-wider font-mono">
                    {chat.model} · {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {loadingMore && (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color="#E5FF1F" />
              </View>
            )}
          </>
        )}

      </DrawerContentScrollView>

      {/* Account Bottom Section */}
      <View className="p-4 border-t border-white/5 mb-4">
        <UserAccountSection
          onNavigateSignIn={() => handleNavigateAuth('/(auth)/signin')}
          onNavigateSignUp={() => handleNavigateAuth('/(auth)/signup')}
        />
      </View>
    </AestheticBackdrop>
  );
}

function MainDrawerApp() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!isKeyValid && (
        <View className="bg-amber-500/20 border-b border-amber-500/40 p-2.5 items-center justify-center">
          <Text className="text-amber-200 text-xs font-medium text-center font-sans">
            ⚠️ <Text className="font-bold">Clerk Key Required:</Text> Replace placeholder in <Text className="font-mono text-[#E5FF1F]">.env</Text> with your Publishable Key from dashboard.clerk.com
          </Text>
        </View>
      )}
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: '#070801',
            width: '76%',
            maxWidth: 300,
          },
          sceneStyle: {
            backgroundColor: '#070801',
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

export default function RootLayout() {
  if (!isKeyValid) {
    return <MainDrawerApp />;
  }

  return (
    <ClerkErrorBoundary devDomain="humble-crayfish-65.clerk.accounts.dev">
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <MainDrawerApp />
      </ClerkProvider>
    </ClerkErrorBoundary>
  );
}