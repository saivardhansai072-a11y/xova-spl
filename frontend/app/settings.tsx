import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, API_URL } from '../src/constants/theme';
import { ALL_CHARACTERS, CharacterType, getCharactersByCategory } from '../src/constants/characters';
import MentorAvatar from '../src/components/MentorAvatar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

const PERSONALITIES = [
  { id: 'teacher', name: 'Teacher', icon: 'school', desc: 'Patient & thorough' },
  { id: 'friendly', name: 'Friendly', icon: 'emoticon-happy', desc: 'Warm & encouraging' },
  { id: 'motivator', name: 'Motivator', icon: 'fire', desc: 'Energetic & uplifting' },
  { id: 'strict', name: 'Strict', icon: 'shield-check', desc: 'Direct & demanding' },
  { id: 'supportive', name: 'Supportive', icon: 'heart', desc: 'Empathetic & patient' },
];

export default function SettingsScreen() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [selectedChar, setSelectedChar] = useState(user?.mentor_character || 'zero_two');
  const [selectedPersonality, setSelectedPersonality] = useState(user?.mentor_personality || 'friendly');
  const [saving, setSaving] = useState(false);

  const customChars = getCharactersByCategory('custom').filter(c => c.id !== 'custom');
  const popularChars = getCharactersByCategory('popular').filter(c => c.id !== 'custom');

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mentor_character: selectedChar, 
          mentor_personality: selectedPersonality 
        }),
      });
      await refreshUser();
      router.back();
    } catch (e) {
      console.error('Save settings error:', e);
    }
    setSaving(false);
  };

  const renderCharacterCard = (char: CharacterType, isSelected: boolean) => (
    <TouchableOpacity
      key={char.id}
      testID={`char-${char.id}-btn`}
      style={[styles.charCard, isSelected && { borderColor: char.color, borderWidth: 2 }]}
      onPress={() => setSelectedChar(char.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[char.color + '20', 'transparent']}
        style={styles.charGradient}
      >
        {char.image ? (
          <Image source={{ uri: char.image }} style={styles.charImage} resizeMode="cover" />
        ) : (
          <View style={[styles.charPlaceholder, { backgroundColor: char.color + '30' }]}>
            <MaterialCommunityIcons name="account-plus" size={40} color={char.color} />
          </View>
        )}
        
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: char.color }]}>
            <MaterialCommunityIcons name="check" size={14} color="#fff" />
          </View>
        )}
        
        <View style={styles.charInfo}>
          <Text style={[styles.charName, { color: char.color }]}>{char.name}</Text>
          <Text style={styles.charDesc}>{char.description}</Text>
          <View style={styles.charMeta}>
            <MaterialCommunityIcons 
              name={char.gender === 'female' ? 'gender-female' : 'gender-male'} 
              size={12} 
              color={char.gender === 'female' ? '#FF6B9D' : '#3A86FF'} 
            />
            <Text style={styles.charGender}>{char.gender === 'female' ? 'Girl' : 'Boy'} Voice</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const selectedCharacter = ALL_CHARACTERS.find(c => c.id === selectedChar);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customize Mentor</Text>
          <TouchableOpacity testID="save-btn" onPress={save} disabled={saving} style={styles.saveBtn}>
            <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Preview */}
          <LinearGradient colors={['#0A0A2E', '#050510']} style={styles.previewSection}>
            <MentorAvatar characterId={selectedChar} size="large" showName speaking={false} />
            <Text style={styles.previewLabel}>
              {selectedCharacter?.name || 'Select Character'} • {selectedPersonality.charAt(0).toUpperCase() + selectedPersonality.slice(1)}
            </Text>
          </LinearGradient>

          {/* Character Selection */}
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="account-heart" size={18} color={COLORS.primary.main} /> Your Characters
          </Text>
          <Text style={styles.sectionSub}>Custom anime characters with unique voices</Text>
          <View style={styles.charGrid}>
            {customChars.map(char => renderCharacterCard(char, selectedChar === char.id))}
          </View>

          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="star" size={18} color={COLORS.accent.warning} /> Popular Characters
          </Text>
          <Text style={styles.sectionSub}>Famous anime heroes as your mentor</Text>
          <View style={styles.charGrid}>
            {popularChars.map(char => renderCharacterCard(char, selectedChar === char.id))}
          </View>

          {/* Personality Selection */}
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="brain" size={18} color={COLORS.secondary.main} /> Mentor Personality
          </Text>
          <Text style={styles.sectionSub}>How should your mentor communicate?</Text>
          <View style={styles.personalityGrid}>
            {PERSONALITIES.map(p => (
              <TouchableOpacity
                key={p.id}
                testID={`personality-${p.id}-btn`}
                style={[styles.personalityCard, selectedPersonality === p.id && styles.personalityCardActive]}
                onPress={() => setSelectedPersonality(p.id)}
              >
                <MaterialCommunityIcons 
                  name={p.icon as any} 
                  size={24} 
                  color={selectedPersonality === p.id ? COLORS.primary.main : COLORS.text.secondary} 
                />
                <Text style={[styles.personalityName, selectedPersonality === p.id && { color: COLORS.primary.main }]}>
                  {p.name}
                </Text>
                <Text style={styles.personalityDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.accent.info} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Voice & Personality</Text>
              <Text style={styles.infoDesc}>
                Each character has a unique AI voice powered by ElevenLabs. 
                The personality affects how your mentor speaks and responds!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.md,
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border.subtle 
  },
  backBtn: { padding: 4 },
  headerTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.primary.main + '20', borderRadius: 12 },
  saveText: { color: COLORS.primary.main, fontWeight: '700', fontSize: FONT_SIZES.md },
  scroll: { paddingBottom: 100 },
  previewSection: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 20,
  },
  previewLabel: { 
    color: COLORS.text.secondary, 
    fontSize: FONT_SIZES.md, 
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  sectionTitle: { 
    color: COLORS.text.primary, 
    fontSize: FONT_SIZES.lg, 
    fontWeight: '700', 
    marginHorizontal: SPACING.lg, 
    marginTop: SPACING.xl,
  },
  sectionSub: { 
    color: COLORS.text.disabled, 
    fontSize: FONT_SIZES.sm, 
    marginHorizontal: SPACING.lg, 
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  charGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: SPACING.lg, 
    gap: SPACING.md,
  },
  charCard: { 
    width: CARD_WIDTH, 
    borderRadius: 16, 
    overflow: 'hidden', 
    backgroundColor: COLORS.background.paper, 
    borderWidth: 1, 
    borderColor: COLORS.border.subtle,
  },
  charGradient: { padding: 0 },
  charImage: { 
    width: '100%', 
    height: CARD_WIDTH, 
    borderTopLeftRadius: 15, 
    borderTopRightRadius: 15,
  },
  charPlaceholder: { 
    width: '100%', 
    height: CARD_WIDTH, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderTopLeftRadius: 15, 
    borderTopRightRadius: 15,
  },
  selectedBadge: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  charInfo: { padding: SPACING.sm },
  charName: { fontSize: FONT_SIZES.body, fontWeight: '700' },
  charDesc: { color: COLORS.text.secondary, fontSize: FONT_SIZES.xs, marginTop: 2 },
  charMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  charGender: { color: COLORS.text.disabled, fontSize: FONT_SIZES.xs },
  personalityGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: SPACING.lg, 
    gap: SPACING.sm,
  },
  personalityCard: { 
    width: (width - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    backgroundColor: COLORS.background.paper, 
    borderRadius: 14, 
    padding: SPACING.sm, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: COLORS.border.subtle,
  },
  personalityCardActive: { 
    borderColor: COLORS.primary.main, 
    backgroundColor: COLORS.primary.main + '10',
  },
  personalityName: { 
    color: COLORS.text.primary, 
    fontSize: FONT_SIZES.sm, 
    fontWeight: '700', 
    marginTop: 6,
  },
  personalityDesc: { 
    color: COLORS.text.disabled, 
    fontSize: 9, 
    textAlign: 'center', 
    marginTop: 2,
  },
  infoCard: { 
    flexDirection: 'row', 
    marginHorizontal: SPACING.lg, 
    marginTop: SPACING.xl,
    backgroundColor: COLORS.accent.info + '10', 
    borderRadius: 14, 
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent.info + '30',
    gap: SPACING.sm,
  },
  infoText: { flex: 1 },
  infoTitle: { color: COLORS.accent.info, fontSize: FONT_SIZES.md, fontWeight: '700' },
  infoDesc: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 4, lineHeight: 18 },
});
