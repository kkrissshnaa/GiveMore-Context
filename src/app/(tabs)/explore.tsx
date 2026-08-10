import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
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
        item.creator.name.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <AestheticBackdrop style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerTop}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Feather name="compass" size={20} color="#b2ff59" />
              </View>
              <View>
                <Text style={styles.titleText}>Explore</Text>
                <Text style={styles.subtitleText}>
                  Tap card to flip prompt · Double tap to like
                </Text>
              </View>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {EXPLORE_ITEMS.length} Generations
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search prompts, creators, or models..."
              placeholderTextColor="#6b7280"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip,
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

        {/* Feed List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExploreCard item={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 80,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="search" size={24} color="#b2ff59" />
              </View>
              <Text style={styles.emptyTitle}>No generations found</Text>
              <Text style={styles.emptySub}>
                No community posts match "{searchQuery}". Try searching for another style or prompt.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </AestheticBackdrop>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(5, 9, 6, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countBadgeText: {
    color: '#b2ff59',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    padding: 0,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#b2ff59',
    borderColor: '#b2ff59',
  },
  chipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySub: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#b2ff59',
  },
  clearButtonText: {
    color: '#0b1405',
    fontSize: 12,
    fontWeight: 'bold',
  },
});