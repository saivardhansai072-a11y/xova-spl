import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import MentorAvatar from '../../src/components/MentorAvatar';
import { COLORS, SPACING, FONT_SIZES, API_URL } from '../../src/constants/theme';
import { getCharacterById, DEFAULT_CHARACTER } from '../../src/constants/characters';

const { width } = Dimensions.get('window');

type DashboardData = {
  greeting: string;
  daily_mission: { title: string; progress: number; target: number };
  stats: { streak: number; questions_answered: number; accuracy: number; topics_mastered: number };
  credits: { plan: string; used: number; max: number; remaining: number };
};

const MODULE_CARDS = [
  { id: 'chat', title: 'AI Chat', icon: 'robot-happy-outline', color: COLORS.primary.main, route: '/(tabs)/chat', desc: 'Talk to XOVA' },
  { id: 'aptitude', title: 'Aptitude', icon: 'brain', color: '#00FF9D', route: '/(tabs)/aptitude', desc: '40+ Topics' },
  { id: 'interview', title: 'Interview', icon: 'account-tie', color: '#3A86FF', route: '/interview', desc: 'Mock Practice' },
  { id: 'career', title: 'Career', icon: 'compass-outline', color: '#FFD60A', route: '/career', desc: 'Guidance' },
  { id: 'startup', title: 'Startup', icon: 'rocket-launch-outline', color: '#FF6B9D', route: '/startup', desc: 'Mentor' },
  { id: 'community', title: 'Community', icon: 'account-group-outline', color: COLORS.secondary.main, route: '/community', desc: 'Connect' },
];

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get the selected character
  const characterId = user?.mentor_character || 'zero_two';
  const character = getCharacterById(characterId) || DEFAULT_CHARACTER;

  // Glow animation
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.7]),
  }));

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch (e) {}
  }, [token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  const onRefresh = async () => { setRefreshing(true); await fetchDashboard(); setRefreshing(false); };

  const missionProgress = data ? data.daily_mission.progress / data.daily_mission.target : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary.main} />}
        >
          {/* Hero Section with Avatar */}
          <LinearGradient colors={['#0A0A2E', '#050510']} style={styles.heroSection}>
            <Animated.View style={[styles.heroGlow, glowStyle]} />
            <View style={styles.heroContent}>
              <View style={styles.heroTextArea}>
                <Text style={styles.brandLabel}>XOVA AI</Text>
                <Text style={styles.greeting}>{data?.greeting || `Welcome, ${user?.name || 'Student'}!`}</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroPill}>
                    <MaterialCommunityIcons name="fire" size={14} color={COLORS.accent.warning} />
                    <Text style={styles.heroPillText}>{data?.stats.streak || 0}</Text>
                  </View>
                  <View style={styles.heroPill}>
                    <MaterialCommunityIcons name="lightning-bolt" size={14} color={COLORS.primary.main} />
                    <Text style={styles.heroPillText}>{data?.credits.remaining ?? 10}</Text>
                  </View>
                  <View style={styles.heroPill}>
                    <MaterialCommunityIcons name="diamond-stone" size={14} color={COLORS.secondary.main} />
                    <Text style={styles.heroPillText}>{(data?.credits.plan || 'free').toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              <MentorAvatar characterId={characterId} size="medium" showName />
            </View>
          </LinearGradient>

          {/* Daily Mission */}
          <View style={styles.missionCard}>
            <View style={styles.missionRow}>
              <View style={styles.missionIcon}>
                <MaterialCommunityIcons name="target" size={18} color={COLORS.primary.main} />
              </View>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>Daily Mission</Text>
                <Text style={styles.missionDesc}>{data?.daily_mission.title || 'Complete 5 Aptitude Questions'}</Text>
              </View>
              <Text style={styles.missionCount}>{data?.daily_mission.progress || 0}/{data?.daily_mission.target || 5}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient colors={[COLORS.primary.main, COLORS.secondary.main]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressBarFill, { width: `${Math.min(missionProgress * 100, 100)}%` }]} />
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Answered', value: data?.stats.questions_answered || 0, icon: 'help-circle', color: COLORS.primary.main },
              { label: 'Accuracy', value: `${data?.stats.accuracy || 0}%`, icon: 'bullseye-arrow', color: COLORS.accent.success },
              { label: 'Mastered', value: data?.stats.topics_mastered || 0, icon: 'bookmark-check', color: COLORS.accent.warning },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Module Cards */}
          <Text style={styles.sectionTitle}>Modules</Text>
          <View style={styles.moduleGrid}>
            {MODULE_CARDS.map((m) => (
              <Link key={m.id} href={m.route as any} asChild>
                <TouchableOpacity
                  testID={`module-${m.id}-btn`}
                  style={styles.moduleCard}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={[m.color + '15', 'transparent']} style={styles.moduleGradient}>
                    <View style={[styles.moduleIconBg, { backgroundColor: m.color + '20' }]}>
                      <MaterialCommunityIcons name={m.icon as any} size={24} color={m.color} />
                    </View>
                    <Text style={styles.moduleTitle}>{m.title}</Text>
                    <Text style={styles.moduleDesc}>{m.desc}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>

          {/* Talk to XOVA Banner */}
          <Link href="/(tabs)/chat" asChild>
            <TouchableOpacity testID="chat-cta-btn" style={styles.chatBanner} activeOpacity={0.8}>
              <LinearGradient colors={[COLORS.primary.dark + 'CC', COLORS.secondary.dark + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chatBannerGradient}>
                <View style={styles.chatBannerIcon}>
                  <MaterialCommunityIcons name="robot-happy-outline" size={28} color={COLORS.text.primary} />
                </View>
                <View style={styles.chatBannerText}>
                  <Text style={styles.chatBannerTitle}>Talk to XOVA</Text>
                  <Text style={styles.chatBannerSub}>Groq AI • ElevenLabs Voice • Instant responses</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.text.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          {/* Settings shortcut */}
          <Link href="/settings" asChild>
            <TouchableOpacity testID="settings-shortcut-btn" style={styles.settingsRow}>
              <MaterialCommunityIcons name="cog-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.settingsText}>Customize Mentor</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.text.disabled} />
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const cardW = (width - SPACING.lg * 2 - SPACING.sm * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  scroll: { paddingBottom: 100 },
  heroSection: { marginHorizontal: SPACING.md, marginTop: SPACING.sm, borderRadius: 20, overflow: 'hidden', padding: SPACING.lg },
  heroGlow: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.primary.main + '15' },
  heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTextArea: { flex: 1, marginRight: SPACING.md },
  brandLabel: { fontSize: FONT_SIZES.xs, color: COLORS.primary.main, fontWeight: '800', letterSpacing: 4 },
  greeting: { fontSize: FONT_SIZES.xl, color: COLORS.text.primary, fontWeight: '700', marginTop: 4, lineHeight: 26 },
  heroStats: { flexDirection: 'row', gap: 8, marginTop: SPACING.md },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  heroPillText: { color: COLORS.text.primary, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  missionCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  missionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary.main + '15', justifyContent: 'center', alignItems: 'center' },
  missionInfo: { flex: 1 },
  missionTitle: { color: COLORS.primary.main, fontSize: FONT_SIZES.sm, fontWeight: '700', letterSpacing: 1 },
  missionDesc: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 1 },
  missionCount: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, fontWeight: '800' },
  progressBarBg: { height: 5, backgroundColor: COLORS.background.subtle, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  statCard: { flex: 1, backgroundColor: COLORS.background.paper, borderRadius: 14, paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border.subtle },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.text.disabled, marginTop: 2 },
  sectionTitle: { fontSize: FONT_SIZES.lg, color: COLORS.text.primary, fontWeight: '700', letterSpacing: 1, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: SPACING.lg, gap: SPACING.sm },
  moduleCard: { width: cardW, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border.subtle, backgroundColor: COLORS.background.paper },
  moduleGradient: { padding: SPACING.sm, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  moduleIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  moduleTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  moduleDesc: { color: COLORS.text.disabled, fontSize: FONT_SIZES.xs, marginTop: 2, textAlign: 'center' },
  chatBanner: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg, borderRadius: 16, overflow: 'hidden' },
  chatBannerGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  chatBannerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  chatBannerText: { flex: 1 },
  chatBannerTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  chatBannerSub: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs, marginTop: 2 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg, marginTop: SPACING.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, backgroundColor: COLORS.background.paper, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border.subtle, gap: SPACING.sm },
  settingsText: { flex: 1, color: COLORS.text.secondary, fontSize: FONT_SIZES.body },
});
