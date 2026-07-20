import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Switch
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function index() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
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
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setReferenceImage(result.assets[0].uri);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

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
        body: JSON.stringify({ prompt, aspectRatio, referenceImage, model, quality }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);
      }
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorText(error.message || "Network request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderIconBtn = (icon: any, bg: string, color: string, border: string = 'border-white/10') => (
    <TouchableOpacity className={`w-10 h-10 rounded-full items-center justify-center border ${bg} ${border}`}>
      <Feather name={icon} size={18} color={color} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0e0b0e]">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Bar */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-3 z-20">
          {renderIconBtn('menu', 'bg-white/5', 'white')}
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
                  <View className="items-center mt-5">
                    <ActivityIndicator size="large" color="#ff6d29" />
                    <Text className="mt-3 text-[#bababa] text-sm font-medium">Generating Image...</Text>
                  </View>
                )}
                {errorText && (
                  <Text className="text-red-500 text-center mt-3 text-sm">{errorText}</Text>
                )}
                {imageUrl && (
                  <View className="w-full mt-3 rounded-[22px] overflow-hidden bg-white/5 border border-white/10 aspect-square p-2">
                    <Image source={{ uri: imageUrl }} className="w-full h-full rounded-[14px]" resizeMode="cover" />
                  </View>
                )}
             </View>
          )}
        </ScrollView>

        {/* Bottom Prompt Bar */}
        <View className="absolute bottom-0 left-0 right-0 px-3 pb-8 pt-2 z-30">
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

            {/* Main Prompt Row */}
            <View className="flex-row items-end px-3.5 py-3">
              <TouchableOpacity onPress={pickImage} className="w-[38px] h-[38px] rounded-[10px] border-[1.5px] border-dashed border-white/20 items-center justify-center bg-transparent mr-2.5 mb-0.5">
                {referenceImage ? (
                  <Image source={{ uri: referenceImage }} className="w-full h-full rounded-[8px]" resizeMode="cover" />
                ) : (
                  <Feather name="image" size={16} color="#bababa" />
                )}
              </TouchableOpacity>
              
              <View className="flex-1 justify-center mr-2">
                <TextInput 
                  className="text-white text-[14px] font-medium max-h-[90px] min-h-[38px] py-2"
                  placeholder="Describe the shot, scene, or edit…"
                  placeholderTextColor="#8a8385"
                  multiline
                  value={prompt}
                  onChangeText={setPrompt}
                  style={{ textAlignVertical: 'center' }}
                />
              </View>
              
              <View className="flex-row items-center gap-2">
                <TouchableOpacity className="w-[36px] h-[36px] items-center justify-center mb-0.5" onPress={() => setExpanded(!expanded)}>
                  <Feather name={expanded ? "chevron-down" : "chevron-up"} size={22} color="#bababa" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={generateImage}
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-[#ff6d29] items-center justify-center shadow-[0_10px_24px_-8px_rgba(255,109,41,0.65)] border border-white/40"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#1a1210" />
                  ) : (
                    <Feather name="arrow-up" size={18} color="#1a1210" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}