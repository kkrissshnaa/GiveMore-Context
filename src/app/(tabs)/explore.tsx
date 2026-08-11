import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';
import { ExploreCard } from '../../components/ExploreCard';
import { EXPLORE_ITEMS, ExploreItem } from '../../data/exploreData';

export default function Explore() {
  const insets = useSafeAreaInsets();
  const [flippedId, setFlippedId] = useState<string | null>(null);

  // Distribute items into left/right columns by assigning each item to the currently shorter column
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: ExploreItem[] = [];
    const right: ExploreItem[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    EXPLORE_ITEMS.forEach((item) => {
      const estimatedHeight = item.aspectRatio === '16:9' ? 160 : 230;
      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += estimatedHeight;
      } else {
        right.push(item);
        rightHeight += estimatedHeight;
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
                <Feather name="compass" size={18} color="#b2ff59" />
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
            paddingBottom: insets.bottom + 80,
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
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
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
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 10.5,
    marginTop: 1,
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