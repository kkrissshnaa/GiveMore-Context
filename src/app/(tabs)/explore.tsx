import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  StyleSheet,
  Platform,
  RefreshControl,
  Image as RNImage,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';
import { RealisticGlassButton } from '../../components/RealisticGlassButton';
import { ExploreCard } from '../../components/ExploreCard';
import { EXPLORE_ITEMS, ExploreItem } from '../../data/exploreData';
import { getPublicExploreItems, exploreEvents } from '../../lib/exploreService';

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

type FeedRow =
  | { id: string; type: 'full-width'; item: ExploreItem }
  | {
      id: string;
      type: 'tall-portrait';
      tallItem: ExploreItem;
      stackedTopItem: ExploreItem;
      stackedBottomItem: ExploreItem;
      tallPosition: 'left' | 'right';
    }
  | { id: string; type: 'two-column'; leftItem: ExploreItem; rightItem: ExploreItem };

export default function Explore() {
  const insets = useSafeAreaInsets();
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [exploreItems, setExploreItems] = useState<ExploreItem[]>(EXPLORE_ITEMS);
  const [refreshing, setRefreshing] = useState(false);

  const loadExploreItems = useCallback(async () => {
    const items = await getPublicExploreItems();
    setExploreItems(items);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExploreItems();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadExploreItems]);

  useEffect(() => {
    let isMounted = true;
    getPublicExploreItems().then((items) => {
      if (isMounted) setExploreItems(items);
    });
    const unsub = exploreEvents.subscribe(() => {
      getPublicExploreItems().then((items) => {
        if (isMounted) setExploreItems(items);
      });
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Pack items into gapless, height-matched rows:
  // 1. 16:9 images span 2 columns and 1 row (100% full width).
  // 2. 9:16 tall images are paired with 2 stacked 1:1 items (both columns end at exact same line).
  // 3. 1:1 items sit side-by-side in balanced 2-column rows (both columns ratio 1.0, exact same height).
  // 4. Any leftover item expands to full-width hero card to eliminate empty holes.
  const feedRows = useMemo(() => {
    const rows: FeedRow[] = [];
    const pool = [...exploreItems];

    const is169 = (item: ExploreItem) => {
      if (item.aspectRatio === '16:9') return true;
      const src = typeof item.image === 'object' ? RNImage.resolveAssetSource(item.image) : null;
      const ratio = src && src.width && src.height ? src.width / src.height : item.numericRatio;
      return ratio > 1.35;
    };

    const is916 = (item: ExploreItem) => {
      if (item.aspectRatio === '9:16') return true;
      const src = typeof item.image === 'object' ? RNImage.resolveAssetSource(item.image) : null;
      const ratio = src && src.width && src.height ? src.width / src.height : item.numericRatio;
      return ratio < 0.7;
    };

    let tallToggle = false;

    while (pool.length > 0) {
      const current = pool.shift()!;

      // 1. 16:9 Widescreen -> Spans 2 Columns and 1 Row (Full Width 100%)
      if (is169(current)) {
        rows.push({
          id: `full-${current.id}`,
          type: 'full-width',
          item: current,
        });
        continue;
      }

      // 2. 9:16 Tall Portrait -> Pair with 2 stacked 1:1 items from remaining pool
      if (is916(current)) {
        const tallItem = current;
        const stackedIndices: number[] = [];
        for (let idx = 0; idx < pool.length; idx++) {
          if (!is169(pool[idx]) && !is916(pool[idx])) {
            stackedIndices.push(idx);
            if (stackedIndices.length === 2) break;
          }
        }

        if (stackedIndices.length === 2) {
          const secondIdx = stackedIndices[1];
          const firstIdx = stackedIndices[0];
          const stackedBottomItem = pool.splice(secondIdx, 1)[0];
          const stackedTopItem = pool.splice(firstIdx, 1)[0];

          rows.push({
            id: `tall-${tallItem.id}-${stackedTopItem.id}-${stackedBottomItem.id}`,
            type: 'tall-portrait',
            tallItem,
            stackedTopItem,
            stackedBottomItem,
            tallPosition: tallToggle ? 'right' : 'left',
          });
          tallToggle = !tallToggle;
          continue;
        }
      }

      // 3. Standard items -> Pair side by side or auto-expand single leftover (NO GAPS)
      const leftItem = current;
      const partnerIdx = pool.findIndex((item) => !is169(item));
      if (partnerIdx !== -1) {
        const rightItem = pool.splice(partnerIdx, 1)[0];
        rows.push({
          id: `row-${leftItem.id}-${rightItem.id}`,
          type: 'two-column',
          leftItem,
          rightItem,
        });
      } else {
        // Single leftover item -> Auto-fit full width card so zero empty space exists
        rows.push({
          id: `full-single-${leftItem.id}`,
          type: 'full-width',
          item: leftItem,
        });
      }
    }

    return rows;
  }, [exploreItems]);

  const handleRemix = useCallback((prompt: string, model: string, aspectRatio?: string) => {
    router.push({
      pathname: '/',
      params: { prompt, model, aspectRatio: aspectRatio || '1:1' },
    });
  }, []);

  return (
    <AestheticBackdrop style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Clean Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.titleGroup}>
              <RealisticGlassButton
                variant="glass"
                size={42}
                borderRadius={14}
                showGlint={false}
              >
                <Feather name="compass" size={21} color="#E5FF1F" />
              </RealisticGlassButton>
              <View>
                <Text style={styles.headerTitle}>Explore</Text>
                <Text style={styles.headerSubtitle}>
                  Discover & remix community creations
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Scrollable Feed */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E5FF1F"
              colors={['#E5FF1F']}
              progressBackgroundColor="#0b1405"
            />
          }
          contentContainerStyle={[
            styles.feedScrollContent,
            { paddingBottom: insets.bottom + 110 },
          ]}
        >
          <View style={styles.feedWrapper}>
            {feedRows.map((row) => {
              // 1. 16:9 Widescreen spanning 2 columns and 1 row (100% full width)
              if (row.type === 'full-width') {
                return (
                  <View key={row.id} style={styles.fullWidthCardContainer}>
                    <ExploreCard
                      item={row.item}
                      isFlipped={flippedId === row.item.id}
                      overrideAspectRatio={16 / 9}
                      onToggleFlip={() =>
                        setFlippedId(flippedId === row.item.id ? null : row.item.id)
                      }
                      onRemixPrompt={handleRemix}
                    />
                  </View>
                );
              }

              // 2. 9:16 Tall portrait paired with 2 stacked 1:1 cards (exact height match)
              if (row.type === 'tall-portrait') {
                const { tallItem, stackedTopItem, stackedBottomItem, tallPosition } = row;
                const isTallLeft = tallPosition === 'left';

                const tallCardComponent = (
                  <View style={styles.column}>
                    <ExploreCard
                      item={tallItem}
                      isFlipped={flippedId === tallItem.id}
                      overrideAspectRatio={0.485}
                      onToggleFlip={() =>
                        setFlippedId(flippedId === tallItem.id ? null : tallItem.id)
                      }
                      onRemixPrompt={handleRemix}
                    />
                  </View>
                );

                const stackedColumnComponent = (
                  <View style={[styles.column, { gap: 10 }]}>
                    <ExploreCard
                      item={stackedTopItem}
                      isFlipped={flippedId === stackedTopItem.id}
                      overrideAspectRatio={1.0}
                      onToggleFlip={() =>
                        setFlippedId(
                          flippedId === stackedTopItem.id ? null : stackedTopItem.id
                        )
                      }
                      onRemixPrompt={handleRemix}
                    />
                    <ExploreCard
                      item={stackedBottomItem}
                      isFlipped={flippedId === stackedBottomItem.id}
                      overrideAspectRatio={1.0}
                      onToggleFlip={() =>
                        setFlippedId(
                          flippedId === stackedBottomItem.id ? null : stackedBottomItem.id
                        )
                      }
                      onRemixPrompt={handleRemix}
                    />
                  </View>
                );

                return (
                  <View key={row.id} style={styles.gridRow}>
                    {isTallLeft ? (
                      <>
                        {tallCardComponent}
                        {stackedColumnComponent}
                      </>
                    ) : (
                      <>
                        {stackedColumnComponent}
                        {tallCardComponent}
                      </>
                    )}
                  </View>
                );
              }

              // 3. Standard 2-column row (both ratio 1.0, exact equal height, zero gap)
              return (
                <View key={row.id} style={styles.gridRow}>
                  <View style={styles.column}>
                    <ExploreCard
                      item={row.leftItem}
                      isFlipped={flippedId === row.leftItem.id}
                      overrideAspectRatio={1.0}
                      onToggleFlip={() =>
                        setFlippedId(
                          flippedId === row.leftItem.id ? null : row.leftItem.id
                        )
                      }
                      onRemixPrompt={handleRemix}
                    />
                  </View>
                  <View style={styles.column}>
                    <ExploreCard
                      item={row.rightItem}
                      isFlipped={flippedId === row.rightItem.id}
                      overrideAspectRatio={1.0}
                      onToggleFlip={() =>
                        setFlippedId(
                          flippedId === row.rightItem.id ? null : row.rightItem.id
                        )
                      }
                      onRemixPrompt={handleRemix}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </AestheticBackdrop>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.5,
    lineHeight: 25,
  },
  headerSubtitle: {
    color: 'rgba(229, 255, 31, 0.85)',
    fontSize: 11.5,
    fontFamily: HELVETICA_FONT,
    letterSpacing: -0.2,
  },
  feedScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  feedWrapper: {
    gap: 10,
  },
  fullWidthCardContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
  },
});