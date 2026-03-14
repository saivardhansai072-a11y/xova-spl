import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

type DashboardData = {
  greeting: string;
  daily_mission: { title: string; progress: number; target: number };
  stats: { streak: number; questions_answered: number; accuracy: number; topics_mastered: number };
  credits: { plan: string; used: number; max: number; remaining: number };
};

const MODULE_CARDS = [
  { id: 'aptitude', title: 'Aptitude\nPractice', icon: 'brain', color: COLORS.primary.main, route: '/(tabs)/aptitude' },
  { id: 'interview', title: 'Interview\nTraining', icon: 'account-tie', color: COLORS.accent.info, route: '/interview' },
  { id: 'career', title: 'Career\nGuidance', icon: 'compass-outline', color: COLORS.accent.success, route: '/career' },
  { id: 'startup', title: 'Startup\nMentor', icon: 'rocket-launch-outline', color: COLORS.accent.warning, route: '/startup' },
  { id: 'community', title: 'Community\nHub', icon: 'account-group-outline', color: COLORS.secondary.main, route: '/community' },
  { id: 'settings', title: 'Settings', icon: 'cog-outline', color: COLORS.text.secondary, route: '/settings' },
];

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch (e) { console.log('Dashboard fetch error:', e); }
  }, [token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = async () => { setRefreshing(true); await fetchDashboard(); setRefreshing(false); };

  const missionProgress = data ? data.daily_mission.progress / data.daily_mission.target : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050505', '#0A0A1A', '#050505']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary.main} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeLabel}>XOVA AI MENTOR</Text>
              <Text style={styles.greeting}>{data?.greeting || `Welcome, ${user?.name || 'Student'}!`}</Text>
            </View>
            <TouchableOpacity testID="mentor-avatar-btn" style={styles.avatarBtn} onPress={() => router.push('/(tabs)/chat')}>
              <MaterialCommunityIcons name="robot-happy-outline" size={28} color={COLORS.primary.main} />
            </TouchableOpacity>
          </View>

          {/* Streak & Credits Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { borderColor: COLORS.accent.warning }]}>
              <MaterialCommunityIcons name="fire" size={18} color={COLORS.accent.warning} />
              <Text style={styles.statPillText}>{data?.stats.streak || 0} Day Streak</Text>
            </View>
            <View style={[styles.statPill, { borderColor: COLORS.primary.main }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={COLORS.primary.main} />
              <Text style={styles.statPillText}>{data?.credits.remaining ?? 10} Credits Left</Text>
            </View>
          </View>

          {/* Daily Mission Card */}
          <View style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <MaterialCommunityIcons name="target" size={20} color={COLORS.primary.main} />
              <Text style={styles.missionTitle}>Daily Mission</Text>
            </View>
            <Text style={styles.missionDesc}>{data?.daily_mission.title || 'Complete 5 Aptitude Questions'}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(missionProgress * 100, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{data?.daily_mission.progress || 0} / {data?.daily_mission.target || 5}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Questions', value: data?.stats.questions_answered || 0, icon: 'help-circle', color: COLORS.primary.main },
              { label: 'Accuracy', value: `${data?.stats.accuracy || 0}%`, icon: 'bullseye-arrow', color: COLORS.accent.success },
              { label: 'Topics', value: data?.stats.topics_mastered || 0, icon: 'bookmark-check', color: COLORS.accent.warning },
              { label: 'Plan', value: (data?.credits.plan || 'free').toUpperCase(), icon: 'diamond-stone', color: COLORS.secondary.main },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <MaterialCommunityIcons name={s.icon as any} size={24} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Access Modules */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.moduleGrid}>
            {MODULE_CARDS.map((m) => (
              <TouchableOpacity
                key={m.id}
                testID={`module-${m.id}-btn`}
                style={[styles.moduleCard, { borderColor: m.color + '40' }]}
                onPress={() => router.push(m.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.moduleIconBg, { backgroundColor: m.color + '15' }]}>
                  <MaterialCommunityIcons name={m.icon as any} size={28} color={m.color} />
                </View>
                <Text style={styles.moduleTitle}>{m.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Chat CTA */}
          <TouchableOpacity
            testID="chat-cta-btn"
            style={styles.chatCta}
            onPress={() => router.push('/(tabs)/chat')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[COLORS.primary.dark, COLORS.secondary.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chatCtaGradient}>
              <MaterialCommunityIcons name="robot-happy-outline" size={32} color={COLORS.text.primary} />
              <View style={styles.chatCtaText}>
                <Text style={styles.chatCtaTitle}>Talk to XOVA</Text>
                <Text style={styles.chatCtaSub}>Ask anything - studies, career, startups</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.text.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const cardW = (width - SPACING.lg * 2 - SPACING.md) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.lg },
  welcomeLabel: { fontSize: FONT_SIZES.xs, color: COLORS.primary.main, letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  greeting: { fontSize: FONT_SIZES.xl, color: COLORS.text.primary, fontWeight: '700', maxWidth: width * 0.7 },
  avatarBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,243,255,0.1)', borderWidth: 1.5, borderColor: COLORS.primary.main, justifyContent: 'center', alignItems: 'center', ...SHADOWS.neonCyan },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)', gap: 6 },
  statPillText: { color: COLORS.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  missionCard: { backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle, marginBottom: SPACING.lg },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  missionTitle: { color: COLORS.primary.main, fontSize: FONT_SIZES.md, fontWeight: '700', letterSpacing: 1 },
  missionDesc: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, marginBottom: 12 },
  progressBarBg: { height: 6, backgroundColor: COLORS.background.subtle, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary.main, borderRadius: 3 },
  progressText: { color: COLORS.text.disabled, fontSize: FONT_SIZES.sm, textAlign: 'right', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { width: (width - SPACING.lg * 2 - SPACING.sm * 3) / 4, backgroundColor: COLORS.background.paper, borderRadius: 12, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border.subtle },
  statValue: { fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.text.disabled, marginTop: 2 },
  sectionTitle: { fontSize: FONT_SIZES.lg, color: COLORS.text.primary, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.md },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  moduleCard: { width: cardW, backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.md, borderWidth: 1, alignItems: 'center' },
  moduleIconBg: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  moduleTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  chatCta: { borderRadius: 16, overflow: 'hidden', marginBottom: SPACING.lg },
  chatCtaGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  chatCtaText: { flex: 1 },
  chatCtaTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  chatCtaSub: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 2 },
});
