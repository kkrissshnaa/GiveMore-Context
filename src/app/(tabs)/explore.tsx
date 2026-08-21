import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  StyleSheet,
  Platform,
  Image as RNImage,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';
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
      stackedTopItem?: ExploreItem;
      stackedBottomItem?: ExploreItem;
      tallPosition: 'left' | 'right';
    }
  | { id: string; type: 'two-column'; leftItem: ExploreItem; rightItem?: ExploreItem };

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

  // Group items into dynamic rows:
  // - 16:9 images span BOTH columns across full-width rows (taking 2 full-width rows for consecutive 16:9 items)
  // - 9:16 images occupy 1 column and span 2 rows height (paired with 2 stacked 1:1 cards)
  // - 1:1 images sit side-by-side in balanced 2-column rows
  // Auto-Fix Gapless Grid Masonry Bin-Packing Algorithm:
  // Eliminates empty spaces and hollow grid cells by dynamically pairing items
  // and auto-expanding leftover items into full-width hero cards.
  const feedRows = useMemo(() => {
    const rows: FeedRow[] = [];
    const pool = [...exploreItems];

    const is169 = (item: ExploreItem) => {
      if (item.aspectRatio === '16:9') return true;
      const src = typeof item.image === 'object' ? RNImage.resolveAssetSource(item.image) : null;
      const ratio = src && src.width && src.height ? src.width / src.height : item.numericRatio;
      return ratio > 1.3;
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

      // 1. 16:9 Widescreen -> Spans Full Width (100% width)
      if (is169(current)) {
        rows.push({
          id: `full-${current.id}`,
          type: 'full-width',
          item: current,
        });
      }
      // 2. 9:16 Tall Portrait -> Pair with 2 stacked standard items from remaining pool
      else if (is916(current)) {
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
            id: `tall-${tallItem.id}`,
            type: 'tall-portrait',
            tallItem,
            stackedTopItem,
            stackedBottomItem,
            tallPosition: tallToggle ? 'right' : 'left',
          });
          tallToggle = !tallToggle;
        } else if (stackedIndices.length === 1) {
          const stackedTopItem = pool.splice(stackedIndices[0], 1)[0];
          rows.push({
            id: `tall-${tallItem.id}`,
            type: 'tall-portrait',
            tallItem,
            stackedTopItem,
            tallPosition: tallToggle ? 'right' : 'left',
          });
          tallToggle = !tallToggle;
        } else {
          // Look for another tall item to pair side-by-side or auto-fit full width
          const otherTallIdx = pool.findIndex((item) => is916(item));
          if (otherTallIdx !== -1) {
            const rightTall = pool.splice(otherTallIdx, 1)[0];
            rows.push({
              id: `row-tall-${tallItem.id}-${rightTall.id}`,
              type: 'two-column',
              leftItem: tallItem,
              rightItem: rightTall,
            });
          } else {
            rows.push({
              id: `full-tall-${tallItem.id}`,
              type: 'full-width',
              item: tallItem,
            });
          }
        }
      }
      // 3. Standard items -> Pair side by side or auto-expand single leftover to full-width (NO GAPS)
      else {
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
          // Single leftover item -> Auto-fit full width hero card (Eliminates empty spaces!)
          rows.push({
            id: `full-single-${leftItem.id}`,
            type: 'full-width',
            item: leftItem,
          });
        }
      }
    }

    return rows;
  }, [exploreItems]);

  return (
    <AestheticBackdrop style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Transparent Seamless Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <Feather name="compass" size={22} color="#E5FF1F" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Explore</Text>
                <Text style={styles.headerSubtitle}>
                  Discover community generations
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Feed in Virtualized FlatList */}
        <FlatList
          data={feedRows}
          keyExtractor={(item) => item.id}
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
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 6,
            paddingBottom: insets.bottom + 120,
            gap: 10,
          }}
          renderItem={({ item: row }) => {
            // Full-width widescreen (16:9) spanning both columns
            if (row.type === 'full-width') {
              const fullItem = row.item;
              return (
                <View style={styles.fullWidthCardContainer}>
                  <ExploreCard
                    item={fullItem}
                    isFlipped={flippedId === fullItem.id}
                    overrideAspectRatio={16 / 9}
                    onToggleFlip={() =>
                      setFlippedId(flippedId === fullItem.id ? null : fullItem.id)
                    }
                  />
                </View>
              );
            }

            // Tall portrait (9:16) occupying 1 column & 2 rows height
            if (row.type === 'tall-portrait') {
              const { tallItem, stackedTopItem, stackedBottomItem, tallPosition } = row;
              const isTallLeft = tallPosition === 'left';

              // Height of 2 stacked 1:1 cards + 10px gap matches ratio ~ 0.485 (1 : 2.06)
              const tallRatio = (stackedTopItem && stackedBottomItem) ? 0.485 : (stackedTopItem ? 1.0 : 0.5625);

              const tallCardComponent = (
                <View style={styles.column}>
                  <ExploreCard
                    item={tallItem}
                    isFlipped={flippedId === tallItem.id}
                    overrideAspectRatio={tallRatio}
                    onToggleFlip={() =>
                      setFlippedId(flippedId === tallItem.id ? null : tallItem.id)
                    }
                  />
                </View>
              );

              const stackedColumnComponent = (
                <View style={[styles.column, { gap: 10 }]}>
                  {stackedTopItem && (
                    <ExploreCard
                      item={stackedTopItem}
                      isFlipped={flippedId === stackedTopItem.id}
                      overrideAspectRatio={1.0}
                      onToggleFlip={() =>
                        setFlippedId(
                          flippedId === stackedTopItem.id ? null : stackedTopItem.id
                        )
                      }
                    />
                  )}
                  {stackedBottomItem && (
                    <ExploreCard
                      item={stackedBottomItem}
                      isFlipped={flippedId === stackedBottomItem.id}
                      overrideAspectRatio={1.0}
                      onToggleFlip={() =>
                        setFlippedId(
                          flippedId === stackedBottomItem.id ? null : stackedBottomItem.id
                        )
                      }
                    />
                  )}
                </View>
              );

              return (
                <View style={styles.gridContainer}>
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

            // Standard 2-column row for 1:1 items
            const { leftItem, rightItem } = row;

            return (
              <View style={styles.gridContainer}>
                {/* Left Column */}
                <View style={styles.column}>
                  <ExploreCard
                    item={leftItem}
                    isFlipped={flippedId === leftItem.id}
                    overrideAspectRatio={1.0}
                    onToggleFlip={() =>
                      setFlippedId(flippedId === leftItem.id ? null : leftItem.id)
                    }
                  />
                </View>

                {/* Right Column */}
                {rightItem ? (
                  <View style={styles.column}>
                    <ExploreCard
                      item={rightItem}
                      isFlipped={flippedId === rightItem.id}
                      overrideAspectRatio={1.0}
                      onToggleFlip={() =>
                        setFlippedId(flippedId === rightItem.id ? null : rightItem.id)
                      }
                    />
                  </View>
                ) : (
                  <View style={styles.column} />
                )}
              </View>
            );
          }}
        />
      </View>
    </AestheticBackdrop>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 255, 31, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.6,
    lineHeight: 27,
  },
  headerSubtitle: {
    color: '#E5FF1F',
    fontSize: 12.5,
    fontWeight: '400',
    fontFamily: HELVETICA_FONT,
    letterSpacing: -0.2,
  },
  fullWidthCardContainer: {
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
  },
});