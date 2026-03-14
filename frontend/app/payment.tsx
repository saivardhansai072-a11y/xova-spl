import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../src/constants/theme';

const PLANS = [
  {
    id: 'free', name: 'Free', price: '₹0', period: '', credits: '10 AI responses/day',
    features: ['Basic AI Chat', '10 daily credits', 'Aptitude Practice', 'Community Access'],
    color: COLORS.text.secondary, gradient: ['#333', '#222'],
  },
  {
    id: 'lite', name: 'Lite', price: '₹20', period: '/month', credits: '40 AI responses/day',
    features: ['Everything in Free', '40 daily credits', 'Voice Interaction', 'Interview Practice', 'Priority Support'],
    color: COLORS.accent.info, gradient: ['#1a3a5c', '#0d1f33'],
    badge: 'Popular',
  },
  {
    id: 'pro', name: 'Pro', price: '₹35', period: '/month', credits: '80 AI responses/day',
    features: ['Everything in Lite', '80 daily credits', 'Career Roadmaps', 'Startup Mentor', 'Advanced Analytics', 'Custom Mentor'],
    color: COLORS.primary.main, gradient: ['#003333', '#001a1a'],
    badge: 'Best Value',
  },
  {
    id: 'year', name: 'Year', price: '₹349', period: '/year', credits: 'Unlimited responses',
    features: ['Everything in Pro', 'Unlimited credits', 'All Premium Features', 'Early Access', 'Priority Queue', 'Exclusive Content'],
    color: COLORS.accent.warning, gradient: ['#332200', '#1a1100'],
    badge: 'Save 17%',
  },
];

export default function PaymentScreen() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState('');

  const handleUpgrade = async (planId: string) => {
    if (planId === user?.plan) return;
    setUpgrading(planId);
    try {
      // Mock payment - in production, integrate Razorpay here
      const res = await fetch(`${API_URL}/api/user/upgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      if (res.ok) {
        await refreshUser();
        if (Platform.OS === 'web') {
          alert(`Successfully upgraded to ${planId.toUpperCase()} plan!`);
        }
      }
    } catch (e) {}
    setUpgrading('');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>Unlock the full power of your AI mentor</Text>
          <View style={styles.razorpayBadge}>
            <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.accent.success} />
            <Text style={styles.razorpayText}>Razorpay Secured Payments (Coming Soon)</Text>
          </View>

          {PLANS.map((plan) => {
            const isCurrent = user?.plan === plan.id;
            return (
              <View key={plan.id} style={styles.planCard}>
                <LinearGradient colors={plan.gradient as [string, string]} style={styles.planGradient}>
                  {plan.badge && (
                    <View style={[styles.badge, { backgroundColor: plan.color + '20', borderColor: plan.color }]}>
                      <Text style={[styles.badgeText, { color: plan.color }]}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>{plan.price}</Text>
                      <Text style={styles.period}>{plan.period}</Text>
                    </View>
                    <Text style={styles.credits}>{plan.credits}</Text>
                  </View>
                  <View style={styles.divider} />
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={plan.color} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    testID={`subscribe-${plan.id}-btn`}
                    style={[styles.subscribeBtn, { backgroundColor: isCurrent ? 'transparent' : plan.color, borderWidth: isCurrent ? 1 : 0, borderColor: plan.color }]}
                    onPress={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || upgrading !== ''}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.subscribeBtnText, { color: isCurrent ? plan.color : COLORS.background.default }]}>
                      {upgrading === plan.id ? 'Processing...' : isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Subscribe'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            );
          })}

          <Text style={styles.disclaimer}>
            * Payment integration with Razorpay will be available soon. Currently using mock payment for demo purposes.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md },
  headerTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.xl, fontWeight: '700' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 60 },
  subtitle: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, marginBottom: SPACING.sm },
  razorpayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.lg, backgroundColor: COLORS.accent.success + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  razorpayText: { color: COLORS.accent.success, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  planCard: { borderRadius: 18, overflow: 'hidden', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle },
  planGradient: { padding: SPACING.lg },
  badge: { position: 'absolute', top: SPACING.md, right: SPACING.md, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  planHeader: { marginBottom: SPACING.md },
  planName: { fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  price: { color: COLORS.text.primary, fontSize: FONT_SIZES.hero, fontWeight: '800' },
  period: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, marginLeft: 4 },
  credits: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.border.subtle, marginVertical: SPACING.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  featureText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.md },
  subscribeBtn: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md },
  subscribeBtnText: { fontSize: FONT_SIZES.body, fontWeight: '700' },
  disclaimer: { color: COLORS.text.disabled, fontSize: FONT_SIZES.xs, marginTop: SPACING.md, textAlign: 'center', lineHeight: 18 },
});
