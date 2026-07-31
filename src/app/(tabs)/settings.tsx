import { Text, View, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [haptics, setHaptics] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <AestheticBackdrop style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
      {/* Header */}
      <View className="py-4 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/40 items-center justify-center">
          <Feather name="settings" size={20} color="#b2ff59" />
        </View>
        <View>
          <Text className="text-white text-xl font-bold">Settings</Text>
          <Text className="text-[#8a8385] text-xs">Preferences & configuration</Text>
        </View>
      </View>

      {/* Main Glass Panel */}
      <View className="mt-4 p-5 rounded-[24px] bg-white/10 border border-white/20 shadow-2xl backdrop-blur-xl gap-4">
        <View className="flex-row items-center justify-between py-2 border-b border-white/10">
          <View>
            <Text className="text-white font-bold text-sm">Haptic Feedback</Text>
            <Text className="text-[#8a8385] text-xs mt-0.5">Vibrate on actions</Text>
          </View>
          <Switch 
            value={haptics} 
            onValueChange={setHaptics} 
            trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#b2ff59' }} 
            thumbColor="white"
          />
        </View>

        <View className="flex-row items-center justify-between py-2">
          <View>
            <Text className="text-white font-bold text-sm">Auto-Save Generations</Text>
            <Text className="text-[#8a8385] text-xs mt-0.5">Save completed prompts to history</Text>
          </View>
          <Switch 
            value={autoSave} 
            onValueChange={setAutoSave} 
            trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#b2ff59' }} 
            thumbColor="white"
          />
        </View>
      </View>
    </AestheticBackdrop>
  );
}