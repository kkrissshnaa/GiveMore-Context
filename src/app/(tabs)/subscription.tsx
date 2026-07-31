import { Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';

export default function Subscription() {
  const insets = useSafeAreaInsets();
  return (
    <AestheticBackdrop style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
      {/* Header */}
      <View className="py-4 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/40 items-center justify-center">
          <Feather name="star" size={20} color="#b2ff59" />
        </View>
        <View>
          <Text className="text-white text-xl font-bold">Subscription</Text>
          <Text className="text-[#8a8385] text-xs">Pro Membership Plan</Text>
        </View>
      </View>

      {/* Main Glass Card */}
      <View className="mt-4 p-6 rounded-[24px] bg-white/10 border border-white/20 shadow-2xl backdrop-blur-xl items-center justify-center">
        <View className="w-14 h-14 rounded-full bg-[#b2ff59] items-center justify-center shadow-[0_0_30px_rgba(178,255,89,0.5)] mb-4">
          <Feather name="zap" size={26} color="#0b1405" />
        </View>
        <View className="px-3 py-1 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/40 mb-2">
          <Text className="text-[#b2ff59] font-bold text-xs uppercase tracking-widest">Active Plan</Text>
        </View>
        <Text className="text-white font-bold text-2xl text-center mb-1">Pro Unlimited</Text>
        <Text className="text-[#bababa] text-sm text-center mb-6 leading-5">
          Enjoy unlimited generations, fast quality rendering, and Reference Canvas access.
        </Text>
        <TouchableOpacity className="px-6 py-2.5 rounded-full bg-[#b2ff59] shadow-lg shadow-[#b2ff59]/40">
          <Text className="text-[#0b1405] font-bold text-sm">Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    </AestheticBackdrop>
  );
}