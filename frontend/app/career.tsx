import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../src/constants/theme';

const FIELDS = [
  { id: 'Software Engineering', icon: 'code-braces', color: COLORS.primary.main },
  { id: 'Data Science', icon: 'chart-scatter-plot', color: COLORS.accent.success },
  { id: 'Artificial Intelligence', icon: 'robot', color: COLORS.secondary.main },
  { id: 'Startup Entrepreneurship', icon: 'rocket-launch', color: COLORS.accent.warning },
  { id: 'Product Management', icon: 'view-dashboard', color: COLORS.accent.info },
  { id: 'Cybersecurity', icon: 'shield-lock', color: COLORS.accent.error },
];

export default function CareerScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [guidance, setGuidance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getGuidance = async (field: string) => {
    setSelected(field); setLoading(true); setGuidance(null);
    try {
      const res = await fetch(`${API_URL}/api/career/guidance`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ field }),
      });
      if (res.ok) { const d = await res.json(); setGuidance(d.guidance); }
    } catch (e) {}
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Career Guidance</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>Select a field to get an AI-generated career roadmap</Text>
          <View style={styles.fieldGrid}>
            {FIELDS.map(f => (
              <TouchableOpacity key={f.id} testID={`field-${f.id}-btn`} style={[styles.fieldCard, selected === f.id && { borderColor: f.color }]} onPress={() => getGuidance(f.id)} activeOpacity={0.7}>
                <MaterialCommunityIcons name={f.icon as any} size={28} color={f.color} />
                <Text style={styles.fieldName}>{f.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {loading && <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.primary.main} /><Text style={styles.loadText}>Generating roadmap...</Text></View>}
          {guidance && (
            <View style={styles.guidanceCard}>
              <Text style={styles.guidanceTitle}>{selected}</Text>
              <Text style={styles.overview}>{guidance.overview}</Text>
              <Text style={styles.sectionLabel}>Key Skills</Text>
              {guidance.skills?.map((s: string, i: number) => (
                <View key={i} style={styles.skillRow}><View style={styles.dot} /><Text style={styles.skillText}>{s}</Text></View>
              ))}
              <Text style={styles.sectionLabel}>6-Month Roadmap</Text>
              {guidance.roadmap?.map((r: any, i: number) => (
                <View key={i} style={styles.roadmapItem}>
                  <View style={styles.monthBadge}><Text style={styles.monthText}>M{r.month}</Text></View>
                  <View style={styles.roadmapInfo}>
                    <Text style={styles.roadmapFocus}>{r.focus}</Text>
                    {r.tasks?.map((t: string, j: number) => <Text key={j} style={styles.taskText}>• {t}</Text>)}
                  </View>
                </View>
              ))}
              <Text style={styles.sectionLabel}>Resources</Text>
              {guidance.resources?.map((r: string, i: number) => (
                <View key={i} style={styles.skillRow}><MaterialCommunityIcons name="book-outline" size={16} color={COLORS.primary.main} /><Text style={styles.skillText}>{r}</Text></View>
              ))}
            </View>
          )}
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
  subtitle: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, marginBottom: SPACING.lg },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  fieldCard: { width: '48%', backgroundColor: COLORS.background.paper, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle, alignItems: 'center', gap: 8 },
  fieldName: { color: COLORS.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '600', textAlign: 'center' },
  loadingBox: { alignItems: 'center', paddingVertical: SPACING.xl },
  loadText: { color: COLORS.primary.main, marginTop: SPACING.sm },
  guidanceCard: { backgroundColor: COLORS.background.paper, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.border.subtle },
  guidanceTitle: { color: COLORS.primary.main, fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.sm },
  overview: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, lineHeight: 22, marginBottom: SPACING.md },
  sectionLabel: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, fontWeight: '700', marginTop: SPACING.md, marginBottom: SPACING.sm },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary.main },
  skillText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.md },
  roadmapItem: { flexDirection: 'row', marginBottom: SPACING.md, gap: SPACING.sm },
  monthBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary.main + '15', justifyContent: 'center', alignItems: 'center' },
  monthText: { color: COLORS.primary.main, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  roadmapInfo: { flex: 1 },
  roadmapFocus: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, fontWeight: '600' },
  taskText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 2 },
});
