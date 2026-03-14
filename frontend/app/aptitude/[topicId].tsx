import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../../src/constants/theme';

type Question = { question_id: string; topic_id: string; difficulty: string; question: string; options: string[]; correct_answer: number; explanation: string };

export default function TopicQuestionsScreen() {
  const { topicId, topicName } = useLocalSearchParams<{ topicId: string; topicName: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState('beginner');
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => { fetchQuestions(); }, [difficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/aptitude/topics/${topicId}/questions?difficulty=${difficulty}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setQuestions(d.questions || []);
        setCurrentIdx(0); setSelected(null); setResult(null);
      }
    } catch (e) {}
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (selected === null || !questions[currentIdx]) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/aptitude/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, question_id: questions[currentIdx].question_id, selected_answer: selected }),
      });
      if (res.ok) {
        const d = await res.json();
        setResult(d);
        setScore(prev => ({ correct: prev.correct + (d.is_correct ? 1 : 0), total: prev.total + 1 }));
      }
    } catch (e) {}
    setSubmitting(false);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelected(null); setResult(null);
    }
  };

  const q = questions[currentIdx];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{topicName || 'Topic'}</Text>
            <Text style={styles.headerSub}>Q {currentIdx + 1} / {questions.length}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{score.correct}/{score.total}</Text>
          </View>
        </View>

        {/* Difficulty Tabs */}
        <View style={styles.diffRow}>
          {['beginner', 'intermediate', 'advanced'].map(d => (
            <TouchableOpacity
              key={d}
              testID={`diff-${d}-btn`}
              style={[styles.diffChip, difficulty === d && styles.diffChipActive]}
              onPress={() => { setDifficulty(d); setScore({ correct: 0, total: 0 }); }}
            >
              <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
            <Text style={styles.loadText}>Loading questions...</Text>
          </View>
        ) : !q ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="brain" size={64} color={COLORS.primary.main} />
            <Text style={styles.emptyTitle}>Generating Questions...</Text>
            <Text style={styles.emptySub}>AI is creating new questions for this topic. This may take a moment.</Text>
            <TouchableOpacity testID="retry-btn" style={styles.retryBtn} onPress={fetchQuestions}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Question Card */}
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{q.question}</Text>
            </View>

            {/* Options */}
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = result && result.correct_answer === i;
              const isWrong = result && isSelected && !result.is_correct && result.correct_answer !== i;
              let optStyle = styles.option;
              let optColor = COLORS.text.primary;
              if (result) {
                if (isCorrect) { optStyle = styles.optionCorrect; optColor = COLORS.accent.success; }
                else if (isWrong) { optStyle = styles.optionWrong; optColor = COLORS.accent.error; }
              } else if (isSelected) { optStyle = styles.optionSelected; optColor = COLORS.primary.main; }
              return (
                <TouchableOpacity
                  key={i}
                  testID={`option-${i}-btn`}
                  style={[styles.optionBase, optStyle]}
                  onPress={() => !result && setSelected(i)}
                  disabled={!!result}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionCircle, { borderColor: optColor }]}>
                    <Text style={[styles.optionLetter, { color: optColor }]}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: optColor }]}>{opt}</Text>
                  {result && isCorrect && <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.accent.success} />}
                  {result && isWrong && <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.accent.error} />}
                </TouchableOpacity>
              );
            })}

            {/* Explanation */}
            {result && (
              <View style={[styles.explanationCard, result.is_correct ? styles.explanationCorrect : styles.explanationWrong]}>
                <View style={styles.explanationHeader}>
                  <MaterialCommunityIcons name={result.is_correct ? 'check-circle' : 'information'} size={20} color={result.is_correct ? COLORS.accent.success : COLORS.accent.warning} />
                  <Text style={[styles.explanationTitle, { color: result.is_correct ? COLORS.accent.success : COLORS.accent.warning }]}>
                    {result.is_correct ? 'Correct!' : 'Explanation'}
                  </Text>
                </View>
                <Text style={styles.explanationText}>{result.explanation}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {!result ? (
                <TouchableOpacity testID="submit-answer-btn" style={[styles.submitBtn, selected === null && styles.submitBtnDisabled]} onPress={submitAnswer} disabled={selected === null || submitting}>
                  {submitting ? <ActivityIndicator color={COLORS.background.default} /> : <Text style={styles.submitText}>Submit Answer</Text>}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity testID="next-question-btn" style={styles.nextBtn} onPress={currentIdx < questions.length - 1 ? nextQuestion : fetchQuestions}>
                  <Text style={styles.nextText}>{currentIdx < questions.length - 1 ? 'Next Question' : 'Load More'}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.background.default} />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border.subtle },
  backBtn: { padding: 8 },
  headerInfo: { flex: 1, marginLeft: SPACING.sm },
  headerTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  headerSub: { color: COLORS.text.secondary, fontSize: FONT_SIZES.xs },
  scoreBadge: { backgroundColor: COLORS.primary.main + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary.main + '50' },
  scoreText: { color: COLORS.primary.main, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  diffRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: 8 },
  diffChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.background.paper, borderWidth: 1, borderColor: COLORS.border.subtle, alignItems: 'center' },
  diffChipActive: { backgroundColor: COLORS.primary.main, borderColor: COLORS.primary.main },
  diffText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  diffTextActive: { color: COLORS.background.default },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadText: { color: COLORS.primary.main, fontSize: FONT_SIZES.body, marginTop: SPACING.md },
  emptyTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.xl, fontWeight: '700', marginTop: SPACING.lg },
  emptySub: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, textAlign: 'center', marginTop: SPACING.sm },
  retryBtn: { marginTop: SPACING.lg, backgroundColor: COLORS.primary.main, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: COLORS.background.default, fontWeight: '700' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  questionCard: { backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle },
  questionText: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '600', lineHeight: 26 },
  optionBase: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: 14, marginTop: SPACING.sm, borderWidth: 1.5, gap: SPACING.sm },
  option: { backgroundColor: COLORS.background.paper, borderColor: COLORS.border.subtle },
  optionSelected: { backgroundColor: COLORS.primary.main + '10', borderColor: COLORS.primary.main },
  optionCorrect: { backgroundColor: COLORS.accent.success + '10', borderColor: COLORS.accent.success },
  optionWrong: { backgroundColor: COLORS.accent.error + '10', borderColor: COLORS.accent.error },
  optionCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  optionLetter: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  optionText: { flex: 1, fontSize: FONT_SIZES.body, lineHeight: 22 },
  explanationCard: { borderRadius: 14, padding: SPACING.md, marginTop: SPACING.md, borderWidth: 1 },
  explanationCorrect: { backgroundColor: COLORS.accent.success + '08', borderColor: COLORS.accent.success + '30' },
  explanationWrong: { backgroundColor: COLORS.accent.warning + '08', borderColor: COLORS.accent.warning + '30' },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  explanationTitle: { fontSize: FONT_SIZES.body, fontWeight: '700' },
  explanationText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.md, lineHeight: 22 },
  actionRow: { marginTop: SPACING.lg },
  submitBtn: { backgroundColor: COLORS.primary.main, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', ...SHADOWS.neonCyan },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: COLORS.background.default, fontSize: FONT_SIZES.body, fontWeight: '700' },
  nextBtn: { backgroundColor: COLORS.primary.main, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...SHADOWS.neonCyan },
  nextText: { color: COLORS.background.default, fontSize: FONT_SIZES.body, fontWeight: '700' },
});
