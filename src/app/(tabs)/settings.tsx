import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';

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

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [haptics, setHaptics] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [highRes, setHighRes] = useState(true);
  const [defaultModel, setDefaultModel] = useState('Flux 1.1 Pro');

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Temporary preview cache cleared successfully.');
  };

  return (
    <AestheticBackdrop style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header (Matching Explore page header design) */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <Feather name="settings" size={24} color="#E5FF1F" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>
                  Preferences & configuration
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: insets.bottom + 120,
            gap: 16,
          }}
        >
          {/* Section 1: Preferences */}
          <View style={styles.glassPanel}>
            <Text style={styles.sectionHeader}>PREFERENCES</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Text style={styles.settingSubtitle}>
                  Vibrate on interactive actions and gestures
                </Text>
              </View>
              <Switch
                value={haptics}
                onValueChange={setHaptics}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#E5FF1F' }}
                thumbColor={haptics ? '#0b1405' : '#ffffff'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Auto-Save Generations</Text>
                <Text style={styles.settingSubtitle}>
                  Save completed prompt creations to local history
                </Text>
              </View>
              <Switch
                value={autoSave}
                onValueChange={setAutoSave}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#E5FF1F' }}
                thumbColor={autoSave ? '#0b1405' : '#ffffff'}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>High-Res Previews</Text>
                <Text style={styles.settingSubtitle}>
                  Render cards at full retina resolution
                </Text>
              </View>
              <Switch
                value={highRes}
                onValueChange={setHighRes}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#E5FF1F' }}
                thumbColor={highRes ? '#0b1405' : '#ffffff'}
              />
            </View>
          </View>

          {/* Section 2: Generation Defaults */}
          <View style={styles.glassPanel}>
            <Text style={styles.sectionHeader}>GENERATION DEFAULTS</Text>

            <TouchableOpacity
              style={styles.settingRowAction}
              activeOpacity={0.7}
              onPress={() => {
                const models = ['Flux 1.1 Pro', 'Ideogram v2', 'Krea AI v2'];
                const nextIdx = (models.indexOf(defaultModel) + 1) % models.length;
                setDefaultModel(models[nextIdx]);
              }}
            >
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Default Model</Text>
                <Text style={styles.settingSubtitle}>
                  Primary AI engine for prompt remixes
                </Text>
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{defaultModel}</Text>
                <Feather name="chevron-right" size={14} color="#E5FF1F" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Section 3: System & Storage */}
          <View style={styles.glassPanel}>
            <Text style={styles.sectionHeader}>SYSTEM & STORAGE</Text>

            <TouchableOpacity
              style={styles.settingRowAction}
              activeOpacity={0.7}
              onPress={handleClearCache}
            >
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Clear Image Cache</Text>
                <Text style={styles.settingSubtitle}>
                  Free up local storage space (~24 MB)
                </Text>
              </View>
              <Feather name="trash-2" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>App Version</Text>
                <Text style={styles.settingSubtitle}>
                  GiveMore-Context Studio
                </Text>
              </View>
              <Text style={styles.versionText}>v1.2.0 (42)</Text>
            </View>
          </View>
        </ScrollView>
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
    marginTop: 0,
    letterSpacing: -0.2,
  },
  glassPanel: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 4,
  },
  sectionHeader: {
    color: '#E5FF1F',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.3,
  },
  settingSubtitle: {
    color: '#E5FF1F',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: HELVETICA_FONT,
    marginTop: 0,
    letterSpacing: -0.1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(229, 255, 31, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#E5FF1F',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  versionText: {
    color: '#E5FF1F',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
});