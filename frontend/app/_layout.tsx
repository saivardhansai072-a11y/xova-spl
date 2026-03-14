import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/constants/theme';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;

    // Check for auth callback - skip redirect
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) return;
    }

    const inTabs = segments[0] === '(tabs)';
    if (!user && inTabs) {
      router.replace('/');
    } else if (user && !inTabs && segments[0] !== 'auth-callback') {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary.main} />
        <Text style={styles.loaderText}>Initializing XOVA...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background.default }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth-callback" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="aptitude/[topicId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="interview" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="career" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="startup" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="community" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="payment" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: COLORS.background.default, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: COLORS.primary.main, fontSize: 16, marginTop: 16, letterSpacing: 1 },
});
