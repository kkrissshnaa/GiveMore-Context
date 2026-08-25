import { useSession, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../components/AestheticBackdrop';
import { RealisticGlassBox } from '../components/RealisticGlassBox';
import { RealisticGlassButton } from '../components/RealisticGlassButton';
import { CanvasRegion, ReferenceCanvasModal } from '../components/ReferenceCanvasModal';
import { ShareModal } from '../components/ShareModal';
import { resolveApiUrl } from '../lib/apiUtils';
import { chatEvents } from '../lib/chatEvents';
import { ChatItem, saveChat } from '../lib/chatService';
import { publishItemToExplore } from '../lib/exploreService';
import { downloadAndSaveImage } from '../lib/imageActions';

const HELVETICA_FONT = Platform.select({
  ios: 'Helvetica',
  android: 'sans-serif',
  default: 'Helvetica, Arial, sans-serif',
});

const HELVETICA_BOLD = Platform.select({
  ios: 'Helvetica-Bold',
  android: 'sans-serif-medium',
  default: 'Helvetica, Arial, sans-serif',
});

function ImageSkeleton({ aspectRatio }: { aspectRatio: string }) {
  const [pulseAnim] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const getAspectRatioStyle = (ratio: string) => {
    switch (ratio) {
      case '16:9': return { aspectRatio: 16 / 9 };
      case '4:5': return { aspectRatio: 4 / 5 };
      case '9:16': return { aspectRatio: 9 / 16 };
      case '1:1':
      default:
        return { aspectRatio: 1 };
    }
  };

  return (
    <View
      className="w-full mt-1 rounded-[24px] overflow-hidden bg-white/10 border border-white/20 p-4 justify-between relative shadow-2xl backdrop-blur-xl"
      style={getAspectRatioStyle(aspectRatio)}
    >
      {/* Top skeleton bar */}
      <View className="flex-row items-center justify-between z-10">
        <Animated.View className="h-6 w-28 rounded-full bg-white/20" style={{ opacity: pulseAnim }} />
        <Animated.View className="h-6 px-3 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/50 items-center justify-center" style={{ opacity: pulseAnim }}>
          <Text className="text-[10px] font-bold text-[#b2ff59] tracking-widest font-display">GENERATING</Text>
        </Animated.View>
      </View>

      {/* Center glowing skeleton placeholder */}
      <View className="items-center justify-center my-auto z-10">
        <Animated.View
          className="w-16 h-16 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/60 items-center justify-center mb-3 shadow-[0_0_35px_rgba(178,255,89,0.4)]"
          style={{ opacity: pulseAnim, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.35, 0.85], outputRange: [0.95, 1.05] }) }] }}
        >
          <ActivityIndicator size="small" color="#b2ff59" />
        </Animated.View>
        <Animated.Text className="text-white text-xs font-bold tracking-wider uppercase text-center font-display" style={{ opacity: pulseAnim }}>
          Synthesizing Image...
        </Animated.Text>
        <Animated.Text className="text-[#E5FF1F] text-[11px] text-center mt-1 font-mono" style={{ opacity: pulseAnim }}>
          Aspect Ratio {aspectRatio}
        </Animated.Text>
      </View>

      {/* Bottom skeleton lines */}
      <View className="gap-2 z-10">
        <Animated.View className="h-3 w-3/4 rounded-full bg-white/15" style={{ opacity: pulseAnim }} />
        <Animated.View className="h-3 w-1/2 rounded-full bg-white/10" style={{ opacity: pulseAnim }} />
      </View>

      {/* Background pulsing layer */}
      <Animated.View
        className="absolute inset-0 bg-[#b2ff59]/5"
        style={{ opacity: pulseAnim }}
      />
    </View>
  );
}

const getAspectRatioStyle = (ratio: string) => {
  switch (ratio) {
    case '16:9': return { aspectRatio: 16 / 9 };
    case '4:5': return { aspectRatio: 4 / 5 };
    case '9:16': return { aspectRatio: 9 / 16 };
    case '1:1':
    default:
      return { aspectRatio: 1 };
  }
};

export default function Index() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams<{ prompt?: string; model?: string; aspectRatio?: string }>();

  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { session } = useSession();

  const resolveModelName = (name?: string) => {
    if (!name) return 'krea2';
    const lower = name.toLowerCase();
    if (lower.includes('flux')) return 'flux-edit';
    if (lower.includes('ideogram')) return 'ideogram4';
    if (lower.includes('krea')) return 'krea2';
    return name;
  };

  const [prompt, setPrompt] = useState<string>(() => searchParams?.prompt || '');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(() => searchParams?.aspectRatio || '1:1');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [model, setModel] = useState(() => resolveModelName(searchParams?.model));
  const [quality, setQuality] = useState('Balanced');
  const [expanded, setExpanded] = useState(false);
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [canvasModalVisible, setCanvasModalVisible] = useState(false);
  const [canvasRegions, setCanvasRegions] = useState<CanvasRegion[]>([]);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [currentChatId, setCurrentChatId] = useState<string>(() => `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  const [createdAt, setCreatedAt] = useState<string>(() => new Date().toISOString());

  const [actionToast, setActionToast] = useState<string | null>(null);
  const [downloadingDirect, setDownloadingDirect] = useState(false);
  const [publishingExplore, setPublishingExplore] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Sync state if navigation params change dynamically
  const prevParamsRef = useRef(searchParams);
  useEffect(() => {
    if (searchParams && searchParams !== prevParamsRef.current) {
      prevParamsRef.current = searchParams;
      queueMicrotask(() => {
        if (searchParams.prompt !== undefined) {
          setPrompt(searchParams.prompt);
        }
        if (searchParams.model) {
          setModel(resolveModelName(searchParams.model));
        }
        if (searchParams.aspectRatio) {
          setAspectRatio(searchParams.aspectRatio);
        }
      });
    }
  }, [searchParams]);

  const handleDirectDownload = async () => {
    if (!imageUrl) return;
    setDownloadingDirect(true);
    try {
      const res = await downloadAndSaveImage(imageUrl);
      setActionToast(res.message);
      setTimeout(() => setActionToast(null), 3500);
    } catch (err: any) {
      setActionToast(err?.message || 'Download failed');
      setTimeout(() => setActionToast(null), 3500);
    } finally {
      setDownloadingDirect(false);
    }
  };

  const handlePublishToExplore = async () => {
    if (!imageUrl) return;
    setPublishingExplore(true);
    try {
      await publishItemToExplore({
        imageUrl,
        prompt: activePrompt || prompt || 'New generation',
        model,
        aspectRatio,
      });
      setPublishedSuccess(true);
      setActionToast('Published to Explore page! 🚀');
      setTimeout(() => {
        setActionToast(null);
        setPublishedSuccess(false);
      }, 4500);
    } catch {
      setActionToast('Failed to publish to Explore page.');
      setTimeout(() => setActionToast(null), 3500);
    } finally {
      setPublishingExplore(false);
    }
  };

  const [keyboardHeightAnim] = useState(() => new Animated.Value(0));
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveCurrentChatIfNeeded = useCallback(async (overrides?: Partial<ChatItem>) => {
    const activeCanvasRegions = overrides?.canvasRegions !== undefined
      ? overrides.canvasRegions
      : (canvasEnabled ? canvasRegions : []);
    const p = overrides?.prompt !== undefined ? overrides.prompt : prompt;
    const ap = overrides?.activePrompt !== undefined ? overrides.activePrompt : activePrompt;
    const img = overrides?.imageUrl !== undefined ? overrides.imageUrl : imageUrl;
    const refs = overrides?.referenceImages !== undefined ? overrides.referenceImages : referenceImages;

    const hasData = Boolean(
      (p && p.trim().length > 0) ||
      ap !== null ||
      img !== null ||
      refs.length > 0 ||
      activeCanvasRegions.length > 0
    );
    if (hasData) {
      const chatToSave: ChatItem = {
        id: overrides?.id || currentChatId,
        title: (p || ap || 'New generation').trim().slice(0, 45) || 'Untitled Generation',
        prompt: p,
        activePrompt: ap,
        imageUrl: img,
        model: overrides?.model || model,
        aspectRatio: overrides?.aspectRatio || aspectRatio,
        quality: overrides?.quality || quality,
        referenceImages: refs,
        canvasRegions: activeCanvasRegions,
        createdAt: overrides?.createdAt || createdAt,
      };
      await saveChat(chatToSave, async () => (session ? await session.getToken() : null));
      chatEvents.emitChatSaved();
    }
  }, [prompt, activePrompt, imageUrl, referenceImages, canvasRegions, canvasEnabled, model, aspectRatio, quality, currentChatId, createdAt, session]);

  const handleCreateNewChat = useCallback(async () => {
    await saveCurrentChatIfNeeded();
    const newId = `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setCurrentChatId(newId);
    setCreatedAt(new Date().toISOString());
    setPrompt('');
    setActivePrompt(null);
    setImageUrl(null);
    setErrorText(null);
    setReferenceImages([]);
    setCanvasRegions([]);
    setCanvasEnabled(false);
    setExpanded(false);
  }, [saveCurrentChatIfNeeded]);

  const handleLoadChat = useCallback(async (chatItem: ChatItem) => {
    await saveCurrentChatIfNeeded();
    setCurrentChatId(chatItem.id);
    setCreatedAt(chatItem.createdAt || new Date().toISOString());
    setPrompt(chatItem.prompt || '');
    setActivePrompt(chatItem.activePrompt || null);
    setImageUrl(chatItem.imageUrl || null);
    setModel(chatItem.model || 'krea2');
    setAspectRatio(chatItem.aspectRatio || '1:1');
    setQuality(chatItem.quality || 'Balanced');
    setReferenceImages(chatItem.referenceImages || []);
    setCanvasRegions(chatItem.canvasRegions || []);
    setCanvasEnabled((chatItem.canvasRegions || []).length > 0);
    setErrorText(null);
    setExpanded(false);
  }, [saveCurrentChatIfNeeded]);

  useEffect(() => {
    const unsub = chatEvents.subscribe((event) => {
      if (event.type === 'NEW_CHAT') {
        handleCreateNewChat();
      } else if (event.type === 'LOAD_CHAT') {
        handleLoadChat(event.chat);
      }
    });
    return () => unsub();
  }, [handleCreateNewChat, handleLoadChat]);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setErrorText('Generation cancelled');
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setExpanded(false);
      Animated.timing(keyboardHeightAnim, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? (e.duration || 250) : 150,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e.duration || 250) : 150,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeightAnim]);

  const copyPrompt = async (textToCopy: string | null) => {
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const aspectRatios = ['1:1', '4:5', '16:9', '9:16'];
  const models = [
    { name: 'krea2', short: 'Kr' },
    { name: 'flux-edit', short: 'Fl' },
    { name: 'ideogram4', short: 'Id' }
  ];
  const qualities = [
    { name: 'Fast', icon: 'zap' as const },
    { name: 'Balanced', icon: 'sliders' as const },
    { name: 'Max', icon: 'award' as const }
  ];
  const suggestions = ['Studio product shot', '9:16 kinetic intro', 'Lifestyle scene'];

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => {
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          return `data:${mimeType};base64,${asset.base64}`;
        }
        return asset.uri;
      });
      setReferenceImages((prev) => [...prev, ...newUris].slice(0, 2));
    }
  };

  const removeImage = (indexToRemove: number) => {
    setReferenceImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const generateImage = async () => {
    if (isUserLoaded && !isSignedIn) {
      router.push('/(auth)/signin');
      return;
    }
    const effectiveCanvasRegions = canvasEnabled && canvasRegions.length > 0 ? canvasRegions : [];
    if (canvasEnabled && effectiveCanvasRegions.length === 0) {
      setCanvasEnabled(false);
    }
    if (!prompt.trim() && effectiveCanvasRegions.length === 0) return;

    let currentPrompt = prompt.trim();

    setActivePrompt(currentPrompt);
    setPrompt('');

    Keyboard.dismiss();
    setLoading(true);
    setImageUrl(null);
    setErrorText(null);
    setExpanded(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const endpointMap: Record<string, string> = {
        'krea2': '/api/krea2',
        'flux-edit': '/api/flux_edit',
        'ideogram4': '/api/ideogram4',
      };
      const rawUrl = endpointMap[model.toLowerCase()] || '/api/generation';
      const resolvedUrl = resolveApiUrl(rawUrl);

      const response = await fetch(resolvedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: currentPrompt,
          aspectRatio,
          referenceImage: referenceImages[0] || null,
          referenceImages,
          canvasRegions: effectiveCanvasRegions,
          model,
          quality,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);
        // Persist immediately with the correct newly generated image URL
        await saveCurrentChatIfNeeded({
          prompt: '',
          activePrompt: currentPrompt,
          imageUrl: data.imageUrl,
          referenceImages,
          canvasRegions: effectiveCanvasRegions,
          model,
          aspectRatio,
          quality,
          createdAt,
          id: currentChatId,
        });
      } else {
        setErrorText(data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation request aborted by user');
        setErrorText('Generation stopped');
      } else {
        console.error("Network error:", error);
        setErrorText(error.message || "Network request failed. Check your connection.");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };


  return (
    <AestheticBackdrop fullWindowAlign={true} style={{ paddingTop: insets.top }}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 z-20">
        <RealisticGlassButton
          onPress={() => (navigation as any).toggleDrawer()}
          variant="glass"
          size={40}
          borderRadius={20}
          showGlint={false}
        >
          <Feather name="grid" size={18} color="#E5FF1F" />
        </RealisticGlassButton>

        <View className="items-center flex-1 mx-2">
          <Text style={{ fontFamily: HELVETICA_BOLD }} className="text-[10px] tracking-widest uppercase text-[#E5FF1F] font-bold">Generation</Text>
          <Text style={{ fontFamily: HELVETICA_BOLD }} className="text-[16px] font-bold text-white mt-0.5 tracking-tight">New generation</Text>
        </View>

        <RealisticGlassButton
          onPress={handleCreateNewChat}
          variant="lime"
          size={40}
          borderRadius={20}
          showGlint={false}
        >
          <Feather name="plus" size={18} color="#0b1405" />
        </RealisticGlassButton>
      </View>

      <ScrollView
        className="flex-1 z-10"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 2 }}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        scrollEnabled={contentHeight > containerHeight + 5}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Empty State */}
        {!imageUrl && !loading && !errorText ? (
          <View className="items-center px-4 pt-10">
            {/* Liquid Glass Emblem */}
            <View className="w-[66px] h-[66px] rounded-full bg-[#E5FF1F] shadow-[0_0_40px_rgba(229,255,31,0.6)] border border-white/50 mb-6 items-center justify-center">
              <Feather name="zap" size={28} color="#0b1405" />
            </View>
            <Text style={{ fontFamily: HELVETICA_BOLD }} className="text-[22px] font-bold text-white mb-3 tracking-tight">Nothing generated yet</Text>
            <Text style={{ fontFamily: HELVETICA_FONT, color: '#E5FF1F' }} className="text-[14px] text-center max-w-[290px] leading-5 mb-6">
              Write prompt, attach reference, or compose a layout in Reference Canvas to control where things go.
            </Text>

            <View className="flex-row flex-wrap justify-center gap-2 max-w-[340px]">
              {suggestions.map((text, i) => (
                <RealisticGlassButton
                  key={i}
                  onPress={() => setPrompt(text)}
                  variant="glass"
                  borderRadius={18}
                  showGlint={false}
                  contentStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  <Text style={{ fontFamily: HELVETICA_BOLD }} className="text-xs font-semibold text-[#E5FF1F] tracking-wide">{text}</Text>
                </RealisticGlassButton>
              ))}
            </View>
          </View>
        ) : (
          <View className="px-4 pt-0">
            {/* Status / Results */}
            {loading && (
              <ImageSkeleton aspectRatio={aspectRatio} />
            )}
            {errorText && (
              <Text className="text-red-400 text-center mt-2 text-sm font-medium font-sans">{errorText}</Text>
            )}
            {imageUrl && (
              <View className="w-full mt-1">
                <View
                  className="w-full rounded-[24px] overflow-hidden bg-white/10 border border-white/20 p-2 shadow-2xl backdrop-blur-xl"
                  style={getAspectRatioStyle(aspectRatio)}
                >
                  <ExpoImage source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 16 }} contentFit="cover" transition={300} />
                </View>

                {/* Quick Action Bar: Download, Share & Publish to Explore */}
                <View className="flex-row items-center justify-between mt-3 px-1 gap-2">
                  <RealisticGlassButton
                    onPress={handleDirectDownload}
                    disabled={downloadingDirect}
                    variant="dark"
                    size={{ height: 42 }}
                    borderRadius={21}
                    showGlint={false}
                    style={{ flex: 1 }}
                    contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: '100%' }}
                  >
                    {downloadingDirect ? (
                      <ActivityIndicator size="small" color="#E5FF1F" />
                    ) : (
                      <Feather name="download" size={14} color="#E5FF1F" />
                    )}
                    <Text className="text-[12px] font-bold text-[#E5FF1F] font-display">
                      {downloadingDirect ? 'Saving…' : 'Save'}
                    </Text>
                  </RealisticGlassButton>

                  <RealisticGlassButton
                    onPress={() => setShareModalVisible(true)}
                    variant="glass"
                    size={42}
                    borderRadius={21}
                    showGlint={false}
                  >
                    <Feather name="share-2" size={15} color="#E5FF1F" />
                  </RealisticGlassButton>

                  <RealisticGlassButton
                    onPress={handlePublishToExplore}
                    disabled={publishingExplore}
                    variant="lime"
                    size={{ height: 42 }}
                    borderRadius={21}
                    showGlint={false}
                    style={{ flex: 1 }}
                    contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: '100%' }}
                  >
                    {publishingExplore ? (
                      <ActivityIndicator size="small" color="#0b1405" />
                    ) : (
                      <Feather name="globe" size={14} color="#0b1405" />
                    )}
                    <Text className="text-[12px] font-bold text-[#0b1405] font-display">
                      {publishingExplore ? 'Publishing…' : 'Publish'}
                    </Text>
                  </RealisticGlassButton>
                </View>

                {actionToast && (
                  <View className="mt-2.5 p-2.5 rounded-xl bg-[#E5FF1F]/20 border border-[#E5FF1F]/50 flex-row items-center justify-between px-3">
                    <Text className="text-[11.5px] font-bold text-[#E5FF1F] font-sans flex-1">{actionToast}</Text>
                    {publishedSuccess && (
                      <RealisticGlassButton
                        onPress={() => router.push('/(tabs)/explore')}
                        variant="lime"
                        borderRadius={14}
                        showGlint={false}
                        contentStyle={{ paddingHorizontal: 10, paddingVertical: 4 }}
                      >
                        <Text className="text-[10.5px] font-bold text-[#0b1405] font-display">View Feed →</Text>
                      </RealisticGlassButton>
                    )}
                  </View>
                )}
              </View>
            )}
            {activePrompt && (loading || imageUrl || errorText) && (
              <RealisticGlassBox
                borderRadius={24}
                tintColor="rgba(11, 19, 10, 0.82)"
                showGlint={false}
                style={{ marginTop: 14 }}
                contentStyle={{ padding: 16 }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Feather name="command" size={13} color="#E5FF1F" />
                    <Text className="text-[10px] font-bold text-[#E5FF1F] uppercase tracking-widest font-mono">Prompt</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <RealisticGlassButton
                      onPress={() => setPrompt(activePrompt)}
                      variant="dark"
                      borderRadius={14}
                      showGlint={false}
                      contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4 }}
                    >
                      <Feather name="edit-3" size={11} color="#E5FF1F" />
                      <Text className="text-[11px] font-medium text-[#E5FF1F] font-sans">Reuse</Text>
                    </RealisticGlassButton>
                    <RealisticGlassButton
                      onPress={() => copyPrompt(activePrompt)}
                      variant="dark"
                      borderRadius={14}
                      showGlint={false}
                      contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4 }}
                    >
                      <Feather name={copied ? "check" : "copy"} size={11} color="#E5FF1F" />
                      <Text className="text-[11px] font-medium font-sans text-[#E5FF1F]">
                        {copied ? 'Copied!' : 'Copy'}
                      </Text>
                    </RealisticGlassButton>
                  </View>
                </View>
                <Text className="text-white text-[13.5px] font-medium leading-5 font-sans">{activePrompt}</Text>
              </RealisticGlassBox>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Prompt Bar (Liquid Glass Dock) */}
      <Animated.View
        className="px-3 pt-2 z-30"
        style={{
          paddingBottom: Animated.add(
            keyboardHeightAnim,
            keyboardHeightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [Math.max(insets.bottom, 12), 10],
              extrapolate: 'clamp',
            })
          )
        }}
      >
        <RealisticGlassBox
          borderRadius={34}
          tintColor="rgba(10, 16, 8, 0.78)"
          showGlint={false}
        >
          {/* Expanded Panel */}
          {expanded && (
            <View className="px-4 pt-4 pb-2">
              {/* Model */}
              <View className="mb-4">
                <Text style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }} className="text-[10px] font-bold tracking-widest uppercase mb-2">Model</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row flex-nowrap" contentContainerStyle={{ gap: 8 }}>
                  {models.map((m) => (
                    <RealisticGlassButton
                      key={m.name}
                      onPress={() => setModel(m.name)}
                      variant={model === m.name ? 'lime' : 'glass'}
                      borderRadius={18}
                      showGlint={false}
                      contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7 }}
                    >
                      <View className={`w-4 h-4 rounded-[5px] items-center justify-center ${model === m.name ? 'bg-[#0b1405]' : 'bg-[#E5FF1F]/20'}`}>
                        <Text style={{ fontFamily: HELVETICA_BOLD }} className={`text-[8px] font-bold ${model === m.name ? 'text-[#E5FF1F]' : 'text-[#E5FF1F]'}`}>{m.short}</Text>
                      </View>
                      <Text style={{ fontFamily: HELVETICA_BOLD }} className={`text-xs ${model === m.name ? 'text-[#0b1405] font-bold' : 'text-white'}`}>{m.name}</Text>
                    </RealisticGlassButton>
                  ))}
                </ScrollView>
              </View>

              {/* Canvas Switch & Setup Row */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setCanvasEnabled(true);
                  setCanvasModalVisible(true);
                }}
                className="flex-row items-center justify-between py-3 border-t border-b border-white/10 mb-4"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontFamily: HELVETICA_BOLD }} className="text-[13px] font-bold text-white">Reference Canvas</Text>
                    {canvasRegions.length > 0 && (
                      <View className="px-2 py-0.5 rounded-full bg-[#E5FF1F]/20 border border-[#E5FF1F]/50">
                        <Text className="text-[9px] font-bold text-[#E5FF1F] font-mono">{canvasRegions.length} {canvasRegions.length === 1 ? 'region' : 'regions'}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: HELVETICA_FONT, color: '#E5FF1F' }} className="text-[11px] mt-0.5">
                    {canvasRegions.length > 0 ? 'Tap to edit composition regions' : 'Compose regions for the model to follow'}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {canvasRegions.length > 0 && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setCanvasModalVisible(true);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20"
                    >
                      <Text className="text-[10.5px] font-bold text-[#E5FF1F] font-sans">Edit</Text>
                    </TouchableOpacity>
                  )}
                  <Switch
                    value={canvasEnabled}
                    onValueChange={(val) => {
                      setCanvasEnabled(val);
                      if (val) {
                        setCanvasModalVisible(true);
                      } else {
                        setCanvasRegions([]);
                      }
                    }}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#E5FF1F' }}
                    thumbColor={canvasEnabled ? '#0b1405' : '#ffffff'}
                    ios_backgroundColor="rgba(255,255,255,0.15)"
                  />
                </View>
              </TouchableOpacity>

              {/* Aspect Ratio */}
              <View className="mb-4">
                <Text style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }} className="text-[10px] font-bold tracking-widest uppercase mb-2">Aspect ratio</Text>
                <View className="flex-row flex-wrap gap-2">
                  {aspectRatios.map((ratio) => (
                    <RealisticGlassButton
                      key={ratio}
                      onPress={() => setAspectRatio(ratio)}
                      variant={aspectRatio === ratio ? 'lime' : 'glass'}
                      borderRadius={18}
                      showGlint={false}
                      contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7 }}
                    >
                      <View className={`border-[1.5px] rounded-[2.5px] ${aspectRatio === ratio ? 'border-[#0b1405]' : 'border-[#E5FF1F]/60'}`}
                        style={{
                          width: ratio === '16:9' ? 16 : ratio === '4:5' ? 11 : ratio === '9:16' ? 9 : 13,
                          height: ratio === '16:9' ? 9 : ratio === '4:5' ? 14 : ratio === '9:16' ? 16 : 13
                        }}
                      />
                      <Text style={{ fontFamily: HELVETICA_BOLD }} className={`text-xs ${aspectRatio === ratio ? 'text-[#0b1405] font-bold' : 'text-white'}`}>{ratio}</Text>
                    </RealisticGlassButton>
                  ))}
                </View>
              </View>

              {/* Quality */}
              <View className="mb-2">
                <Text style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }} className="text-[10px] font-bold tracking-widest uppercase mb-2">Quality</Text>
                <View className="flex-row flex-wrap gap-2">
                  {qualities.map((q) => (
                    <RealisticGlassButton
                      key={q.name}
                      onPress={() => setQuality(q.name)}
                      variant={quality === q.name ? 'lime' : 'glass'}
                      borderRadius={18}
                      showGlint={false}
                      contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7 }}
                    >
                      <Feather name={q.icon} size={13} color={quality === q.name ? '#0b1405' : '#E5FF1F'} />
                      <Text style={{ fontFamily: HELVETICA_BOLD }} className={`text-xs ${quality === q.name ? 'text-[#0b1405] font-bold' : 'text-white'}`}>{q.name}</Text>
                    </RealisticGlassButton>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Selected Reference Images Carousel */}
          {referenceImages.length > 0 && (
            <View className="px-4 pt-3 pb-2.5 border-b border-white/10">
              <View className="flex-row items-center justify-between mb-2">
                <Text style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }} className="text-[10px] font-bold tracking-widest uppercase">
                  Reference Images ({referenceImages.length})
                </Text>
                <TouchableOpacity onPress={() => setReferenceImages([])}>
                  <Text style={{ fontFamily: HELVETICA_BOLD }} className="text-[11px] font-bold text-[#E5FF1F]">Clear all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {referenceImages.map((uri, index) => (
                  <View key={`${uri}-${index}`} className="relative w-12 h-12 rounded-[14px] overflow-hidden border border-white/30 shadow-sm">
                    <ExpoImage source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/80 rounded-full w-4 h-4 items-center justify-center border border-white/40"
                    >
                      <Feather name="x" size={10} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <RealisticGlassButton
                  onPress={pickImage}
                  variant="glass"
                  size={48}
                  borderRadius={14}
                  showGlint={false}
                >
                  <Feather name="plus" size={18} color="#E5FF1F" />
                </RealisticGlassButton>
              </ScrollView>
            </View>
          )}

          {/* Main Prompt Row */}
          <View className="flex-row items-end px-3.5 py-3">
            <RealisticGlassButton
              onPress={pickImage}
              variant="glass"
              size={40}
              borderRadius={20}
              showGlint={false}
              style={{ marginRight: 8 }}
            >
              {referenceImages.length > 0 ? (
                <View className="relative w-full h-full rounded-full overflow-hidden">
                  <ExpoImage source={{ uri: referenceImages[referenceImages.length - 1] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  {referenceImages.length > 1 && (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <Text className="text-white text-[10px] font-bold font-mono">+{referenceImages.length}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Feather name="image" size={18} color="#E5FF1F" />
              )}
            </RealisticGlassButton>

            <View className="flex-1 justify-center mr-2">
              {canvasEnabled && canvasRegions.length > 0 && (
                <View className="flex-row items-center mb-1">
                  <View className="flex-row items-center rounded-full bg-[#222908]/90 border border-[#E5FF1F]/70 shadow-[0_0_10px_rgba(229,255,31,0.25)] overflow-hidden">
                    <TouchableOpacity
                      onPress={() => setCanvasModalVisible(true)}
                      className="flex-row items-center gap-1.5 pl-3 pr-1.5 py-1"
                    >
                      <Feather name="layers" size={12} color="#E5FF1F" />
                      <Text className="text-[11.5px] font-bold text-white font-display">
                        Layout · {canvasRegions.length}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setCanvasRegions([]);
                        setCanvasEnabled(false);
                      }}
                      className="px-2 py-1 border-l border-white/20"
                    >
                      <Feather name="x" size={12} color="#bababa" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <TextInput
                className="text-white text-[14.5px] font-sans font-medium max-h-[110px] min-h-[40px] py-2 px-1.5"
                placeholder="Describe the shot, scene, or edit…"
                placeholderTextColor="rgba(255,255,255,0.55)"
                multiline
                scrollEnabled={true}
                value={prompt}
                onChangeText={setPrompt}
                onFocus={() => setExpanded(false)}
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <View className="flex-row items-center gap-2">
              <RealisticGlassButton
                onPress={() => setExpanded(!expanded)}
                variant="glass"
                size={40}
                borderRadius={20}
                showGlint={false}
              >
                <Feather name={expanded ? "chevron-down" : "chevron-up"} size={19} color="#E5FF1F" />
              </RealisticGlassButton>

              <RealisticGlassButton
                onPress={loading ? stopGeneration : generateImage}
                variant="lime"
                size={40}
                borderRadius={20}
                showGlint={false}
              >
                {loading ? (
                  <View className="w-3.5 h-3.5 bg-[#0b1405] rounded-[3px]" />
                ) : (
                  <Feather name="arrow-up" size={20} color="#0b1405" />
                )}
              </RealisticGlassButton>
            </View>
          </View>
        </RealisticGlassBox>
      </Animated.View>

      <ReferenceCanvasModal
        visible={canvasModalVisible}
        onClose={() => {
          setCanvasModalVisible(false);
          if (canvasRegions.length === 0) {
            setCanvasEnabled(false);
          }
        }}
        aspectRatio={aspectRatio}
        regions={canvasRegions}
        onSaveRegions={(newRegions) => {
          setCanvasRegions(newRegions);
          setCanvasEnabled(newRegions.length > 0);
        }}
      />

      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        imageUrl={imageUrl}
        prompt={activePrompt || prompt || 'New generation'}
        model={model}
        aspectRatio={aspectRatio}
      />
    </AestheticBackdrop>
  );
}