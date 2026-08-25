import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Platform,
  Image as RNImage,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { RealisticGlassButton } from './RealisticGlassButton';
import { ExploreItem } from '../data/exploreData';

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

interface ExploreCardProps {
  item: ExploreItem;
  isFlipped: boolean;
  onToggleFlip: () => void;
  onRemixPrompt?: (prompt: string, model: string, aspectRatio?: string) => void;
  overrideAspectRatio?: number;
}

export const ExploreCard = memo(function ExploreCard({
  item,
  isFlipped,
  onToggleFlip,
  onRemixPrompt,
  overrideAspectRatio,
}: ExploreCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [copied, setCopied] = useState(false);

  // Dynamically resolve ratio
  const assetSource = RNImage.resolveAssetSource(item.image);
  const detectedRatio =
    assetSource && assetSource.width && assetSource.height
      ? assetSource.width / assetSource.height
      : item.numericRatio;
  const effectiveRatio = overrideAspectRatio ?? detectedRatio;

  // 3D Flip Animation Value (0: Front, 1: Back)
  const flipAnim = useRef(new Animated.Value(isFlipped ? 1 : 0)).current;

  // Double Tap Heart Animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Spring animation when isFlipped changes
  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, flipAnim]);

  // 3D Flip Interpolations
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // Crossfade opacity to avoid flicker
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.48, 0.52, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.48, 0.52, 1],
    outputRange: [0, 0, 1, 1],
  });

  const triggerHeartPop = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.25,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 750,
        delay: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDoubleTapLike = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
    triggerHeartPop();
  };

  const toggleHeartButton = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      triggerHeartPop();
    }
  };

  const handleCopyPrompt = async () => {
    await Clipboard.setStringAsync(item.prompt);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleRemix = () => {
    if (onRemixPrompt) {
      onRemixPrompt(item.prompt, item.model, item.aspectRatio);
    } else {
      router.push({
        pathname: '/',
        params: { prompt: item.prompt, model: item.model, aspectRatio: item.aspectRatio },
      });
    }
  };

  // Native Gestures: Double Tap to Like, Single Tap to Flip
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .runOnJS(true)
    .onEnd(handleDoubleTapLike);

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .runOnJS(true)
    .onEnd(onToggleFlip);

  const frontGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  const backTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .runOnJS(true)
    .onEnd(onToggleFlip);

  return (
    <View
      style={[
        styles.cardOuterGlowContainer,
        {
          aspectRatio: effectiveRatio,
          width: '100%',
        },
      ]}
    >
      <View style={styles.cardInnerContainer}>
        {/* FRONT FACE */}
        <Animated.View
          pointerEvents={isFlipped ? 'none' : 'auto'}
          style={[
            styles.cardFace,
            {
              transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
              opacity: frontOpacity,
              zIndex: isFlipped ? 1 : 2,
            },
          ]}
        >
          <GestureDetector gesture={frontGestures}>
            <View style={styles.touchable}>
              <Image
                source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
              />

              {/* Model Name on Top Left of Image */}
              <View style={styles.modelBadgeTopLeft} pointerEvents="none">
                <Feather name="zap" size={10} color="#E5FF1F" />
                <Text style={styles.modelBadgeText} numberOfLines={1}>
                  {item.model}
                </Text>
              </View>

              {/* Translucent Glass UI Like Button at Bottom Right */}
              <View style={styles.likeBadgeContainer}>
                <RealisticGlassButton
                  onPress={toggleHeartButton}
                  variant="glass"
                  tintColor="rgba(0, 0, 0, 0.48)"
                  borderRadius={14}
                  showGlint={false}
                  contentStyle={styles.glassLikeBtnContent}
                >
                  <Feather
                    name="heart"
                    size={11.5}
                    color={isLiked ? '#E5FF1F' : '#ffffff'}
                    fill={isLiked ? '#E5FF1F' : 'none'}
                  />
                  <Text style={styles.likeCountText}>
                    {likesCount}
                  </Text>
                </RealisticGlassButton>
              </View>

              {/* Animated Double-Tap Heart Overlay (Green Glow Pop) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heartOverlay,
                  {
                    transform: [{ scale: heartScale }],
                    opacity: heartOpacity,
                  },
                ]}
              >
                <Feather name="heart" size={56} color="#E5FF1F" fill="#E5FF1F" />
              </Animated.View>
            </View>
          </GestureDetector>
        </Animated.View>

        {/* BACK FACE (CLEANLY ALIGNED COPY & USE BUTTONS) */}
        <Animated.View
          pointerEvents={isFlipped ? 'auto' : 'none'}
          style={[
            styles.cardFace,
            {
              transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
              opacity: backOpacity,
              zIndex: isFlipped ? 2 : 1,
            },
          ]}
        >
          <GestureDetector gesture={backTapGesture}>
            <View style={styles.backContent}>
              {/* Back Top Header */}
              <View style={styles.backHeader}>
                <View style={styles.backHeaderTitle}>
                  <Feather name="zap" size={12} color="#E5FF1F" />
                  <Text style={styles.backHeaderText} numberOfLines={1}>
                    {item.model}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onToggleFlip}
                  style={styles.backCloseBtn}
                >
                  <Feather name="x" size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Properly Aligned Centered Action CTA Buttons */}
              <View style={styles.ctaCenterContainer}>
                <View style={styles.ctaRow}>
                  {/* Copy Button */}
                  <View style={{ flex: 1 }}>
                    <RealisticGlassButton
                      onPress={handleCopyPrompt}
                      variant={copied ? 'lime' : 'glass'}
                      borderRadius={12}
                      showGlint={false}
                      contentStyle={styles.actionBtnContent}
                    >
                      <Feather
                        name={copied ? 'check' : 'copy'}
                        size={13}
                        color={copied ? '#0b1405' : '#ffffff'}
                      />
                      <Text
                        style={[
                          styles.btnCopyText,
                          copied && { color: '#0b1405' },
                        ]}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Text>
                    </RealisticGlassButton>
                  </View>

                  {/* Use Button */}
                  <View style={{ flex: 1 }}>
                    <RealisticGlassButton
                      onPress={handleRemix}
                      variant="lime"
                      borderRadius={12}
                      showGlint={false}
                      contentStyle={styles.actionBtnContent}
                    >
                      <Feather name="corner-up-right" size={13} color="#0b1405" />
                      <Text style={styles.btnRemixText}>Use</Text>
                    </RealisticGlassButton>
                  </View>
                </View>
              </View>

              {/* Back Bottom Hint */}
              <View style={styles.backBottomRow}>
                <Text style={styles.backBottomHint}>Tap to flip back</Text>
              </View>
            </View>
          </GestureDetector>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardOuterGlowContainer: {
    position: 'relative',
    borderRadius: 16,
    // Subtle green glow on the image border
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.32)',
    shadowColor: '#E5FF1F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: '#091009',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 12px rgba(229, 255, 31, 0.22), inset 0 0 0 1px rgba(229, 255, 31, 0.32)',
        } as any)
      : {}),
  },
  cardInnerContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#091009',
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  touchable: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  modelBadgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 7.5,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: '75%',
    zIndex: 5,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
  },
  modelBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  likeBadgeContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 5,
  },
  glassLikeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeCountText: {
    color: '#E5FF1F', // Neon green like count text
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -28,
    marginLeft: -28,
    zIndex: 10,
  },
  backContent: {
    flex: 1,
    padding: 10,
    backgroundColor: '#070f08',
    borderRadius: 15,
    justifyContent: 'space-between',
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 255, 31, 0.12)',
  },
  backHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingRight: 6,
  },
  backHeaderText: {
    color: '#E5FF1F',
    fontSize: 11.5,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.3,
  },
  backCloseBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  actionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  btnCopyText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  btnRemixText: {
    color: '#0b1405',
    fontSize: 11.5,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  backBottomRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  backBottomHint: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
    fontFamily: HELVETICA_FONT,
    letterSpacing: -0.1,
  },
});
