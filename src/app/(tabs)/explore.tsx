import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  StyleSheet,
  Platform,
  RefreshControl,
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

  // Continuous 2-Column Dynamic Waterfall Masonry Grid
  // Assigns each item to the column with lower cumulative height (1 / numericRatio).
  // Eliminates all empty spaces, holes, and uneven row gaps across the entire feed.
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: ExploreItem[] = [];
    const right: ExploreItem[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    exploreItems.forEach((item) => {
      const ratio = item.numericRatio > 0 ? item.numericRatio : 1.0;
      const weight = 1 / ratio;

      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += weight;
      } else {
        right.push(item);
        rightHeight += weight;
      }
    });

    return { leftColumn: left, rightColumn: right };
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

            {/* Total Count Pill */}
            <View style={styles.countBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.countBadgeText}>{exploreItems.length} styles</Text>
            </View>
          </View>
        </View>

        {/* Scrollable Masonry Feed */}
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
          {/* Continuous 2-Column Masonry Grid - 0 Empty Space */}
          <View style={styles.masonryContainer}>
            {/* Left Column */}
            <View style={styles.masonryColumn}>
              {leftColumn.map((item) => (
                <ExploreCard
                  key={item.id}
                  item={item}
                  isFlipped={flippedId === item.id}
                  onToggleFlip={() =>
                    setFlippedId(flippedId === item.id ? null : item.id)
                  }
                  onRemixPrompt={handleRemix}
                />
              ))}
            </View>

            {/* Right Column */}
            <View style={styles.masonryColumn}>
              {rightColumn.map((item) => (
                <ExploreCard
                  key={item.id}
                  item={item}
                  isFlipped={flippedId === item.id}
                  onToggleFlip={() =>
                    setFlippedId(flippedId === item.id ? null : item.id)
                  }
                  onRemixPrompt={handleRemix}
                />
              ))}
            </View>
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
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229, 255, 31, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.25)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5FF1F',
  },
  countBadgeText: {
    color: '#E5FF1F',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  feedScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  masonryColumn: {
    flex: 1,
    gap: 10,
  },
});