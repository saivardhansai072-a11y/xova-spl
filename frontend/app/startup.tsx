import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../src/constants/theme';

export default function StartupScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    if (!idea.trim()) return;
    setLoading(true); setAdvice(null);
    try {
      const res = await fetch(`${API_URL}/api/startup/advice`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      if (res.ok) { const d = await res.json(); setAdvice(d.advice); }
    } catch (e) {}
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <TouchableOpacity testID="back-btn" onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} /></TouchableOpacity>
            <Text style={styles.headerTitle}>Startup Mentor</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.inputCard}>
              <MaterialCommunityIcons name="rocket-launch-outline" size={32} color={COLORS.accent.warning} />
              <Text style={styles.inputTitle}>Describe Your Startup Idea</Text>
              <Text style={styles.inputSub}>Our AI will validate and provide actionable advice</Text>
              <TextInput testID="idea-input" style={styles.ideaInput} placeholder="e.g., An AI-powered platform that helps students find internships based on their skills..." placeholderTextColor={COLORS.text.disabled} value={idea} onChangeText={setIdea} multiline textAlignVertical="top" />
              <TouchableOpacity testID="analyze-btn" style={[styles.analyzeBtn, !idea.trim() && { opacity: 0.4 }]} onPress={getAdvice} disabled={!idea.trim() || loading}>
                {loading ? <ActivityIndicator color={COLORS.background.default} /> : <><MaterialCommunityIcons name="lightning-bolt" size={18} color={COLORS.background.default} /><Text style={styles.analyzeBtnText}>Analyze Idea</Text></>}
              </TouchableOpacity>
            </View>

            {advice && (
              <View style={styles.adviceCard}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreValue}>{advice.score}</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
                <Text style={styles.marketText}>{advice.market}</Text>

                {[
                  { title: 'Strengths', items: advice.strengths, icon: 'check-circle', color: COLORS.accent.success },
                  { title: 'Challenges', items: advice.challenges, icon: 'alert-circle', color: COLORS.accent.warning },
                  { title: 'Development Steps', items: advice.dev_steps, icon: 'numeric', color: COLORS.primary.main },
                  { title: 'Marketing Strategy', items: advice.marketing, icon: 'bullhorn', color: COLORS.accent.info },
                  { title: 'Growth Strategy', items: advice.growth, icon: 'trending-up', color: COLORS.secondary.main },
                ].map(section => (
                  <View key={section.title} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
                    {section.items?.map((item: string, i: number) => (
                      <View key={i} style={styles.itemRow}>
                        <MaterialCommunityIcons name={section.icon as any} size={16} color={section.color} />
                        <Text style={styles.itemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  inputCard: { backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border.subtle, alignItems: 'center' },
  inputTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700', marginTop: SPACING.sm },
  inputSub: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 4, textAlign: 'center' },
  ideaInput: { width: '100%', backgroundColor: COLORS.background.subtle, borderRadius: 14, padding: SPACING.md, color: COLORS.text.primary, fontSize: FONT_SIZES.body, minHeight: 100, borderWidth: 1, borderColor: COLORS.border.default, marginTop: SPACING.md },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent.warning, height: 48, borderRadius: 14, width: '100%', marginTop: SPACING.md, gap: 8 },
  analyzeBtnText: { color: COLORS.background.default, fontWeight: '700' },
  adviceCard: { backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.border.subtle, alignItems: 'center' },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.accent.warning, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { color: COLORS.accent.warning, fontSize: FONT_SIZES.title, fontWeight: '800' },
  scoreLabel: { color: COLORS.text.secondary, fontSize: FONT_SIZES.xs },
  marketText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, textAlign: 'center', marginTop: SPACING.md, lineHeight: 22 },
  section: { width: '100%', marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.body, fontWeight: '700', marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  itemText: { flex: 1, color: COLORS.text.secondary, fontSize: FONT_SIZES.md, lineHeight: 20 },
});
