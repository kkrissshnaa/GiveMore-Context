import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';
import { ExploreCard } from '../../components/ExploreCard';
import { EXPLORE_ITEMS, ExploreItem } from '../../data/exploreData';

const CATEGORIES = [
  'All',
  'Graphic Art',
  'Noir & Comic',
  'Cinematic',
  'Minimalist',
];

export default function Explore() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return EXPLORE_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.prompt.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Split items into 2 columns for Pinterest staggered masonry grid layout
  const leftColumn = useMemo(
    () => filteredItems.filter((_, idx) => idx % 2 === 0),
    [filteredItems]
  );
  const rightColumn = useMemo(
    () => filteredItems.filter((_, idx) => idx % 2 === 1),
    [filteredItems]
  );

  return (
    <AestheticBackdrop style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Clean Mobile Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <Feather name="compass" size={18} color="#b2ff59" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Explore</Text>
                <Text style={styles.headerSubtitle}>
                  Tap any post to flip prompt & model specs
                </Text>
              </View>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredItems.length}</Text>
            </View>
          </View>

          {/* Minimal Search Bar */}
          <View style={styles.searchBar}>
            <Feather name="search" size={15} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search prompts or models..."
              placeholderTextColor="#6b7280"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={15} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingBottom: 2 }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.chip,
                    isActive ? styles.chipActive : styles.chipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isActive ? '#0b1405' : '#9ca3af' },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Pinterest 2-Column Grid Feed */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 12,
            paddingBottom: insets.bottom + 80,
          }}
        >
          {filteredItems.length > 0 ? (
            <View style={styles.gridContainer}>
              {/* Left Column */}
              <View style={styles.column}>
                {leftColumn.map((item) => (
                  <ExploreCard key={item.id} item={item} />
                ))}
              </View>

              {/* Right Column */}
              <View style={styles.column}>
                {rightColumn.map((item) => (
                  <ExploreCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Feather name="search" size={22} color="#b2ff59" />
              </View>
              <Text style={styles.emptyTitle}>No generations found</Text>
              <Text style={styles.emptyDesc}>
                No generations match "{searchQuery}". Try searching for another style or prompt.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Reset Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </AestheticBackdrop>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: 'rgba(5, 9, 6, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  countBadge: {
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  countText: {
    color: '#b2ff59',
    fontSize: 10.5,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    padding: 0,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#b2ff59',
    borderColor: '#b2ff59',
  },
  chipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  emptyBox: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  emptyDesc: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 14,
  },
  clearBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#b2ff59',
  },
  clearBtnText: {
    color: '#0b1405',
    fontSize: 11,
    fontWeight: 'bold',
  },
});