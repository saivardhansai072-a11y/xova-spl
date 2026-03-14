import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../src/constants/theme';

const CATEGORIES = [
  { id: 'hr', name: 'HR Interview', icon: 'account-tie', color: COLORS.accent.info },
  { id: 'technical', name: 'Technical', icon: 'code-braces', color: COLORS.primary.main },
  { id: 'behavioral', name: 'Behavioral', icon: 'heart-outline', color: COLORS.accent.success },
  { id: 'startup', name: 'Startup', icon: 'rocket-launch-outline', color: COLORS.accent.warning },
];

export default function InterviewScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState('hr');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingE, setLoadingE] = useState(false);

  const getQuestion = async () => {
    setLoadingQ(true); setQuestion(''); setAnswer(''); setEvaluation(null);
    try {
      const res = await fetch(`${API_URL}/api/interview/question`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      if (res.ok) { const d = await res.json(); setQuestion(d.question); }
      else if (res.status === 429) setQuestion('Daily credit limit reached. Upgrade your plan!');
    } catch (e) {}
    setLoadingQ(false);
  };

  const evaluate = async () => {
    if (!answer.trim()) return;
    setLoadingE(true);
    try {
      const res = await fetch(`${API_URL}/api/interview/evaluate`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer: answer.trim(), category }),
      });
      if (res.ok) { const d = await res.json(); setEvaluation(d.evaluation); }
    } catch (e) {}
    setLoadingE(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <TouchableOpacity testID="back-btn" onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} /></TouchableOpacity>
            <Text style={styles.headerTitle}>Interview Practice</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Categories */}
            <View style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.id} testID={`cat-${c.id}-btn`} style={[styles.catCard, category === c.id && { borderColor: c.color }]} onPress={() => { setCategory(c.id); setQuestion(''); setAnswer(''); setEvaluation(null); }}>
                  <MaterialCommunityIcons name={c.icon as any} size={24} color={c.color} />
                  <Text style={[styles.catName, { color: category === c.id ? c.color : COLORS.text.secondary }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Get Question */}
            <TouchableOpacity testID="get-question-btn" style={styles.getBtn} onPress={getQuestion} disabled={loadingQ}>
              {loadingQ ? <ActivityIndicator color={COLORS.background.default} /> : <><MaterialCommunityIcons name="message-question-outline" size={20} color={COLORS.background.default} /><Text style={styles.getBtnText}>Get Interview Question</Text></>}
            </TouchableOpacity>

            {/* Question Display */}
            {question ? (
              <View style={styles.questionCard}>
                <MaterialCommunityIcons name="robot-happy-outline" size={20} color={COLORS.primary.main} />
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ) : null}

            {/* Answer Input */}
            {question && !question.includes('credit limit') && (
              <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>Your Answer</Text>
                <TextInput testID="answer-input" style={styles.answerInput} placeholder="Type your answer here..." placeholderTextColor={COLORS.text.disabled} value={answer} onChangeText={setAnswer} multiline textAlignVertical="top" />
                <TouchableOpacity testID="evaluate-btn" style={[styles.evalBtn, !answer.trim() && { opacity: 0.4 }]} onPress={evaluate} disabled={!answer.trim() || loadingE}>
                  {loadingE ? <ActivityIndicator color={COLORS.background.default} /> : <Text style={styles.evalBtnText}>Get AI Feedback</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Evaluation */}
            {evaluation && (
              <View style={styles.evalCard}>
                <Text style={styles.evalTitle}>Interview Feedback</Text>
                <View style={styles.scoreGrid}>
                  {[
                    { label: 'Clarity', value: evaluation.clarity, color: COLORS.primary.main },
                    { label: 'Confidence', value: evaluation.confidence, color: COLORS.accent.success },
                    { label: 'Structure', value: evaluation.structure, color: COLORS.accent.info },
                    { label: 'Communication', value: evaluation.communication, color: COLORS.accent.warning },
                  ].map(s => (
                    <View key={s.label} style={styles.scoreItem}>
                      <Text style={[styles.scoreValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.scoreLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.overallRow}>
                  <Text style={styles.overallLabel}>Overall Score</Text>
                  <Text style={styles.overallValue}>{evaluation.overall}/100</Text>
                </View>
                {evaluation.strengths?.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackTitle}>Strengths</Text>
                    {evaluation.strengths.map((s: string, i: number) => (
                      <View key={i} style={styles.feedbackRow}><MaterialCommunityIcons name="check" size={16} color={COLORS.accent.success} /><Text style={styles.feedbackText}>{s}</Text></View>
                    ))}
                  </View>
                )}
                {evaluation.improvements?.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackTitle}>Improvements</Text>
                    {evaluation.improvements.map((s: string, i: number) => (
                      <View key={i} style={styles.feedbackRow}><MaterialCommunityIcons name="arrow-up" size={16} color={COLORS.accent.warning} /><Text style={styles.feedbackText}>{s}</Text></View>
                    ))}
                  </View>
                )}
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
  catRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.lg },
  catCard: { flex: 1, alignItems: 'center', backgroundColor: COLORS.background.paper, borderRadius: 12, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border.subtle, gap: 4 },
  catName: { fontSize: FONT_SIZES.xs, fontWeight: '600', textAlign: 'center' },
  getBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary.main, height: 48, borderRadius: 14, gap: 8, ...SHADOWS.neonCyan },
  getBtnText: { color: COLORS.background.default, fontWeight: '700', fontSize: FONT_SIZES.body },
  questionCard: { flexDirection: 'row', backgroundColor: COLORS.background.paper, borderRadius: 14, padding: SPACING.md, marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary.main + '30', gap: SPACING.sm, alignItems: 'flex-start' },
  questionText: { flex: 1, color: COLORS.text.primary, fontSize: FONT_SIZES.body, lineHeight: 24 },
  answerSection: { marginTop: SPACING.lg },
  answerLabel: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: 8 },
  answerInput: { backgroundColor: COLORS.background.subtle, borderRadius: 14, padding: SPACING.md, color: COLORS.text.primary, fontSize: FONT_SIZES.body, minHeight: 120, borderWidth: 1, borderColor: COLORS.border.default },
  evalBtn: { backgroundColor: COLORS.secondary.main, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md, ...SHADOWS.neonPurple },
  evalBtnText: { color: COLORS.text.primary, fontWeight: '700' },
  evalCard: { backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.border.subtle },
  evalTitle: { color: COLORS.primary.main, fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: SPACING.md },
  scoreGrid: { flexDirection: 'row', gap: 8 },
  scoreItem: { flex: 1, alignItems: 'center', backgroundColor: COLORS.background.subtle, borderRadius: 10, padding: SPACING.sm },
  scoreValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  scoreLabel: { fontSize: FONT_SIZES.xs, color: COLORS.text.secondary, marginTop: 2 },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border.subtle },
  overallLabel: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, fontWeight: '600' },
  overallValue: { color: COLORS.primary.main, fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  feedbackSection: { marginTop: SPACING.md },
  feedbackTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, fontWeight: '700', marginBottom: 8 },
  feedbackRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  feedbackText: { flex: 1, color: COLORS.text.secondary, fontSize: FONT_SIZES.md, lineHeight: 20 },
});
