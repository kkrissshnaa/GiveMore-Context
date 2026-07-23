import { useState, useEffect, useRef } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from 'expo-router';

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
      className="w-full mt-3 rounded-[22px] overflow-hidden bg-white/5 border border-white/10 p-4 justify-between relative"
      style={getAspectRatioStyle(aspectRatio)}
    >
      {/* Top skeleton bar */}
      <View className="flex-row items-center justify-between z-10">
        <Animated.View className="h-6 w-28 rounded-full bg-white/20" style={{ opacity: pulseAnim }} />
        <Animated.View className="h-6 px-3 rounded-full bg-[#ff6d29]/20 border border-[#ff6d29]/40 items-center justify-center" style={{ opacity: pulseAnim }}>
          <Text className="text-[10px] font-bold text-[#ff6d29] tracking-wider">GENERATING</Text>
        </Animated.View>
      </View>

      {/* Center glowing skeleton placeholder */}
      <View className="items-center justify-center my-auto z-10">
        <Animated.View 
          className="w-16 h-16 rounded-full bg-[#ff6d29]/20 border border-[#ff6d29]/50 items-center justify-center mb-3"
          style={{ opacity: pulseAnim, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.35, 0.85], outputRange: [0.95, 1.05] }) }] }}
        >
          <ActivityIndicator size="small" color="#ff6d29" />
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
        className="absolute inset-0 bg-[#ff6d29]/5" 
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
  const [model, setModel] = useState('Ideogram');
  const [quality, setQuality] = useState('Balanced');
  const [expanded, setExpanded] = useState(true);
  const [canvasEnabled, setCanvasEnabled] = useState(false);

  const aspectRatios = ['1:1', '4:5', '16:9', '9:16'];
  const models = [
    { name: 'Ideogram', short: 'Id', dotBg: '#ff6d29' },
    { name: 'Kling', short: 'Kl', dotBg: '#453027' },
    { name: 'Veo', short: 'Ve', dotBg: '#8a8385' },
    { name: 'Seedance', short: 'Sd', dotBg: '#7a3a1c' }
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
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      setReferenceImages((prev) => [...prev, ...newUris]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setReferenceImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    const currentPrompt = prompt.trim();
    setActivePrompt(currentPrompt);
    setPrompt('');

    Keyboard.dismiss();
    setLoading(true);
    setImageUrl(null);
    setErrorText(null);
    setExpanded(false);

    try {
      const url = '/api/generation';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          aspectRatio,
          referenceImage: referenceImages[0] || null,
          referenceImages,
          model,
          quality,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);
      } else {
        setErrorText(data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorText(error.message || "Network request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderIconBtn = (icon: any, bg: string, color: string, border: string = 'border-white/10', onPress?: () => void) => (
    <TouchableOpacity onPress={onPress} className={`w-10 h-10 rounded-full items-center justify-center border ${bg} ${border}`}>
      <Feather name={icon} size={18} color={color} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#0e0b0e]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <KeyboardAvoidingView 
        className="flex-1"
        behavior="padding"
      >
        {/* Top Bar */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-3 z-20">
          {renderIconBtn('menu', 'bg-white/5', 'white', 'border-white/10', () => (navigation as any).toggleDrawer())}
          <View className="items-center flex-1 mx-2">
            <Text className="text-[10px] tracking-widest uppercase text-[#8a8385] font-semibold">Generation</Text>
            <Text className="text-[15px] font-bold text-white mt-0.5">New generation</Text>
          </View>
          {renderIconBtn('plus', 'bg-[#ff6d29]', '#1a1210', 'border-white/25')}
        </View>

        <ScrollView className="flex-1 z-10" contentContainerStyle={{ paddingBottom: 300, paddingTop: 40 }}>
          {/* Empty State */}
          {!imageUrl && !loading && !errorText ? (
             <View className="items-center px-4 pt-10">
               <View className="w-[58px] h-[58px] rounded-full bg-[#ff6d29] shadow-[0_14px_30px_-10px_rgba(255,109,41,0.55)] border border-white/20 mb-6" />
               <Text className="text-[19px] font-bold text-white mb-3">Nothing generated yet</Text>
               <Text className="text-[13.5px] text-[#bababa] text-center max-w-[270px] leading-5 mb-6">
                 Write a prompt, attach references, or compose a layout in Reference Canvas to control where things go.
               </Text>
               
               <View className="flex-row flex-wrap justify-center gap-2">
                 {suggestions.map((text, i) => (
                   <TouchableOpacity key={i} onPress={() => setPrompt(text)} className="px-[13px] py-2 rounded-full bg-white/5 border border-white/10">
                     <Text className="text-xs font-medium text-[#bababa]">{text}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>
          ) : (
             <View className="px-4">
                {/* Status / Results */}
                {loading && (
                  <ImageSkeleton aspectRatio={aspectRatio} />
                )}
                {errorText && (
                  <Text className="text-red-500 text-center mt-3 text-sm font-medium">{errorText}</Text>
                )}
                {imageUrl && (
                  <View 
                    className="w-full mt-3 rounded-[22px] overflow-hidden bg-white/5 border border-white/10 p-2"
                    style={getAspectRatioStyle(aspectRatio)}
                  >
                    <Image source={{ uri: imageUrl }} className="w-full h-full rounded-[14px]" resizeMode="cover" />
                  </View>
                )}
                {activePrompt && (loading || imageUrl || errorText) && (
                  <View className="mt-3 p-4 bg-[#1c1618] border border-white/10 rounded-[20px]">
                    <View className="flex-row items-center gap-2 mb-1.5">
                      <Feather name="terminal" size={13} color="#ff6d29" />
                      <Text className="text-[10px] font-bold text-[#8a8385] uppercase tracking-widest">Prompt</Text>
                    </View>
                    <Text className="text-white text-[13.5px] font-medium leading-5">{activePrompt}</Text>
                  </View>
                )}
             </View>
          )}
        </ScrollView>

        {/* Bottom Prompt Bar */}
        <View className="px-3 pb-3 pt-2 z-30">
          <View className="bg-[#1c1618] border border-white/10 rounded-[30px] overflow-hidden">
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
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${model === m.name ? 'bg-[#ff6d29]/20 border-[#ffa15c]/50' : 'bg-white/5 border-white/10'}`}
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
                    onValueChange={setCanvasEnabled} 
                    trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#ff6d29' }} 
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
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${aspectRatio === ratio ? 'bg-[#ff6d29]/20 border-[#ffa15c]/50' : 'bg-white/5 border-white/10'}`}
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
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${quality === q.name ? 'bg-[#ff6d29]/20 border-[#ffa15c]/50' : 'bg-white/5 border-white/10'}`}
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
                    <Text className="text-[11px] font-semibold text-[#ff6d29]">Clear all</Text>
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
                <TextInput 
                  className="text-white text-[14px] font-medium max-h-[90px] min-h-[40px] py-2"
                  placeholder="Describe the shot, scene, or edit…"
                  placeholderTextColor="#8a8385"
                  multiline
                  value={prompt}
                  onChangeText={setPrompt}
                  style={{ textAlignVertical: 'center' }}
                />
              </View>
              
              <View className="flex-row items-center gap-2">
                <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => setExpanded(!expanded)}>
                  <Feather name={expanded ? "chevron-down" : "chevron-up"} size={24} color="#bababa" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={generateImage}
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-[#ff6d29] items-center justify-center shadow-[0_10px_24px_-8px_rgba(255,109,41,0.65)] border border-white/40"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#1a1210" />
                  ) : (
                    <Feather name="arrow-up" size={20} color="#1a1210" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}