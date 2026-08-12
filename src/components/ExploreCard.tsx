import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  onRemixPrompt?: (prompt: string, model: string) => void;
}

export function ExploreCard({
  item,
  isFlipped,
  onToggleFlip,
  onRemixPrompt,
}: ExploreCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [copied, setCopied] = useState(false);

  // 3D Flip Animation Value (0: Front, 1: Back)
  const flipAnim = useRef(new Animated.Value(isFlipped ? 1 : 0)).current;

  // Double Tap Heart Animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // React to prop changes so other cards revert back automatically
  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 25,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  // 3D Flip Interpolations
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
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
      onRemixPrompt(item.prompt, item.model);
    } else {
      router.push({
        pathname: '/',
        params: { prompt: item.prompt, model: item.model },
      });
    }
  };

  // Native Gestures: Double Tap to Like, Single Tap to Flip
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
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
        styles.cardWrapper,
        {
          aspectRatio: isFlipped ? undefined : item.numericRatio,
          minHeight: isFlipped ? 180 : undefined,
          width: '100%',
        },
      ]}
    >
      <View style={{ flex: 1, position: 'relative', width: '100%' }}>
        {/* FRONT FACE (CLEAN PINTEREST IMAGE WITH LIKE BADGE) */}
        <Animated.View
          pointerEvents={isFlipped ? 'none' : 'auto'}
          style={[
            styles.cardFace,
            {
              transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
              backfaceVisibility: 'hidden',
              zIndex: isFlipped ? 1 : 2,
            },
          ]}
        >
          <GestureDetector gesture={frontGestures}>
            <View style={styles.touchable}>
              <Image
                source={item.image}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
              />

              {/* Like Icon & Counter Pill Overlay at Bottom Right */}
              <View style={styles.likeBadgeContainer}>
                <TouchableOpacity
                  onPress={toggleHeartButton}
                  style={styles.likeBadge}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="heart"
                    size={13}
                    color={isLiked ? '#f43f5e' : '#ffffff'}
                    fill={isLiked ? '#f43f5e' : 'none'}
                  />
                  <Text
                    style={[
                      styles.likeCountText,
                      { color: isLiked ? '#f43f5e' : '#ffffff' },
                    ]}
                  >
                    {likesCount}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Animated Double-Tap Heart Overlay */}
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
                <Feather name="heart" size={54} color="#f43f5e" fill="#f43f5e" />
              </Animated.View>
            </View>
          </GestureDetector>
        </Animated.View>

        {/* BACK FACE (PROMPT, MODEL NAME, ASPECT RATIO) */}
        <Animated.View
          pointerEvents={isFlipped ? 'auto' : 'none'}
          style={[
            styles.cardFace,
            {
              transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
              backfaceVisibility: 'hidden',
              zIndex: isFlipped ? 2 : 1,
            },
          ]}
        >
          <GestureDetector gesture={backTapGesture}>
            <View style={styles.backContent}>
              {/* Top Header */}
              <View style={styles.backHeader}>
                <View style={styles.backHeaderTitle}>
                  <Feather name="zap" size={14} color="#b2ff59" />
                  <Text style={styles.backHeaderText}>{item.model}</Text>
                </View>
                <View style={styles.closeBtn}>
                  <Feather name="x" size={14} color="#ffffff" />
                </View>
              </View>

              {/* Prompt Text Box */}
              <View style={styles.promptBox}>
                <Text style={styles.promptLabel}>PROMPT</Text>
                <Text style={styles.promptText} numberOfLines={5}>
                  {`"${item.prompt}"`}
                </Text>
              </View>

              {/* Specs Row */}
              <View style={styles.specsRow}>
                <View style={styles.specBadgeHighlight}>
                  <Text style={styles.specLabel}>Model:</Text>
                  <Text style={styles.specValueGreen}>{item.model}</Text>
                </View>
                <View style={styles.specBadge}>
                  <Text style={styles.specLabel}>Ratio:</Text>
                  <Text style={styles.specValue}>{item.aspectRatio}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleCopyPrompt}
                  style={[styles.btnCopy, copied && styles.btnCopyActive]}
                >
                  <Feather
                    name={copied ? 'check' : 'copy'}
                    size={13}
                    color={copied ? '#b2ff59' : '#ffffff'}
                  />
                  <Text style={[styles.btnCopyText, copied && { color: '#b2ff59' }]}>
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRemix} style={styles.btnRemix}>
                  <Feather name="corner-up-right" size={13} color="#0b1405" />
                  <Text style={styles.btnRemixText}>Use</Text>
                </TouchableOpacity>
              </View>
            </View>
          </GestureDetector>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0a110a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    borderRadius: 16,
  },
  likeBadgeContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 5,
  },
  likeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  likeCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.3,
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -27,
    marginLeft: -27,
    zIndex: 10,
  },
  backContent: {
    flex: 1,
    padding: 10,
    backgroundColor: '#070f08',
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 6,
  },
  backHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backHeaderText: {
    color: '#b2ff59',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptBox: {
    marginVertical: 6,
    padding: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    justifyContent: 'center',
  },
  promptLabel: {
    color: '#b2ff59',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 3,
    fontFamily: HELVETICA_BOLD,
  },
  promptText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '400',
    fontFamily: HELVETICA_FONT,
    lineHeight: 16.5,
    letterSpacing: -0.1,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  specBadgeHighlight: {
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specLabel: {
    color: '#9ca3af',
    fontSize: 9.5,
    fontFamily: HELVETICA_FONT,
  },
  specValueGreen: {
    color: '#b2ff59',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  specValue: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnCopy: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  btnCopyActive: {
    backgroundColor: 'rgba(178, 255, 89, 0.2)',
    borderColor: '#b2ff59',
  },
  btnCopyText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.3,
  },
  btnRemix: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#b2ff59',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  btnRemixText: {
    color: '#0b1405',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.3,
  },
});
