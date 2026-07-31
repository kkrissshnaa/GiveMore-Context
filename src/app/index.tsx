import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Switch
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from 'expo-router';
import { ReferenceCanvasModal, CanvasRegion } from '../components/ReferenceCanvasModal';
import { AestheticBackdrop } from '../components/AestheticBackdrop';
import { saveChat, ChatItem } from '../lib/chatService';
import { chatEvents } from '../lib/chatEvents';

function ImageSkeleton({ aspectRatio }: { aspectRatio: string }) {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

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
      className="w-full mt-1 rounded-[24px] overflow-hidden bg-white/10 border border-white/20 p-4 justify-between relative shadow-2xl"
      style={getAspectRatioStyle(aspectRatio)}
    >
      {/* Top skeleton bar */}
      <View className="flex-row items-center justify-between z-10">
        <Animated.View className="h-6 w-28 rounded-full bg-white/20" style={{ opacity: pulseAnim }} />
        <Animated.View className="h-6 px-3 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/40 items-center justify-center" style={{ opacity: pulseAnim }}>
          <Text className="text-[10px] font-bold text-[#b2ff59] tracking-wider">GENERATING</Text>
        </Animated.View>
      </View>

      {/* Center glowing skeleton placeholder */}
      <View className="items-center justify-center my-auto z-10">
        <Animated.View 
          className="w-16 h-16 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/50 items-center justify-center mb-3 shadow-[0_0_30px_rgba(178,255,89,0.3)]"
          style={{ opacity: pulseAnim, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.35, 0.85], outputRange: [0.95, 1.05] }) }] }}
        >
          <ActivityIndicator size="small" color="#b2ff59" />
        </Animated.View>
        <Animated.Text className="text-white text-xs font-semibold tracking-wider uppercase text-center" style={{ opacity: pulseAnim }}>
          Synthesizing Image...
        </Animated.Text>
        <Animated.Text className="text-[#8a8385] text-[11px] text-center mt-1" style={{ opacity: pulseAnim }}>
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

export default function index() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [model, setModel] = useState('krea2');
  const [quality, setQuality] = useState('Balanced');
  const [expanded, setExpanded] = useState(false);
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [canvasModalVisible, setCanvasModalVisible] = useState(false);
  const [canvasRegions, setCanvasRegions] = useState<CanvasRegion[]>([]);
  const [copied, setCopied] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [currentChatId, setCurrentChatId] = useState<string>(() => `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  const [createdAt, setCreatedAt] = useState<string>(() => new Date().toISOString());

  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveCurrentChatIfNeeded = useCallback(async () => {
    const hasData = Boolean(
      (prompt && prompt.trim().length > 0) || 
      activePrompt !== null || 
      imageUrl !== null || 
      referenceImages.length > 0 || 
      canvasRegions.length > 0
    );
    if (hasData) {
      const chatToSave: ChatItem = {
        id: currentChatId,
        title: (prompt || activePrompt || 'New generation').trim().slice(0, 45) || 'Untitled Generation',
        prompt,
        activePrompt,
        imageUrl,
        model,
        aspectRatio,
        quality,
        referenceImages,
        canvasRegions,
        createdAt,
      };
      await saveChat(chatToSave);
      chatEvents.emitChatSaved();
    }
  }, [prompt, activePrompt, imageUrl, referenceImages, canvasRegions, model, aspectRatio, quality, currentChatId, createdAt]);

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
    { name: 'krea2', short: 'Kr', dotBg: '#b2ff59' },
    { name: 'flux-edit', short: 'Fl', dotBg: '#1e3810' },
    { name: 'ideogram4', short: 'Id', dotBg: '#44662d' }
  ];
  const qualities = [
    { name: 'Fast', icon: 'zap' as const },
    { name: 'Balanced', icon: 'sliders' as const },
    { name: 'Max', icon: 'star' as const }
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
    if (!prompt.trim() && canvasRegions.length === 0) return;

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
      const url = endpointMap[model.toLowerCase()] || '/api/generation';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: currentPrompt,
          aspectRatio,
          referenceImage: referenceImages[0] || null,
          referenceImages,
          canvasRegions,
          model,
          quality,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);
        setTimeout(() => {
          saveCurrentChatIfNeeded();
        }, 100);
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

  const renderIconBtn = (icon: any, bg: string, color: string, border: string = 'border-white/10', onPress?: () => void) => (
    <TouchableOpacity onPress={onPress} className={`w-10 h-10 rounded-full items-center justify-center border ${bg} ${border}`}>
      <Feather name={icon} size={18} color={color} />
    </TouchableOpacity>
  );

  return (
    <AestheticBackdrop style={{ paddingTop: insets.top }}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 z-20">
        {renderIconBtn('menu', 'bg-white/10', 'white', 'border-white/20', () => (navigation as any).toggleDrawer())}
        <View className="items-center flex-1 mx-2">
          <Text className="text-[10px] tracking-widest uppercase text-[#b2ff59] font-bold">Generation</Text>
          <Text className="text-[15px] font-bold text-white mt-0.5">New generation</Text>
        </View>
        {renderIconBtn('plus', 'bg-[#b2ff59]', '#0b1405', 'border-white/40 shadow-[0_4px_16px_rgba(178,255,89,0.4)]', handleCreateNewChat)}
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
               <View className="w-[62px] h-[62px] rounded-full bg-[#b2ff59] shadow-[0_0_35px_rgba(178,255,89,0.5)] border border-white/40 mb-6 items-center justify-center">
                 <Feather name="zap" size={26} color="#0b1405" />
               </View>
               <Text className="text-[20px] font-bold text-white mb-3 tracking-tight">Nothing generated yet</Text>
               <Text className="text-[13.5px] text-[#bababa] text-center max-w-[280px] leading-5 mb-6">
                 Write a prompt, attach references, or compose a layout in Reference Canvas to control where things go.
               </Text>
               
               <View className="flex-row flex-wrap justify-center gap-2">
                 {suggestions.map((text, i) => (
                   <TouchableOpacity key={i} onPress={() => setPrompt(text)} className="px-[14px] py-2 rounded-full bg-white/10 border border-white/20 shadow-sm backdrop-blur-md">
                     <Text className="text-xs font-medium text-white/90">{text}</Text>
                   </TouchableOpacity>
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
                  <Text className="text-red-400 text-center mt-2 text-sm font-medium">{errorText}</Text>
                )}
                {imageUrl && (
                  <View 
                    className="w-full mt-1 rounded-[24px] overflow-hidden bg-white/10 border border-white/20 p-2 shadow-2xl backdrop-blur-xl"
                    style={getAspectRatioStyle(aspectRatio)}
                  >
                    <Image source={{ uri: imageUrl }} className="w-full h-full rounded-[16px]" resizeMode="cover" />
                  </View>
                )}
                {activePrompt && (loading || imageUrl || errorText) && (
                  <View className="mt-3 p-4 bg-[#0e170d]/80 border border-[#b2ff59]/30 rounded-[22px] shadow-lg backdrop-blur-md">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Feather name="terminal" size={13} color="#b2ff59" />
                        <Text className="text-[10px] font-bold text-[#b2ff59] uppercase tracking-widest">Prompt</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity 
                          onPress={() => setPrompt(activePrompt)} 
                          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20"
                        >
                          <Feather name="edit-2" size={11} color="#bababa" />
                          <Text className="text-[11px] font-medium text-[#bababa]">Reuse</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => copyPrompt(activePrompt)} 
                          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20"
                        >
                          <Feather name={copied ? "check" : "copy"} size={11} color={copied ? "#b2ff59" : "#bababa"} />
                          <Text className={`text-[11px] font-medium ${copied ? 'text-[#b2ff59]' : 'text-[#bababa]'}`}>
                            {copied ? 'Copied!' : 'Copy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-white text-[13.5px] font-medium leading-5">{activePrompt}</Text>
                  </View>
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
          <View className="bg-[#0c150c]/85 border border-white/20 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            {/* Expanded Panel */}
            {expanded && (
              <View className="px-4 pt-4 pb-2">
                {/* Model */}
                <View className="mb-4">
                  <Text className="text-[10px] font-bold tracking-widest uppercase text-[#8a8385] mb-2">Model</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row flex-nowrap" contentContainerStyle={{gap: 8}}>
                    {models.map((m) => (
                      <TouchableOpacity 
                        key={m.name} 
                        onPress={() => setModel(m.name)}
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${model === m.name ? 'bg-[#b2ff59]/20 border-[#b2ff59]/60' : 'bg-white/5 border-white/10'}`}
                      >
                        <View className="w-4 h-4 rounded-[5px] items-center justify-center" style={{ backgroundColor: m.dotBg }}>
                          <Text className="text-[8px] font-bold text-black">{m.short}</Text>
                        </View>
                        <Text className={`text-xs font-medium ${model === m.name ? 'text-white' : 'text-[#bababa]'}`}>{m.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Canvas Switch */}
                <View className="flex-row items-center justify-between py-3 border-t border-b border-white/10 mb-4">
                  <View>
                    <Text className="text-[13px] font-bold text-white">Reference Canvas</Text>
                    <Text className="text-[11px] text-[#8a8385] mt-0.5">Compose regions for the model to follow</Text>
                  </View>
                  <Switch 
                    value={canvasEnabled} 
                    onValueChange={(val) => {
                      setCanvasEnabled(val);
                      if (val) setCanvasModalVisible(true);
                    }} 
                    trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#b2ff59' }} 
                    thumbColor="white"
                    ios_backgroundColor="rgba(255,255,255,0.12)"
                  />
                </View>

                {/* Aspect Ratio */}
                <View className="mb-4">
                  <Text className="text-[10px] font-bold tracking-widest uppercase text-[#8a8385] mb-2">Aspect ratio</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {aspectRatios.map((ratio) => (
                      <TouchableOpacity 
                        key={ratio} 
                        onPress={() => setAspectRatio(ratio)}
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${aspectRatio === ratio ? 'bg-[#b2ff59]/20 border-[#b2ff59]/60' : 'bg-white/5 border-white/10'}`}
                      >
                        <View className={`border-[1.5px] rounded-[2.5px] ${aspectRatio === ratio ? 'border-white' : 'border-[#bababa]'}`} 
                          style={{
                            width: ratio === '16:9' ? 16 : ratio === '4:5' ? 11 : ratio === '9:16' ? 9 : 13,
                            height: ratio === '16:9' ? 9 : ratio === '4:5' ? 14 : ratio === '9:16' ? 16 : 13
                          }} 
                        />
                        <Text className={`text-xs font-medium ${aspectRatio === ratio ? 'text-white' : 'text-[#bababa]'}`}>{ratio}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Quality */}
                <View className="mb-2">
                  <Text className="text-[10px] font-bold tracking-widest uppercase text-[#8a8385] mb-2">Quality</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {qualities.map((q) => (
                      <TouchableOpacity 
                        key={q.name} 
                        onPress={() => setQuality(q.name)}
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${quality === q.name ? 'bg-[#b2ff59]/20 border-[#b2ff59]/60' : 'bg-white/5 border-white/10'}`}
                      >
                        <Feather name={q.icon} size={13} color={quality === q.name ? 'white' : '#bababa'} />
                        <Text className={`text-xs font-medium ${quality === q.name ? 'text-white' : 'text-[#bababa]'}`}>{q.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Selected Reference Images Carousel */}
            {referenceImages.length > 0 && (
              <View className="px-4 pt-3 pb-2 border-b border-white/10">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] font-bold tracking-widest uppercase text-[#8a8385]">
                    Reference Images ({referenceImages.length})
                  </Text>
                  <TouchableOpacity onPress={() => setReferenceImages([])}>
                    <Text className="text-[11px] font-semibold text-[#b2ff59]">Clear all</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {referenceImages.map((uri, index) => (
                    <View key={`${uri}-${index}`} className="relative w-12 h-12 rounded-[10px] overflow-hidden border border-white/20">
                      <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                      <TouchableOpacity 
                        onPress={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/70 rounded-full w-4 h-4 items-center justify-center border border-white/40"
                      >
                        <Feather name="x" size={10} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity 
                    onPress={pickImage} 
                    className="w-12 h-12 rounded-[10px] border border-dashed border-white/30 items-center justify-center bg-white/5"
                  >
                    <Feather name="plus" size={16} color="#bababa" />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Main Prompt Row */}
            <View className="flex-row items-end px-3.5 py-3">
              <TouchableOpacity onPress={pickImage} className="w-10 h-10 rounded-[10px] border-[1.5px] border-dashed border-white/20 items-center justify-center bg-transparent mr-2.5">
                {referenceImages.length > 0 ? (
                  <View className="relative w-full h-full rounded-[8px] overflow-hidden">
                    <Image source={{ uri: referenceImages[referenceImages.length - 1] }} className="w-full h-full" resizeMode="cover" />
                    {referenceImages.length > 1 && (
                      <View className="absolute inset-0 bg-black/50 items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">+{referenceImages.length}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Feather name="image" size={18} color="#bababa" />
                )}
              </TouchableOpacity>
              
              <View className="flex-1 justify-center mr-2">
                {canvasRegions.length > 0 && (
                  <View className="flex-row items-center mb-1">
                    <TouchableOpacity 
                      onPress={() => setCanvasModalVisible(true)}
                      className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#162713] border border-[#b2ff59]/60"
                    >
                      <Feather name="layers" size={12} color="#b2ff59" />
                      <Text className="text-[11.5px] font-bold text-white">
                        Layout · {canvasRegions.length}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          setCanvasRegions([]);
                          setCanvasEnabled(false);
                        }}
                        className="ml-1 pl-1 border-l border-white/20"
                      >
                        <Feather name="x" size={12} color="#bababa" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput 
                  className="text-white text-[14px] font-medium max-h-[110px] min-h-[40px] py-1.5 px-1"
                  placeholder="Describe the shot, scene, or edit…"
                  placeholderTextColor="#8a8385"
                  multiline
                  scrollEnabled={true}
                  value={prompt}
                  onChangeText={setPrompt}
                  onFocus={() => setExpanded(false)}
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
              
              <View className="flex-row items-center gap-2">
                <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => setExpanded(!expanded)}>
                  <Feather name={expanded ? "chevron-down" : "chevron-up"} size={24} color="#bababa" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={loading ? stopGeneration : generateImage}
                  activeOpacity={0.7}
                  className="w-10 h-10 rounded-full bg-[#b2ff59] items-center justify-center shadow-[0_8px_24px_-4px_rgba(178,255,89,0.6)] border border-white/40"
                >
                  {loading ? (
                    <View className="w-3.5 h-3.5 bg-[#0b1405] rounded-[3px]" />
                  ) : (
                    <Feather name="arrow-up" size={20} color="#0b1405" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        <ReferenceCanvasModal
          visible={canvasModalVisible}
          onClose={() => setCanvasModalVisible(false)}
          aspectRatio={aspectRatio}
          regions={canvasRegions}
          onSaveRegions={(newRegions) => {
            setCanvasRegions(newRegions);
            setCanvasEnabled(newRegions.length > 0);
          }}
        />
    </AestheticBackdrop>
  );
}