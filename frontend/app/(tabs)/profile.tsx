import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../../src/constants/theme';

const PLANS = [
  { id: 'free', name: 'Free', price: '₹0', credits: '10/day', color: COLORS.text.secondary },
  { id: 'lite', name: 'Lite', price: '₹20/mo', credits: '40/day', color: COLORS.accent.info },
  { id: 'pro', name: 'Pro', price: '₹35/mo', credits: '80/day', color: COLORS.primary.main },
  { id: 'year', name: 'Year', price: '₹349/yr', credits: 'Unlimited', color: COLORS.accent.warning },
];

export default function ProfileScreen() {
  const { user, token, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<any>(null);

  useEffect(() => { fetchCredits(); }, []);

  const fetchCredits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/credits`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setCredits(await res.json());
    } catch (e) {}
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const res = await fetch(`${API_URL}/api/user/upgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) { await refreshUser(); fetchCredits(); }
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Profile Header */}
          <LinearGradient colors={['#0A0A2E', '#050505']} style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="account" size={40} color={COLORS.primary.main} />
              )}
            </View>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <View style={[styles.planBadge, { borderColor: PLANS.find(p => p.id === user?.plan)?.color || COLORS.text.secondary }]}>
              <Text style={[styles.planBadgeText, { color: PLANS.find(p => p.id === user?.plan)?.color }]}>{(user?.plan || 'free').toUpperCase()} PLAN</Text>
            </View>
          </LinearGradient>

          {/* Credits Card */}
          <View style={styles.creditsCard}>
            <View style={styles.creditsHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.primary.main} />
              <Text style={styles.creditsTitle}>AI Credits</Text>
            </View>
            <View style={styles.creditsBar}>
              <View style={[styles.creditsFill, { width: `${credits ? Math.min((credits.used / credits.max) * 100, 100) : 0}%` }]} />
            </View>
            <Text style={styles.creditsText}>{credits?.remaining ?? '...'} / {credits?.max ?? '...'} remaining today</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.total_questions_answered || 0}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statValue}>{user?.total_questions_answered ? Math.round((user.total_correct / user.total_questions_answered) * 100) : 0}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.streak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>

          {/* Plans */}
          <Text style={styles.sectionTitle}>Subscription Plans</Text>
          <Text style={styles.sectionSub}>Mock payment - upgrade instantly</Text>
          {PLANS.map(plan => (
            <TouchableOpacity
              key={plan.id}
              testID={`plan-${plan.id}-btn`}
              style={[styles.planCard, user?.plan === plan.id && { borderColor: plan.color }]}
              onPress={() => handleUpgrade(plan.id)}
              disabled={user?.plan === plan.id}
              activeOpacity={0.7}
            >
              <View style={styles.planLeft}>
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                <Text style={styles.planCredits}>{plan.credits}</Text>
              </View>
              <View style={styles.planRight}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                {user?.plan === plan.id ? (
                  <View style={[styles.currentBadge, { backgroundColor: plan.color + '20' }]}>
                    <Text style={[styles.currentText, { color: plan.color }]}>Current</Text>
                  </View>
                ) : (
                  <Text style={styles.selectText}>Select</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Actions */}
          <TouchableOpacity testID="upgrade-btn" style={[styles.actionBtn, { borderColor: COLORS.primary.main + '30' }]} onPress={() => router.push('/payment')}>
            <MaterialCommunityIcons name="diamond-stone" size={22} color={COLORS.primary.main} />
            <Text style={[styles.actionText, { color: COLORS.primary.main }]}>Upgrade Plan</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary.main} />
          </TouchableOpacity>

          <TouchableOpacity testID="settings-btn" style={styles.actionBtn} onPress={() => router.push('/settings')}>
            <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.text.secondary} />
            <Text style={styles.actionText}>Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity testID="logout-btn" style={[styles.actionBtn, { borderColor: COLORS.accent.error + '30' }]} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={22} color={COLORS.accent.error} />
            <Text style={[styles.actionText, { color: COLORS.accent.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  scroll: { paddingBottom: 100 },
  profileHeader: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,243,255,0.1)', borderWidth: 2, borderColor: COLORS.primary.main, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', ...SHADOWS.neonCyan },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  userName: { color: COLORS.text.primary, fontSize: FONT_SIZES.xxl, fontWeight: '800', marginTop: SPACING.md },
  userEmail: { color: COLORS.text.secondary, fontSize: FONT_SIZES.md, marginTop: 4 },
  planBadge: { marginTop: SPACING.sm, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  planBadgeText: { fontSize: FONT_SIZES.sm, fontWeight: '700', letterSpacing: 1 },
  creditsCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg, backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle },
  creditsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  creditsTitle: { color: COLORS.primary.main, fontSize: FONT_SIZES.body, fontWeight: '700' },
  creditsBar: { height: 6, backgroundColor: COLORS.background.subtle, borderRadius: 3, overflow: 'hidden' },
  creditsFill: { height: '100%', backgroundColor: COLORS.primary.main, borderRadius: 3 },
  creditsText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 8 },
  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.lg, backgroundColor: COLORS.background.paper, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border.subtle },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border.subtle },
  statValue: { color: COLORS.text.primary, fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  statLabel: { color: COLORS.text.secondary, fontSize: FONT_SIZES.xs, marginTop: 4 },
  sectionTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700', marginHorizontal: SPACING.lg, marginTop: SPACING.xl },
  sectionSub: { color: COLORS.text.disabled, fontSize: FONT_SIZES.sm, marginHorizontal: SPACING.lg, marginTop: 4, marginBottom: SPACING.md },
  planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: COLORS.background.paper, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle },
  planLeft: {},
  planName: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  planCredits: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 2 },
  planRight: { alignItems: 'flex-end' },
  planPrice: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, fontWeight: '600' },
  currentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  currentText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  selectText: { color: COLORS.text.disabled, fontSize: FONT_SIZES.xs, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg, marginTop: SPACING.sm, backgroundColor: COLORS.background.paper, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle, gap: SPACING.sm },
  actionText: { flex: 1, color: COLORS.text.primary, fontSize: FONT_SIZES.body, fontWeight: '600' },
});
