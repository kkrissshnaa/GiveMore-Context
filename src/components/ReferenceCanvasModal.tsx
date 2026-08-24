/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  LayoutChangeEvent,
  StyleSheet,
  Keyboard,
  ScrollView,
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { RealisticGlassButton } from './RealisticGlassButton';

const dismissKeyboard = () => {
  Keyboard.dismiss();
};

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
  isSelected: boolean;
  onSelect: () => void;
  onUpdateRegion: (updated: CanvasRegion) => void;
  onRemoveRegion: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

let nextRegionId = 0;
const generateRegionId = () => `region_${Date.now()}_${++nextRegionId}`;

function RegionItem({
  region,
  index,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onUpdateRegion,
  onRemoveRegion,
  onBringToFront,
  onSendToBack,
}: RegionItemProps) {
  const posX = useSharedValue(region.x);
  const posY = useSharedValue(region.y);
  const posW = useSharedValue(region.width);
  const posH = useSharedValue(region.height);

  const startPosX = useSharedValue(region.x);
  const startPosY = useSharedValue(region.y);
  const startPosW = useSharedValue(region.width);
  const startPosH = useSharedValue(region.height);

  const onUpdateRef = useRef(onUpdateRegion);
  const regionRef = useRef(region);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onUpdateRef.current = onUpdateRegion;
    regionRef.current = region;
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    posX.value = region.x;
    posY.value = region.y;
    posW.value = region.width;
    posH.value = region.height;
  }, [region.x, region.y, region.width, region.height, posX, posY, posW, posH]);

  const commitUpdate = useCallback((x: number, y: number, w: number, h: number) => {
    onUpdateRef.current({
      ...regionRef.current,
      x,
      y,
      width: w,
      height: h,
    });
  }, []);

  const triggerSelectJS = useCallback(() => {
    onSelectRef.current();
  }, []);

  // Move Gesture (Pan inside region)
  const moveGesture = React.useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        'worklet';
        runOnJS(dismissKeyboard)();
        runOnJS(triggerSelectJS)();
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
  }, [canvasWidth, canvasHeight, commitUpdate, triggerSelectJS]);

  // Resize Gesture (Pan on bottom-right handle)
  const resizeGesture = React.useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        'worklet';
        runOnJS(dismissKeyboard)();
        runOnJS(triggerSelectJS)();
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
  }, [canvasWidth, canvasHeight, commitUpdate, triggerSelectJS]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: `${posX.value}%`,
    top: `${posY.value}%`,
    width: `${posW.value}%`,
    height: `${posH.value}%`,
    zIndex: isSelected ? 100 : index + 10,
  }));

  return (
    <GestureDetector gesture={moveGesture}>
      <Animated.View
        collapsable={false}
        style={animatedStyle}
        className={`rounded-[16px] border-[1.5px] p-2 justify-between ${
          isSelected
            ? 'border-[#E5FF1F] bg-[#E5FF1F]/30 shadow-[0_0_20px_rgba(229,255,31,0.5)]'
            : 'border-white/40 bg-black/60 shadow-md'
        }`}
      >
        {/* Region Header: Badge & Delete Button */}
        <View className="flex-row items-center justify-between z-20">
          <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.7}
            className={`w-5 h-5 rounded-full items-center justify-center shadow-md border ${
              isSelected ? 'bg-[#E5FF1F] border-white/60' : 'bg-black/80 border-white/30'
            }`}
          >
            <Text className={`text-[10px] font-bold font-mono ${isSelected ? 'text-[#0b1405]' : 'text-white'}`}>
              {index + 1}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-1">
            {isSelected && (
              <>
                <TouchableOpacity
                  onPress={() => onBringToFront(region.id)}
                  className="w-5 h-5 rounded-full bg-black/80 border border-[#E5FF1F]/70 items-center justify-center"
                >
                  <Feather name="arrow-up" size={10} color="#E5FF1F" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onSendToBack(region.id)}
                  className="w-5 h-5 rounded-full bg-black/80 border border-white/40 items-center justify-center"
                >
                  <Feather name="arrow-down" size={10} color="white" />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => onRemoveRegion(region.id)}
              className="w-5 h-5 rounded-full bg-black/80 border border-white/40 items-center justify-center ml-0.5"
            >
              <Feather name="x" size={11} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Text Input for Region Description */}
        <View className="flex-1 mt-1 justify-start">
          <TextInput
            value={region.prompt}
            onFocus={onSelect}
            onChangeText={(text) => onUpdateRegion({ ...region, prompt: text })}
            placeholder="e.g. product bottle, warm light"
            placeholderTextColor="#ffffff"
            multiline
            className={`text-[11px] font-sans font-semibold p-0 leading-3.5 ${
              isSelected ? 'text-white font-bold' : 'text-white/80'
            }`}
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        {/* Resize Handle (Bottom-Right Corner) */}
        <GestureDetector gesture={resizeGesture}>
          <View className={`absolute bottom-1 right-1 w-6 h-6 items-center justify-center rounded-full border z-30 ${
            isSelected ? 'bg-[#E5FF1F] border-white/80' : 'bg-black/70 border-white/40'
          }`}>
            <Feather name="maximize-2" size={10} color={isSelected ? '#0b1405' : '#E5FF1F'} />
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
  const [prevVisible, setPrevVisible] = useState(visible);
  const [localRegions, setLocalRegions] = useState<CanvasRegion[]>(initialRegions || []);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(
    (initialRegions && initialRegions.length > 0) ? initialRegions[initialRegions.length - 1].id : null
  );
  const [canvasLayout, setCanvasLayout] = useState<{ width: number; height: number }>({ width: 300, height: 300 });

  if (prevVisible !== visible) {
    setPrevVisible(visible);
    if (visible) {
      const regs = initialRegions || [];
      setLocalRegions(regs);
      setSelectedRegionId(regs.length > 0 ? regs[regs.length - 1].id : null);
    }
  }

  // Reanimated Shared Values for active draw
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const currentX = useSharedValue(0);
  const currentY = useSharedValue(0);
  const isDrawing = useSharedValue(false);

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasLayout({ width, height });
    }
  };

  const addRegionFromGesture = useCallback((
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

    const newId = generateRegionId();
    const newRegion: CanvasRegion = {
      id: newId,
      x: percentX,
      y: percentY,
      width: percentW,
      height: percentH,
      prompt: '',
    };

    setLocalRegions((prev) => [...prev, newRegion]);
    setSelectedRegionId(newId);
  }, []);

  const handleDrawEnd = useCallback((sX: number, sY: number, cX: number, cY: number) => {
    addRegionFromGesture(sX, sY, cX, cY, canvasLayout.width, canvasLayout.height);
  }, [addRegionFromGesture, canvasLayout.width, canvasLayout.height]);

  const drawEndRef = useRef(handleDrawEnd);
  useEffect(() => {
    drawEndRef.current = handleDrawEnd;
  });

  const onDrawFinished = useCallback((sX: number, sY: number, cX: number, cY: number) => {
    drawEndRef.current(sX, sY, cX, cY);
  }, []);

  // Canvas Pan gesture for drawing new region
  const canvasDrawGesture = React.useMemo(() => {
    return Gesture.Pan()
      .onBegin(() => {
        'worklet';
        runOnJS(dismissKeyboard)();
      })
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
          runOnJS(onDrawFinished)(
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
  }, []);

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
    setLocalRegions((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      if (selectedRegionId === id) {
        setSelectedRegionId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
      }
      return remaining;
    });
  };

  const bringToFront = (id: string) => {
    setLocalRegions((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const target = prev[idx];
      const rest = prev.filter((r) => r.id !== id);
      return [...rest, target];
    });
    setSelectedRegionId(id);
  };

  const sendToBack = (id: string) => {
    setLocalRegions((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx <= 0) return prev;
      const target = prev[idx];
      const rest = prev.filter((r) => r.id !== id);
      return [target, ...rest];
    });
    setSelectedRegionId(id);
  };

  const clearAll = () => {
    setLocalRegions([]);
    setSelectedRegionId(null);
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
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 pr-4">
                <Text className="text-[20px] font-bold text-white mb-0.5">
                  Reference Canvas
                </Text>
                <Text className="text-[12.5px] text-[#E5FF1F] leading-4">
                  Drag to draw layered objects. Tap a layer number to select & edit overlapping objects.
                </Text>
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

            {/* Layer Selector Bar */}
            {localRegions.length > 0 && (
              <View className="w-full my-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {localRegions.map((region, idx) => {
                    const isSelected = region.id === selectedRegionId;
                    return (
                      <TouchableOpacity
                        key={region.id}
                        onPress={() => setSelectedRegionId(region.id)}
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                          isSelected
                            ? 'bg-[#E5FF1F] border-[#E5FF1F] shadow-[0_0_12px_rgba(229,255,31,0.4)]'
                            : 'bg-white/10 border-white/20'
                        }`}
                      >
                        <View className={`w-4 h-4 rounded-full items-center justify-center ${isSelected ? 'bg-[#0b1405]' : 'bg-white/20'}`}>
                          <Text className={`text-[9px] font-bold font-mono ${isSelected ? 'text-[#E5FF1F]' : 'text-white'}`}>
                            {idx + 1}
                          </Text>
                        </View>
                        <Text
                          className={`text-[11.5px] font-medium font-sans max-w-[110px] ${isSelected ? 'text-[#0b1405] font-bold' : 'text-white'}`}
                          numberOfLines={1}
                        >
                          {region.prompt.trim() || `Object ${idx + 1}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Dynamic Aspect Ratio Canvas Container */}
            <View className="w-full items-center my-2">
              <View
                onLayout={onCanvasLayout}
                className="w-full rounded-[24px] bg-[#181315] border border-white/15 overflow-hidden relative justify-center items-center"
                style={{
                  aspectRatio: getCanvasAspectRatio(),
                  maxHeight: aspectRatio === '9:16' ? 340 : 300,
                }}
              >
                {/* Layer 1: Drawing Gesture Background */}
                <GestureDetector gesture={canvasDrawGesture}>
                  <View collapsable={false} style={StyleSheet.absoluteFill} className="w-full h-full">
                    {/* Subtle Grid Dot Background */}
                    <View style={StyleSheet.absoluteFill} className="opacity-15 flex-row flex-wrap justify-between p-3">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <View key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 m-2" />
                      ))}
                    </View>

                    {/* Live Drawing Rectangle Preview */}
                    <Animated.View
                      style={[
                        drawingBoxStyle,
                        {
                          position: 'absolute',
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: '#E5FF1F',
                          borderStyle: 'dashed',
                          backgroundColor: 'rgba(229, 255, 31, 0.25)',
                          zIndex: 200,
                        },
                      ]}
                    />

                    {/* Empty State Overlay */}
                    {localRegions.length === 0 && (
                      <View className="absolute inset-0 items-center justify-center p-4 pointer-events-none">
                        <Feather name="edit-3" size={24} color="rgba(229, 255, 31, 0.6)" />
                        <Text className="text-white/40 text-xs font-sans font-semibold mt-2 text-center">
                          Touch & drag anywhere to draw a region
                        </Text>
                      </View>
                    )}
                  </View>
                </GestureDetector>

                {/* Layer 2: Interactive Regions Overlay */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                  {localRegions.map((region, idx) => (
                    <RegionItem
                      key={region.id}
                      region={region}
                      index={idx}
                      canvasWidth={canvasLayout.width}
                      canvasHeight={canvasLayout.height}
                      isSelected={region.id === selectedRegionId}
                      onSelect={() => setSelectedRegionId(region.id)}
                      onUpdateRegion={handleUpdateRegion}
                      onRemoveRegion={handleRemoveRegion}
                      onBringToFront={bringToFront}
                      onSendToBack={sendToBack}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Footer Action Bar */}
            <View className="flex-row items-center justify-between pt-4 mt-2 border-t border-white/10">
              <RealisticGlassButton
                onPress={clearAll}
                variant="glass"
                borderRadius={14}
                showGlint={false}
                contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text className="text-[13px] font-medium text-[#bababa] font-sans">
                  Clear all
                </Text>
              </RealisticGlassButton>

              <Text className="text-[12.5px] font-semibold text-[#E5FF1F] font-mono">
                {localRegions.length} {localRegions.length === 1 ? 'object' : 'objects'}
              </Text>

              <RealisticGlassButton
                onPress={handleDone}
                variant="lime"
                size={{ height: 42 }}
                borderRadius={21}
                showGlint={false}
                contentStyle={{ paddingHorizontal: 22, height: '100%', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-[13.5px] font-bold text-[#0b1405] font-display">
                  Done
                </Text>
              </RealisticGlassButton>
            </View>

          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
