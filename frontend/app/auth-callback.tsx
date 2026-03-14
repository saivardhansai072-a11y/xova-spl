import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, API_URL } from '../src/constants/theme';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    processAuth();
  }, []);

  const processAuth = async () => {
    try {
      let sessionId = '';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hash = window.location.hash;
        const match = hash.match(/session_id=([^&]*)/);
        if (match) sessionId = match[1];
      }
      if (!sessionId) { setError('No session ID found'); return; }
      const res = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) { setError('Authentication failed'); return; }
      const data = await res.json();
      await login(data.session_token, data.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    }
  };

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={styles.text}>Authenticating...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.primary.main, fontSize: 16, marginTop: 16 },
  error: { color: COLORS.accent.error, fontSize: 16 },
});
