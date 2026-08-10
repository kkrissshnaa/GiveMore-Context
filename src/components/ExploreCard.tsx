import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ExploreItem } from '../data/exploreData';

interface ExploreCardProps {
  item: ExploreItem;
  onRemixPrompt?: (prompt: string, model: string) => void;
}

export function ExploreCard({ item, onRemixPrompt }: ExploreCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // 3D Flip Animation Value (0: Front, 1: Back)
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Double Tap Heart Animation Values
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Gesture refs for single vs double tap
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Flip Interpolations
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const flipCard = (toBack: boolean) => {
    Animated.spring(flipAnim, {
      toValue: toBack ? 1 : 0,
      friction: 8,
      tension: 25,
      useNativeDriver: true,
    }).start();
    setIsFlipped(toBack);
  };

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

  const handleImagePress = () => {
    // If card is already flipped to back, single tap flips it back to front
    if (isFlipped) {
      flipCard(false);
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      handleDoubleTapLike();
    } else {
      // Single tap candidate
      lastTapRef.current = now;
      tapTimerRef.current = setTimeout(() => {
        flipCard(true);
        tapTimerRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
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

  const isLandscape = item.aspectRatio === '16:9';
  const imageHeight = isLandscape ? 240 : 360;

  return (
    <View style={styles.cardContainer}>
      {/* Creator Header */}
      <View style={styles.header}>
        <View style={styles.creatorInfo}>
          <View
            style={[styles.avatar, { backgroundColor: item.creator.avatarColor }]}
          >
            <Text style={styles.avatarText}>{item.creator.initials}</Text>
          </View>
          <View>
            <Text style={styles.creatorName}>{item.creator.name}</Text>
            <Text style={styles.creatorHandle}>
              {item.creator.handle} · {item.createdAt}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsFollowing(!isFollowing)}
          style={[
            styles.followButton,
            isFollowing ? styles.followActive : styles.followInactive,
          ]}
        >
          <Text
            style={[
              styles.followText,
              { color: isFollowing ? '#b2ff59' : '#ffffff' },
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3D Flip Image Container */}
      <View style={{ height: imageHeight, position: 'relative', width: '100%' }}>
        {/* FRONT FACE (IMAGE) */}
        <Animated.View
          style={[
            styles.cardFace,
            {
              transform: [{ perspective: 1200 }, { rotateY: frontInterpolate }],
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={handleImagePress}
            style={styles.imageTouchable}
          >
            <Image
              source={item.image}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
            />

            {/* Model & Ratio Badge Top Left */}
            <View style={styles.topBadge}>
              <Feather name="zap" size={11} color="#b2ff59" />
              <Text style={styles.topBadgeTextModel}>{item.model}</Text>
              <Text style={styles.topBadgeDot}>·</Text>
              <Text style={styles.topBadgeTextRatio}>{item.aspectRatio}</Text>
            </View>

            {/* Tap Hint Bottom Left */}
            <View style={styles.bottomHint}>
              <Feather name="rotate-cw" size={11} color="#ffffff" />
              <Text style={styles.bottomHintText}>Tap image to view prompt</Text>
            </View>

            {/* Heart Pop Overlay */}
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
              <Feather name="heart" size={76} color="#f43f5e" fill="#f43f5e" />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* BACK FACE (PROMPT DETAILS) */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.backCardFace,
            {
              transform: [{ perspective: 1200 }, { rotateY: backInterpolate }],
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <View style={styles.backContent}>
            {/* Back Header */}
            <View style={styles.backHeader}>
              <View style={styles.backHeaderTitle}>
                <Feather name="terminal" size={15} color="#b2ff59" />
                <Text style={styles.backHeaderText}>GENERATION DETAILS</Text>
              </View>
              <TouchableOpacity
                onPress={() => flipCard(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={15} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Prompt Box */}
            <View style={styles.promptBox}>
              <Text style={styles.promptLabel}>PROMPT</Text>
              <Text style={styles.promptText} numberOfLines={isLandscape ? 4 : 7}>
                "{item.prompt}"
              </Text>
            </View>

            {/* Metadata Badges */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadgeHighlight}>
                <Text style={styles.metaBadgeLabel}>Model:</Text>
                <Text style={styles.metaBadgeValueGreen}>{item.model}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeLabel}>Ratio:</Text>
                <Text style={styles.metaBadgeValue}>{item.aspectRatio}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeLabel}>Res:</Text>
                <Text style={styles.metaBadgeValue}>{item.dimensions}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeLabel}>Seed:</Text>
                <Text style={styles.metaBadgeValue}>{item.seed}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.backActions}>
              <TouchableOpacity
                onPress={handleCopyPrompt}
                style={[styles.copyButton, copied && styles.copyButtonActive]}
              >
                <Feather
                  name={copied ? 'check' : 'copy'}
                  size={14}
                  color={copied ? '#b2ff59' : '#ffffff'}
                />
                <Text
                  style={[styles.copyText, copied && { color: '#b2ff59' }]}
                >
                  {copied ? 'Copied Prompt!' : 'Copy Prompt'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRemix} style={styles.remixButton}>
                <Feather name="zap" size={14} color="#0b1405" />
                <Text style={styles.remixText}>Use Prompt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Card Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSubtitle}>
            Double-tap image to like · Tap to flip card
          </Text>
        </View>

        <View style={styles.footerRight}>
          {/* Like Button */}
          <TouchableOpacity onPress={toggleHeartButton} style={styles.likeButton}>
            <Feather
              name="heart"
              size={15}
              color={isLiked ? '#f43f5e' : '#9ca3af'}
              fill={isLiked ? '#f43f5e' : 'none'}
            />
            <Text
              style={[
                styles.likeCount,
                { color: isLiked ? '#f43f5e' : '#9ca3af' },
              ]}
            >
              {likesCount}
            </Text>
          </TouchableOpacity>

          {/* Comments */}
          <View style={styles.commentContainer}>
            <Feather name="message-square" size={14} color="#9ca3af" />
            <Text style={styles.commentCount}>{item.commentsCount}</Text>
          </View>

          {/* Bookmark */}
          <TouchableOpacity
            onPress={() => setIsSaved(!isSaved)}
            style={{ padding: 4 }}
          >
            <Feather
              name="bookmark"
              size={15}
              color={isSaved ? '#b2ff59' : '#9ca3af'}
              fill={isSaved ? '#b2ff59' : 'none'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(10, 17, 11, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(5, 9, 6, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  creatorName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  creatorHandle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 1,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  followActive: {
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderColor: 'rgba(178, 255, 89, 0.4)',
  },
  followInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  followText: {
    fontSize: 11,
    fontWeight: '700',
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
  backCardFace: {
    zIndex: 2,
  },
  imageTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  topBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBadgeTextModel: {
    color: '#b2ff59',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  topBadgeDot: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  topBadgeTextRatio: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomHintText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '500',
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -38,
    marginLeft: -38,
    zIndex: 10,
  },
  backContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#070f08',
    justifyContent: 'space-between',
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  backHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backHeaderText: {
    color: '#b2ff59',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptBox: {
    marginVertical: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flex: 1,
    justifyContent: 'center',
  },
  promptLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  promptText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  metaBadgeHighlight: {
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaBadgeLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  metaBadgeValueGreen: {
    color: '#b2ff59',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  metaBadgeValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  backActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  copyButtonActive: {
    backgroundColor: 'rgba(178, 255, 89, 0.2)',
    borderColor: '#b2ff59',
  },
  copyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  remixButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#b2ff59',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  remixText: {
    color: '#0b1405',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5, 9, 6, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  cardSubtitle: {
    color: '#9ca3af',
    fontSize: 10.5,
    marginTop: 2,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  likeCount: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  commentCount: {
    color: '#9ca3af',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
