import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, API_URL } from '../src/constants/theme';

const PERSONALITIES = ['teacher', 'friendly', 'motivator', 'strict', 'startup_coach', 'supportive'];
const VOICES = ['female', 'male'];
const STYLES = ['cyberpunk', 'anime', 'jarvis'];

export default function SettingsScreen() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [personality, setPersonality] = useState(user?.mentor_personality || 'friendly');
  const [voice, setVoice] = useState(user?.mentor_voice || 'female');
  const [style, setStyle] = useState(user?.mentor_style || 'cyberpunk');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentor_personality: personality, mentor_voice: voice, mentor_style: style }),
      });
      await refreshUser();
    } catch (e) {}
    setSaving(false);
  };

  const renderChips = (items: string[], selected: string, onSelect: (v: string) => void, label: string, icon: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon as any} size={20} color={COLORS.primary.main} />
        <Text style={styles.sectionTitle}>{label}</Text>
      </View>
      <View style={styles.chipRow}>
        {items.map(item => (
          <TouchableOpacity key={item} testID={`${label.toLowerCase().replace(' ', '-')}-${item}-btn`} style={[styles.chip, selected === item && styles.chipActive]} onPress={() => onSelect(item)}>
            <Text style={[styles.chipText, selected === item && styles.chipTextActive]}>{item.charAt(0).toUpperCase() + item.slice(1).replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {renderChips(PERSONALITIES, personality, setPersonality, 'Mentor Personality', 'account-heart')}
          {renderChips(VOICES, voice, setVoice, 'Mentor Voice', 'microphone')}
          {renderChips(STYLES, style, setStyle, 'Mentor Style', 'palette')}

          <TouchableOpacity testID="save-settings-btn" style={styles.saveBtn} onPress={save} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border.subtle },
  headerTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.xl, fontWeight: '700' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 60 },
  section: { marginTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.background.paper, borderWidth: 1, borderColor: COLORS.border.subtle },
  chipActive: { backgroundColor: COLORS.primary.main + '20', borderColor: COLORS.primary.main },
  chipText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.md, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary.main },
  saveBtn: { backgroundColor: COLORS.primary.main, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  saveBtnText: { color: COLORS.background.default, fontSize: FONT_SIZES.body, fontWeight: '700' },
});
