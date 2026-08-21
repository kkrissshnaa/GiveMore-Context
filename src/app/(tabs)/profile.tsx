import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { useUser, useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';
import { getChats } from '../../lib/chatService';

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

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();

  const [haptics, setHaptics] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [highRes, setHighRes] = useState(true);
  const [defaultModel, setDefaultModel] = useState('Flux 1.1 Pro');
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    getChats().then((chats) => {
      setGenerationCount(chats.length);
    }).catch(() => {});
  }, []);

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Temporary image cache cleared successfully.');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of GiveMore-Context?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              console.error('Sign out error:', e);
            }
          },
        },
      ]
    );
  };

  const handleCopyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const displayName =
    user?.fullName ||
    user?.username ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Creator';

  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  const userAvatar = user?.imageUrl;
  const userInitials = user?.username
    ? user.username.slice(0, 2)
    : (user?.firstName ? user.firstName[0] : '') + (user?.lastName ? user.lastName[0] : (displayName[0] || 'C'));

  return (
    <AestheticBackdrop style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <Feather name="user" size={24} color="#E5FF1F" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>
                  Account & Studio Settings
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
          {/* User Card */}
          {isLoaded && isSignedIn ? (
            <View style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                {userAvatar ? (
                  <Image
                    source={{ uri: userAvatar }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {userInitials.toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.profileDetails}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Pro</Text>
                    </View>
                  </View>
                  {userEmail ? (
                    <Text style={styles.profileEmail} numberOfLines={1}>
                      {userEmail}
                    </Text>
                  ) : null}
                  {user?.id ? (
                    <TouchableOpacity
                      onPress={handleCopyUserId}
                      activeOpacity={0.7}
                      style={styles.idChip}
                    >
                      <Feather
                        name={copiedId ? 'check' : 'copy'}
                        size={11}
                        color="#E5FF1F"
                      />
                      <Text style={styles.idChipText}>
                        {copiedId ? 'Copied ID' : `ID: ${user.id.slice(0, 10)}...`}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.guestCard}>
              <View style={styles.guestInfo}>
                <View style={styles.guestIcon}>
                  <Feather name="shield" size={20} color="#E5FF1F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestTitle}>Sign in to Sync</Text>
                  <Text style={styles.guestSubtitle}>
                    Save prompts, access custom models & sync creations
                  </Text>
                </View>
              </View>

              <View style={styles.guestActions}>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/signin')}
                  style={styles.signInButton}
                  activeOpacity={0.8}
                >
                  <Feather name="log-in" size={14} color="#060e03" />
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/signup')}
                  style={styles.signUpButton}
                  activeOpacity={0.8}
                >
                  <Feather name="user-plus" size={14} color="#E5FF1F" />
                  <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Feather name="zap" size={16} color="#E5FF1F" />
              </View>
              <Text style={styles.statValue}>{generationCount}</Text>
              <Text style={styles.statLabel}>Generations</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Feather name="cpu" size={16} color="#E5FF1F" />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {defaultModel.split(' ')[0]}
              </Text>
              <Text style={styles.statLabel}>Active Engine</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Feather name="cloud" size={16} color="#E5FF1F" />
              </View>
              <Text style={styles.statValue}>
                {isSignedIn ? 'Synced' : 'Local'}
              </Text>
              <Text style={styles.statLabel}>Storage State</Text>
            </View>
          </View>

          {/* Section 1: Studio Preferences */}
          <View style={styles.glassPanel}>
            <Text style={styles.sectionHeader}>STUDIO PREFERENCES</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Text style={styles.settingSubtitle}>
                  Tactile response on dials, gestures & actions
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
                  Preserve remix history & canvas state automatically
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
                <Text style={styles.settingTitle}>Retina Image Previews</Text>
                <Text style={styles.settingSubtitle}>
                  Render generated cards with full resolution sharpness
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

          {/* Section 2: Generation Engine Defaults */}
          <View style={styles.glassPanel}>
            <Text style={styles.sectionHeader}>DEFAULT AI ENGINE</Text>

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
                <Text style={styles.settingTitle}>Default Generation Model</Text>
                <Text style={styles.settingSubtitle}>
                  Primary image diffusion model used on canvas
                </Text>
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{defaultModel}</Text>
                <Feather name="refresh-cw" size={12} color="#E5FF1F" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Section 3: Storage & System */}
          <View style={styles.glassPanel}>
            <Text style={styles.sectionHeader}>STORAGE & SYSTEM</Text>

            <TouchableOpacity
              style={styles.settingRowAction}
              activeOpacity={0.7}
              onPress={handleClearCache}
            >
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Clear Image Cache</Text>
                <Text style={styles.settingSubtitle}>
                  Purge cached canvas layers & previews
                </Text>
              </View>
              <View style={styles.actionIconPill}>
                <Feather name="trash-2" size={14} color="#9ca3af" />
              </View>
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

          {/* Sign Out Action (if signed in) */}
          {isLoaded && isSignedIn && (
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutButton}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={16} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out of Account</Text>
            </TouchableOpacity>
          )}
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
  profileCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 255, 31, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.25)',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E5FF1F',
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#182813',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5FF1F',
  },
  avatarInitials: {
    color: '#E5FF1F',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
  },
  profileDetails: {
    flex: 1,
    gap: 3,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229, 255, 31, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5FF1F',
  },
  statusText: {
    color: '#E5FF1F',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
  },
  profileEmail: {
    color: '#E5FF1F',
    fontSize: 12.5,
    fontFamily: HELVETICA_FONT,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idChipText: {
    color: '#E5FF1F',
    fontSize: 10,
    fontFamily: HELVETICA_FONT,
  },
  guestCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 14,
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 255, 31, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
  },
  guestSubtitle: {
    color: '#E5FF1F',
    fontSize: 12,
    fontFamily: HELVETICA_FONT,
    marginTop: 1,
  },
  guestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  signInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E5FF1F',
  },
  signInText: {
    color: '#060e03',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
  },
  signUpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.3)',
  },
  signUpText: {
    color: '#E5FF1F',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 4,
  },
  statIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(229, 255, 31, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
  },
  statLabel: {
    color: '#E5FF1F',
    fontSize: 10,
    fontFamily: HELVETICA_FONT,
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
    gap: 6,
    backgroundColor: 'rgba(229, 255, 31, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 31, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: '#E5FF1F',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  actionIconPill: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    color: '#E5FF1F',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
    letterSpacing: -0.2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 4,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: HELVETICA_BOLD,
  },
});
