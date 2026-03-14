import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

export default function CommunityScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <View style={styles.content}>
          <MaterialCommunityIcons name="account-group-outline" size={80} color={COLORS.secondary.main} />
          <Text style={styles.title}>Community Hub</Text>
          <Text style={styles.subtitle}>Connect with fellow learners, share knowledge, and grow together.</Text>
          <View style={styles.featureList}>
            {[
              { icon: 'forum-outline', text: 'Public Discussion Rooms' },
              { icon: 'account-multiple-outline', text: 'Private Group Chats' },
              { icon: 'message-outline', text: 'Direct Messaging' },
              { icon: 'trophy-outline', text: 'Leaderboards' },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <MaterialCommunityIcons name={f.icon as any} size={20} color={COLORS.primary.main} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md },
  headerTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.xl, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  title: { color: COLORS.text.primary, fontSize: FONT_SIZES.xxl, fontWeight: '800', marginTop: SPACING.lg },
  subtitle: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 },
  featureList: { marginTop: SPACING.xl, width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md, backgroundColor: COLORS.background.paper, borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border.subtle },
  featureText: { color: COLORS.text.primary, fontSize: FONT_SIZES.body },
  comingSoon: { marginTop: SPACING.xl, backgroundColor: COLORS.secondary.main + '20', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.secondary.main },
  comingSoonText: { color: COLORS.secondary.main, fontSize: FONT_SIZES.body, fontWeight: '700', letterSpacing: 1 },
});
