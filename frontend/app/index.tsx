import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const redirectUrl = window.location.origin + '/auth-callback';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050505', '#0A0A2E', '#050505']} style={StyleSheet.absoluteFill} />

      {/* Decorative elements */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      <SafeAreaView style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="robot-happy-outline" size={60} color={COLORS.primary.main} />
          </View>
          <Text style={styles.title}>XOVA</Text>
          <Text style={styles.subtitle}>AI Mentor Platform</Text>
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          {[
            { icon: 'brain', text: 'Aptitude Training' },
            { icon: 'microphone', text: 'Voice Interaction' },
            { icon: 'account-tie', text: 'Interview Practice' },
            { icon: 'rocket-launch', text: 'Startup Mentoring' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name={f.icon as any} size={20} color={COLORS.primary.main} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Login Button */}
        <View style={styles.loginSection}>
          <TouchableOpacity
            testID="google-login-btn"
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background.default} />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={22} color={COLORS.background.default} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>

        {/* Bottom tag */}
        <Text style={styles.tagline}>Your AI-Powered Learning Companion</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  orbTopRight: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(0, 243, 255, 0.05)' },
  orbBottomLeft: { position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(123, 44, 191, 0.05)' },
  logoSection: { alignItems: 'center', marginTop: height * 0.08 },
  logoCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0, 243, 255, 0.08)',
    borderWidth: 2, borderColor: COLORS.primary.main,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.neonCyan,
  },
  title: { fontSize: 48, fontWeight: '800', color: COLORS.text.primary, letterSpacing: 8, marginTop: SPACING.lg },
  subtitle: { fontSize: FONT_SIZES.lg, color: COLORS.primary.main, letterSpacing: 3, marginTop: SPACING.xs },
  features: { marginVertical: SPACING.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  featureText: { fontSize: FONT_SIZES.body, color: COLORS.text.secondary, letterSpacing: 0.5 },
  loginSection: { alignItems: 'center' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary.main, height: 56, borderRadius: 16,
    paddingHorizontal: SPACING.xl, width: '100%',
    ...SHADOWS.neonCyan,
  },
  googleButtonText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.background.default, marginLeft: SPACING.sm },
  termsText: { fontSize: FONT_SIZES.sm, color: COLORS.text.disabled, marginTop: SPACING.md, textAlign: 'center' },
  tagline: { fontSize: FONT_SIZES.sm, color: COLORS.text.disabled, textAlign: 'center', letterSpacing: 2 },
});
