import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  StyleSheet,
  Platform,
  Image as RNImage,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';
import { ExploreCard } from '../../components/ExploreCard';
import { EXPLORE_ITEMS, ExploreItem } from '../../data/exploreData';

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

  // Group items into dynamic rows:
  // - 16:9 images span BOTH columns across full-width rows (taking 2 full-width rows for consecutive 16:9 items)
  // - 9:16 images occupy 1 column and span 2 rows height (paired with 2 stacked 1:1 cards)
  // - 1:1 images sit side-by-side in balanced 2-column rows
  const feedRows = useMemo(() => {
    const rows: FeedRow[] = [];
    let i = 0;

    const is169 = (item: ExploreItem) => {
      if (item.aspectRatio === '16:9') return true;
      const src = RNImage.resolveAssetSource(item.image);
      const ratio =
        src && src.width && src.height ? src.width / src.height : item.numericRatio;
      return ratio > 1.3;
    };

    const is916 = (item: ExploreItem) => {
      if (item.aspectRatio === '9:16') return true;
      const src = RNImage.resolveAssetSource(item.image);
      const ratio =
        src && src.width && src.height ? src.width / src.height : item.numericRatio;
      return ratio < 0.7;
    };

    let tallToggle = false;

    while (i < EXPLORE_ITEMS.length) {
      const item = EXPLORE_ITEMS[i];

      // 1. 16:9 Widescreen -> Full Width (Both Columns)
      if (is169(item)) {
        rows.push({
          id: `full-${item.id}`,
          type: 'full-width',
          item,
        });
        i++;
      }
      // 2. 9:16 Tall Portrait -> 1 column spanning 2 rows height
      else if (is916(item)) {
        const tallItem = item;
        let stackedTopItem: ExploreItem | undefined = undefined;
        let stackedBottomItem: ExploreItem | undefined = undefined;

        let lookAhead = i + 1;
        if (
          lookAhead < EXPLORE_ITEMS.length &&
          !is169(EXPLORE_ITEMS[lookAhead]) &&
          !is916(EXPLORE_ITEMS[lookAhead])
        ) {
          stackedTopItem = EXPLORE_ITEMS[lookAhead];
          lookAhead++;
          if (
            lookAhead < EXPLORE_ITEMS.length &&
            !is169(EXPLORE_ITEMS[lookAhead]) &&
            !is916(EXPLORE_ITEMS[lookAhead])
          ) {
            stackedBottomItem = EXPLORE_ITEMS[lookAhead];
            lookAhead++;
          }
        }

        rows.push({
          id: `tall-${tallItem.id}`,
          type: 'tall-portrait',
          tallItem,
          stackedTopItem,
          stackedBottomItem,
          tallPosition: tallToggle ? 'right' : 'left',
        });

        tallToggle = !tallToggle;
        i = lookAhead;
      }
      // 3. Standard 1:1 items -> Pair side by side in 2 columns
      else {
        const leftItem = item;
        let rightItem: ExploreItem | undefined = undefined;

        if (
          i + 1 < EXPLORE_ITEMS.length &&
          !is169(EXPLORE_ITEMS[i + 1]) &&
          !is916(EXPLORE_ITEMS[i + 1])
        ) {
          rightItem = EXPLORE_ITEMS[i + 1];
          i++;
        }

        rows.push({
          id: `row-${leftItem.id}-${rightItem ? rightItem.id : 'single'}`,
          type: 'two-column',
          leftItem,
          rightItem,
        });
        i++;
      }
    }

    return rows;
  }, []);

  return (
    <AestheticBackdrop style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Transparent Seamless Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <Feather name="compass" size={22} color="#b2ff59" />
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

              const tallCardComponent = (
                <View style={styles.column}>
                  <ExploreCard
                    item={tallItem}
                    isFlipped={flippedId === tallItem.id}
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
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.35)',
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
    color: '#b2ff59',
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