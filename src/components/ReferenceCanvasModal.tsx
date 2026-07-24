import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export interface CanvasRegion {
  id: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
  prompt: string;
}

interface ReferenceCanvasModalProps {
  visible: boolean;
  onClose: () => void;
  aspectRatio: string;
  regions: CanvasRegion[];
  onSaveRegions: (regions: CanvasRegion[]) => void;
}

interface RegionItemProps {
  region: CanvasRegion;
  index: number;
  canvasWidth: number;
  canvasHeight: number;
  onUpdateRegion: (updated: CanvasRegion) => void;
  onRemoveRegion: (id: string) => void;
}

function RegionItem({
  region,
  index,
  canvasWidth,
  canvasHeight,
  onUpdateRegion,
  onRemoveRegion,
}: RegionItemProps) {
  const posX = useSharedValue(region.x);
  const posY = useSharedValue(region.y);
  const posW = useSharedValue(region.width);
  const posH = useSharedValue(region.height);

  const startPosX = useSharedValue(region.x);
  const startPosY = useSharedValue(region.y);
  const startPosW = useSharedValue(region.width);
  const startPosH = useSharedValue(region.height);

  useEffect(() => {
    posX.value = region.x;
    posY.value = region.y;
    posW.value = region.width;
    posH.value = region.height;
  }, [region.x, region.y, region.width, region.height]);

  const commitUpdate = (x: number, y: number, w: number, h: number) => {
    onUpdateRegion({
      ...region,
      x,
      y,
      width: w,
      height: h,
    });
  };

  // Move Gesture (Pan inside region)
  const moveGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startPosX.value = posX.value;
      startPosY.value = posY.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (canvasWidth <= 0 || canvasHeight <= 0) return;
      const deltaXPercent = (e.translationX / canvasWidth) * 100;
      const deltaYPercent = (e.translationY / canvasHeight) * 100;

      const maxX = 100 - posW.value;
      const maxY = 100 - posH.value;

      posX.value = Math.max(0, Math.min(maxX, startPosX.value + deltaXPercent));
      posY.value = Math.max(0, Math.min(maxY, startPosY.value + deltaYPercent));
    })
    .onEnd(() => {
      'worklet';
      runOnJS(commitUpdate)(
        posX.value,
        posY.value,
        posW.value,
        posH.value
      );
    });

  // Resize Gesture (Pan on bottom-right handle)
  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startPosW.value = posW.value;
      startPosH.value = posH.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (canvasWidth <= 0 || canvasHeight <= 0) return;
      const deltaWPercent = (e.translationX / canvasWidth) * 100;
      const deltaHPercent = (e.translationY / canvasHeight) * 100;

      const maxW = 100 - posX.value;
      const maxH = 100 - posY.value;

      posW.value = Math.max(15, Math.min(maxW, startPosW.value + deltaWPercent));
      posH.value = Math.max(15, Math.min(maxH, startPosH.value + deltaHPercent));
    })
    .onEnd(() => {
      'worklet';
      runOnJS(commitUpdate)(
        posX.value,
        posY.value,
        posW.value,
        posH.value
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: `${posX.value}%`,
    top: `${posY.value}%`,
    width: `${posW.value}%`,
    height: `${posH.value}%`,
  }));

  return (
    <GestureDetector gesture={moveGesture}>
      <Animated.View
        style={animatedStyle}
        className="rounded-[16px] border-[1.5px] border-[#ff6d29] bg-[#ff6d29]/20 p-2 justify-between z-10"
      >
        {/* Region Header: Badge & Delete Button */}
        <View className="flex-row items-center justify-between z-20">
          <View className="w-5 h-5 rounded-full bg-[#ff6d29] items-center justify-center shadow-md">
            <Text className="text-[10px] font-bold text-black">{index + 1}</Text>
          </View>

          <TouchableOpacity
            onPress={() => onRemoveRegion(region.id)}
            className="w-5 h-5 rounded-full bg-black/70 border border-white/40 items-center justify-center"
          >
            <Feather name="x" size={11} color="white" />
          </TouchableOpacity>
        </View>

        {/* Text Input for Region Description */}
        <View className="flex-1 mt-1 justify-start">
          <TextInput
            value={region.prompt}
            onChangeText={(text) => onUpdateRegion({ ...region, prompt: text })}
            placeholder="e.g. product bottle, warm light"
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            multiline
            className="text-white text-[11px] font-semibold p-0 leading-3.5"
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        {/* Resize Handle (Bottom-Right Corner) */}
        <GestureDetector gesture={resizeGesture}>
          <View className="absolute bottom-1 right-1 w-6 h-6 items-center justify-center bg-black/60 rounded-full border border-[#ff6d29]/80 z-30">
            <Feather name="maximize-2" size={10} color="#ff6d29" />
          </View>
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
}

export function ReferenceCanvasModal({
  visible,
  onClose,
  aspectRatio,
  regions: initialRegions,
  onSaveRegions,
}: ReferenceCanvasModalProps) {
  const [localRegions, setLocalRegions] = useState<CanvasRegion[]>(initialRegions || []);
  const [canvasLayout, setCanvasLayout] = useState<{ width: number; height: number }>({ width: 300, height: 300 });

  // Reanimated Shared Values for active draw
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const currentX = useSharedValue(0);
  const currentY = useSharedValue(0);
  const isDrawing = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      setLocalRegions(initialRegions || []);
    }
  }, [visible, initialRegions]);

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasLayout({ width, height });
    }
  };

  const addRegionFromGesture = (
    sX: number,
    sY: number,
    cX: number,
    cY: number,
    cW: number,
    cH: number
  ) => {
    if (cW <= 0 || cH <= 0) return;
    const minW = 35;
    const minH = 35;

    const absW = Math.max(Math.abs(cX - sX), minW);
    const absH = Math.max(Math.abs(cY - sY), minH);
    const topX = Math.min(sX, cX);
    const topY = Math.min(sY, cY);

    const percentX = Math.max(0, Math.min(100, (topX / cW) * 100));
    const percentY = Math.max(0, Math.min(100, (topY / cH) * 100));
    const percentW = Math.min(100 - percentX, (absW / cW) * 100);
    const percentH = Math.min(100 - percentY, (absH / cH) * 100);

    const newRegion: CanvasRegion = {
      id: `region_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x: percentX,
      y: percentY,
      width: percentW,
      height: percentH,
      prompt: '',
    };

    setLocalRegions((prev) => [...prev, newRegion]);
  };

  const handleDrawEnd = (sX: number, sY: number, cX: number, cY: number) => {
    addRegionFromGesture(sX, sY, cX, cY, canvasLayout.width, canvasLayout.height);
  };

  // Canvas Pan gesture for drawing new region
  const canvasDrawGesture = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      startX.value = e.x;
      startY.value = e.y;
      currentX.value = e.x;
      currentY.value = e.y;
      isDrawing.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      currentX.value = e.x;
      currentY.value = e.y;
    })
    .onEnd(() => {
      'worklet';
      if (isDrawing.value) {
        isDrawing.value = false;
        runOnJS(handleDrawEnd)(
          startX.value,
          startY.value,
          currentX.value,
          currentY.value
        );
      }
    })
    .onFinalize(() => {
      'worklet';
      isDrawing.value = false;
    });

  const drawingBoxStyle = useAnimatedStyle(() => {
    if (!isDrawing.value) {
      return { opacity: 0, width: 0, height: 0 };
    }
    const left = Math.min(startX.value, currentX.value);
    const top = Math.min(startY.value, currentY.value);
    const width = Math.abs(currentX.value - startX.value);
    const height = Math.abs(currentY.value - startY.value);

    return {
      opacity: 1,
      left,
      top,
      width,
      height,
    };
  });

  const handleUpdateRegion = (updated: CanvasRegion) => {
    setLocalRegions((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleRemoveRegion = (id: string) => {
    setLocalRegions((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = () => {
    setLocalRegions([]);
  };

  const handleDone = () => {
    onSaveRegions(localRegions);
    onClose();
  };

  const getCanvasAspectRatio = () => {
    switch (aspectRatio) {
      case '16:9': return 16 / 9;
      case '4:5': return 4 / 5;
      case '9:16': return 9 / 16;
      case '1:1':
      default:
        return 1;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#120d0f] rounded-t-[32px] border-t border-white/10 p-5 pb-8 max-h-[92%] flex-col">
            
            {/* Header */}
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 pr-4">
                <Text className="text-[20px] font-bold text-white mb-0.5">
                  Reference Canvas
                </Text>
                <Text className="text-[12.5px] text-[#8a8385] leading-4">
                  Drag to draw an area, then drag to move or scale objects.
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/10"
              >
                <Feather name="x" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* Dynamic Aspect Ratio Canvas Container */}
            <View className="w-full items-center my-2">
              <GestureDetector gesture={canvasDrawGesture}>
                <View
                  onLayout={onCanvasLayout}
                  className="w-full rounded-[24px] bg-[#181315] border border-white/15 overflow-hidden relative justify-center items-center"
                  style={{
                    aspectRatio: getCanvasAspectRatio(),
                    maxHeight: aspectRatio === '9:16' ? 360 : 320,
                  }}
                >
                  {/* Subtle Grid Dot Background */}
                  <View style={StyleSheet.absoluteFill} className="opacity-15 flex-row flex-wrap justify-between p-3">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <View key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 m-2" />
                    ))}
                  </View>

                  {/* Render Existing Drawn Regions with Move & Scale Gestures */}
                  {localRegions.map((region, idx) => (
                    <RegionItem
                      key={region.id}
                      region={region}
                      index={idx}
                      canvasWidth={canvasLayout.width}
                      canvasHeight={canvasLayout.height}
                      onUpdateRegion={handleUpdateRegion}
                      onRemoveRegion={handleRemoveRegion}
                    />
                  ))}

                  {/* Live Drawing Rectangle Preview */}
                  <Animated.View
                    style={[
                      drawingBoxStyle,
                      {
                        position: 'absolute',
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: '#ff6d29',
                        borderStyle: 'dashed',
                        backgroundColor: 'rgba(255, 109, 41, 0.25)',
                        zIndex: 30,
                      },
                    ]}
                  />

                  {/* Empty State Overlay */}
                  {localRegions.length === 0 && (
                    <View className="absolute inset-0 items-center justify-center p-4 pointer-events-none">
                      <Feather name="edit-3" size={24} color="rgba(255, 109, 41, 0.5)" />
                      <Text className="text-white/40 text-xs font-semibold mt-2 text-center">
                        Touch & drag anywhere to draw a region
                      </Text>
                    </View>
                  )}
                </View>
              </GestureDetector>
            </View>

            {/* Footer Action Bar */}
            <View className="flex-row items-center justify-between pt-4 mt-2 border-t border-white/10">
              <TouchableOpacity onPress={clearAll} className="px-2 py-1">
                <Text className="text-[13.5px] font-medium text-[#bababa]">
                  Clear all
                </Text>
              </TouchableOpacity>

              <Text className="text-[12.5px] font-semibold text-[#8a8385]">
                {localRegions.length} {localRegions.length === 1 ? 'region' : 'regions'}
              </Text>

              <TouchableOpacity
                onPress={handleDone}
                className="px-6 py-2.5 rounded-full bg-[#ff6d29] shadow-lg shadow-[#ff6d29]/40 items-center justify-center border border-white/20"
              >
                <Text className="text-[13.5px] font-bold text-[#1a1210]">
                  Done
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
