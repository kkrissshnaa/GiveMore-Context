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

export default function Explore() {
  const insets = useSafeAreaInsets();
  const [flippedId, setFlippedId] = useState<string | null>(null);

  // Distribute items into left/right columns by tracking exact aspect-ratio heights
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: ExploreItem[] = [];
    const right: ExploreItem[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    EXPLORE_ITEMS.forEach((item) => {
      const assetSource = RNImage.resolveAssetSource(item.image);
      const ratio =
        assetSource && assetSource.width && assetSource.height
          ? assetSource.width / assetSource.height
          : item.numericRatio;
      const relativeHeight = 1 / ratio;
      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += relativeHeight;
      } else {
        right.push(item);
        rightHeight += relativeHeight;
      }
    });

    return { leftColumn: left, rightColumn: right };
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
                <Feather name="compass" size={24} color="#b2ff59" />
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

        {/* Pinterest 2-Column Grid Feed in Virtualized FlatList */}
        <FlatList
          data={[{ id: 'grid-feed' }]}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 6,
            paddingBottom: insets.bottom + 120,
          }}
          renderItem={() => (
            <View style={styles.gridContainer}>
              {/* Left Column */}
              <View style={styles.column}>
                {leftColumn.map((item) => (
                  <ExploreCard
                    key={item.id}
                    item={item}
                    isFlipped={flippedId === item.id}
                    onToggleFlip={() =>
                      setFlippedId(flippedId === item.id ? null : item.id)
                    }
                  />
                ))}
              </View>

              {/* Right Column */}
              <View style={styles.column}>
                {rightColumn.map((item) => (
                  <ExploreCard
                    key={item.id}
                    item={item}
                    isFlipped={flippedId === item.id}
                    onToggleFlip={() =>
                      setFlippedId(flippedId === item.id ? null : item.id)
                    }
                  />
                ))}
              </View>
            </View>
          )}
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
    marginTop: 0,
    letterSpacing: -0.2,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
    gap: 10,
  },
});