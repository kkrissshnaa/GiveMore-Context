import { Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';

export default function Folder() {
  const insets = useSafeAreaInsets();
  return (
    <AestheticBackdrop style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
      {/* Header */}
      <View className="py-4 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/40 items-center justify-center">
          <Feather name="folder" size={20} color="#b2ff59" />
        </View>
        <View>
          <Text className="text-white text-xl font-bold">Folders</Text>
          <Text className="text-[#8a8385] text-xs">Organize your saved generations</Text>
        </View>
      </View>

      {/* Main Glass Card */}
      <View className="mt-4 p-6 rounded-[24px] bg-white/10 border border-white/20 shadow-2xl backdrop-blur-xl items-center justify-center">
        <View className="w-14 h-14 rounded-full bg-[#b2ff59]/20 border border-[#b2ff59]/50 items-center justify-center mb-4">
          <Feather name="folder-plus" size={24} color="#b2ff59" />
        </View>
        <Text className="text-white font-bold text-lg text-center mb-2">No Folders Created</Text>
        <Text className="text-[#bababa] text-sm text-center mb-6 leading-5">
          Group generations into custom collections and projects.
        </Text>
        <TouchableOpacity className="px-6 py-2.5 rounded-full bg-[#b2ff59] shadow-lg shadow-[#b2ff59]/40">
          <Text className="text-[#0b1405] font-bold text-sm">Create New Folder</Text>
        </TouchableOpacity>
      </View>
    </AestheticBackdrop>
  );
}