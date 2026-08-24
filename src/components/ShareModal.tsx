import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RealisticGlassButton } from './RealisticGlassButton';
import { downloadAndSaveImage, shareImageToApps } from '../lib/imageActions';
import { publishItemToExplore } from '../lib/exploreService';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string | null;
  prompt: string;
  model: string;
  aspectRatio: string;
}

export function ShareModal({
  visible,
  onClose,
  imageUrl,
  prompt,
  model,
  aspectRatio,
}: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingApp, setIsSharingApp] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!imageUrl) return null;

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setStatusMessage(null);
    try {
      const res = await downloadAndSaveImage(imageUrl);
      showStatus(res.success ? 'success' : 'error', res.message);
    } catch (err: any) {
      showStatus('error', err?.message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareApp = async () => {
    setIsSharingApp(true);
    setStatusMessage(null);
    try {
      const res = await shareImageToApps(imageUrl, prompt);
      if (!res.success && res.message) {
        showStatus('error', res.message);
      }
    } catch (err: any) {
      showStatus('error', err?.message || 'Sharing failed');
    } finally {
      setIsSharingApp(false);
    }
  };

  const handlePublishConfirm = async () => {
    if (!isPublic) {
      showStatus('success', 'Kept private in your history.');
      setTimeout(() => {
        onClose();
      }, 1000);
      return;
    }

    setIsPublishing(true);
    try {
      await publishItemToExplore({
        imageUrl,
        prompt,
        model,
        aspectRatio,
      });
      showStatus('success', 'Published to Explore page! 🎉');
      setTimeout(() => {
        setIsPublishing(false);
        onClose();
      }, 1200);
    } catch {
      setIsPublishing(false);
      showStatus('error', 'Failed to publish to Explore feed.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-[#0e160e] rounded-t-[32px] border-t border-white/15 p-5 pb-8 max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-[#E5FF1F]/20 items-center justify-center border border-[#E5FF1F]/40">
                <Feather name="share-2" size={16} color="#E5FF1F" />
              </View>
              <Text className="text-[19px] font-bold text-white font-display">Share & Export</Text>
            </View>

            <RealisticGlassButton
              onPress={onClose}
              variant="glass"
              size={36}
              borderRadius={18}
              showGlint={false}
            >
              <Feather name="x" size={18} color="white" />
            </RealisticGlassButton>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image Preview & Details */}
            <View className="flex-row gap-3 bg-white/5 border border-white/10 p-3 rounded-[20px] mb-4 items-center">
              <View className="w-20 h-20 rounded-[14px] overflow-hidden bg-black border border-white/20 relative">
                <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <View className="px-2 py-0.5 rounded-full bg-[#E5FF1F]/20 border border-[#E5FF1F]/40">
                    <Text className="text-[10px] font-bold text-[#E5FF1F] font-mono">{model}</Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                    <Text className="text-[10px] font-bold text-white/80 font-mono">{aspectRatio}</Text>
                  </View>
                </View>

                <Text className="text-white/90 text-xs font-sans leading-4" numberOfLines={2}>
                  {prompt || 'Generated image'}
                </Text>
              </View>
            </View>

            {/* Status Feedback Toast */}
            {statusMessage && (
              <View
                className={`p-3 rounded-2xl mb-4 border flex-row items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-[#E5FF1F]/15 border-[#E5FF1F]/50'
                    : 'bg-red-500/20 border-red-500/40'
                }`}
              >
                <Feather
                  name={statusMessage.type === 'success' ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={statusMessage.type === 'success' ? '#E5FF1F' : '#f87171'}
                />
                <Text
                  className={`text-xs font-semibold flex-1 ${
                    statusMessage.type === 'success' ? 'text-[#E5FF1F]' : 'text-red-300'
                  }`}
                >
                  {statusMessage.text}
                </Text>
              </View>
            )}

            {/* Action Buttons: Direct App Share & Download */}
            <Text className="text-[10px] font-bold tracking-widest uppercase text-[#E5FF1F] mb-2 font-display">
              Export Options
            </Text>

            <View className="flex-row gap-3 mb-5">
              {/* Direct Share on Other Apps */}
              <RealisticGlassButton
                onPress={handleShareApp}
                disabled={isSharingApp}
                variant="lime"
                size={{ height: 48 }}
                borderRadius={24}
                showGlint={false}
                style={{ flex: 1 }}
                contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: '100%' }}
              >
                {isSharingApp ? (
                  <ActivityIndicator size="small" color="#0b1405" />
                ) : (
                  <>
                    <Feather name="send" size={16} color="#0b1405" />
                    <Text className="text-[13.5px] font-bold text-[#0b1405] font-display">Share to App</Text>
                  </>
                )}
              </RealisticGlassButton>

              {/* Download Image */}
              <RealisticGlassButton
                onPress={handleDownload}
                disabled={isDownloading}
                variant="glass"
                size={{ height: 48 }}
                borderRadius={24}
                showGlint={false}
                style={{ flex: 1 }}
                contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: '100%' }}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#E5FF1F" />
                ) : (
                  <>
                    <Feather name="download" size={16} color="#E5FF1F" />
                    <Text className="text-[13.5px] font-bold text-white font-display">Save to Gallery</Text>
                  </>
                )}
              </RealisticGlassButton>
            </View>

            {/* Public vs Private Community Visibility */}
            <Text className="text-[10px] font-bold tracking-widest uppercase text-[#E5FF1F] mb-2 font-display">
              Community Visibility
            </Text>

            <View className="gap-2.5 mb-5">
              {/* Public Option */}
              <TouchableOpacity
                onPress={() => setIsPublic(true)}
                activeOpacity={0.85}
                className={`p-3.5 rounded-[20px] border flex-row items-center justify-between ${
                  isPublic
                    ? 'bg-[#E5FF1F]/15 border-[#E5FF1F] shadow-[0_0_15px_rgba(229,255,31,0.2)]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className={`w-9 h-9 rounded-full items-center justify-center border ${
                    isPublic ? 'bg-[#E5FF1F] border-white/40' : 'bg-white/10 border-white/15'
                  }`}>
                    <Feather name="globe" size={18} color={isPublic ? '#0b1405' : '#bababa'} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-[14px] font-bold ${isPublic ? 'text-[#E5FF1F]' : 'text-white'}`}>
                        Public
                      </Text>
                      <View className="px-2 py-0.2 rounded-full bg-[#E5FF1F]/20">
                        <Text className="text-[9.5px] font-bold text-[#E5FF1F]">Explore Feed</Text>
                      </View>
                    </View>
                    <Text className="text-[11px] text-[#E5FF1F] mt-0.5 leading-3.5">
                      Push to Explore page feed for everyone to discover & remix.
                    </Text>
                  </View>
                </View>

                <View className={`w-5 h-5 rounded-full border items-center justify-center ${
                  isPublic ? 'border-[#E5FF1F] bg-[#E5FF1F]' : 'border-white/30'
                }`}>
                  {isPublic && <Feather name="check" size={12} color="#0b1405" />}
                </View>
              </TouchableOpacity>

              {/* Private Option */}
              <TouchableOpacity
                onPress={() => setIsPublic(false)}
                activeOpacity={0.85}
                className={`p-3.5 rounded-[20px] border flex-row items-center justify-between ${
                  !isPublic
                    ? 'bg-white/15 border-white/60'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className={`w-9 h-9 rounded-full items-center justify-center border ${
                    !isPublic ? 'bg-white border-white/40' : 'bg-white/10 border-white/15'
                  }`}>
                    <Feather name="lock" size={18} color={!isPublic ? '#0b1405' : '#bababa'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[14px] font-bold ${!isPublic ? 'text-white' : 'text-white/80'}`}>
                      Private
                    </Text>
                    <Text className="text-[11px] text-[#E5FF1F] mt-0.5 leading-3.5">
                      Keep in your personal generation history only. Do not push to Explore.
                    </Text>
                  </View>
                </View>

                <View className={`w-5 h-5 rounded-full border items-center justify-center ${
                  !isPublic ? 'border-white bg-white' : 'border-white/30'
                }`}>
                  {!isPublic && <Feather name="check" size={12} color="#0b1405" />}
                </View>
              </TouchableOpacity>
            </View>

            {/* Confirm Publish Button */}
            <RealisticGlassButton
              onPress={handlePublishConfirm}
              disabled={isPublishing}
              variant="lime"
              size={{ height: 52 }}
              borderRadius={26}
              showGlint={false}
              style={{ width: '100%' }}
              contentStyle={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#0b1405" />
              ) : (
                <Text className="text-[15px] font-bold text-[#0b1405] font-display">
                  {isPublic ? 'Publish to Explore Page 🚀' : 'Keep Private'}
                </Text>
              )}
            </RealisticGlassButton>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
