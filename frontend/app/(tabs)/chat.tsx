import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useAuth } from '../../src/context/AuthContext';
import MentorAvatar from '../../src/components/MentorAvatar';
import { COLORS, SPACING, FONT_SIZES, API_URL } from '../../src/constants/theme';
import { getCharacterById, DEFAULT_CHARACTER } from '../../src/constants/characters';

const { width } = Dimensions.get('window');

type Message = { message_id: string; role: string; content: string; timestamp: string };

export default function ChatScreen() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Get the selected character
  const characterId = user?.mentor_character || 'zero_two';
  const character = getCharacterById(characterId) || DEFAULT_CHARACTER;

  useEffect(() => { fetchHistory(); return () => { soundRef.current?.unloadAsync(); }; }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/history?limit=50`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    } catch (e) {}
  };

  const playAudioBase64 = async (audioB64: string) => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      const { sound } = await Audio.Sound.createAsync({ uri: `data:audio/mpeg;base64,${audioB64}` });
      soundRef.current = sound;
      setIsSpeaking(true);
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) setIsSpeaking(false);
      });
      await sound.playAsync();
    } catch (e) {
      console.log('Audio playback error:', e);
      setIsSpeaking(false);
    }
  };

  const speakWithFallback = (text: string, audioB64?: string | null) => {
    if (audioB64) {
      playAudioBase64(audioB64);
    } else {
      if (isSpeaking) { Speech.stop(); setIsSpeaking(false); return; }
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en-US',
        pitch: character.gender === 'male' ? 0.9 : 1.1,
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  const stopSpeaking = async () => {
    if (soundRef.current) { await soundRef.current.stopAsync(); }
    Speech.stop();
    setIsSpeaking(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const tempMsg: Message = { message_id: `temp_${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          personality: user?.mentor_personality || 'friendly', 
          voice_enabled: voiceEnabled,
          character_id: characterId,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const aiMsg: Message = { message_id: d.message_id, role: 'assistant', content: d.response, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, aiMsg]);
        if (voiceEnabled) speakWithFallback(d.response, d.audio);
      } else if (res.status === 429) {
        setMessages(prev => [...prev, { message_id: `err_${Date.now()}`, role: 'assistant', content: '⚡ Daily credit limit reached. Upgrade your plan for more AI responses!', timestamp: new Date().toISOString() }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { message_id: `err_${Date.now()}`, role: 'assistant', content: '❌ Connection error. Please try again.', timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isUser && (
          <MentorAvatar 
            characterId={characterId} 
            size="tiny" 
            speaking={isSpeaking && messages[messages.length - 1]?.message_id === item.message_id}
            showStatus={false}
          />
        )}
        <View style={[styles.msgBubble, isUser ? styles.userBubble : [styles.aiBubble, { borderColor: character.color + '40' }]]}>
          <Text style={[styles.msgText, isUser && { color: COLORS.background.default }]}>{item.content}</Text>
          {!isUser && !item.message_id.startsWith('err_') && (
            <TouchableOpacity testID={`speak-${item.message_id}`} style={styles.speakBtn} onPress={() => speakWithFallback(item.content)}>
              <MaterialCommunityIcons name={isSpeaking ? 'stop' : 'volume-high'} size={14} color={character.color} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header with Character */}
        <LinearGradient colors={[character.color + '15', 'transparent']} style={styles.header}>
          <View style={styles.headerLeft}>
            <MentorAvatar
              characterId={characterId}
              size="small"
              speaking={isSpeaking}
              thinking={loading}
              showStatus={false}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: character.color }]}>{character.name}</Text>
            <Text style={styles.headerSub}>
              {loading ? '🤔 Thinking...' : isSpeaking ? '🗣️ Speaking...' : '✨ Online'} • {user?.mentor_personality || 'Friendly'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity testID="voice-toggle-btn" style={[styles.voiceToggle, voiceEnabled && { borderColor: character.color + '60', backgroundColor: character.color + '15' }]} onPress={() => setVoiceEnabled(!voiceEnabled)}>
              <MaterialCommunityIcons name={voiceEnabled ? 'volume-high' : 'volume-off'} size={18} color={voiceEnabled ? character.color : COLORS.text.disabled} />
            </TouchableOpacity>
            <Link href="/settings" asChild>
              <TouchableOpacity testID="settings-btn" style={styles.iconBtn}>
                <MaterialCommunityIcons name="cog-outline" size={18} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </Link>
            <TouchableOpacity testID="clear-chat-btn" style={styles.iconBtn} onPress={async () => {
              await fetch(`${API_URL}/api/chat/history`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
              setMessages([]);
            }}>
              <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Messages */}
        <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.message_id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <MentorAvatar characterId={characterId} size="xlarge" showName />
                <Text style={styles.emptyChatTitle}>Hello! I'm {character.name}</Text>
                <Text style={styles.emptyChatSub}>Your AI mentor powered by Groq AI{'\n'}Ask me about studies, career, interviews, or startups!</Text>
                
                {/* Quick prompts */}
                <View style={styles.quickPrompts}>
                  {['Help me prepare for an interview', 'Explain a difficult concept', 'Give me career advice'].map((prompt, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.quickPromptBtn, { borderColor: character.color + '40' }]}
                      onPress={() => setInput(prompt)}
                    >
                      <Text style={[styles.quickPromptText, { color: character.color }]}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
          />
          {loading && (
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { backgroundColor: character.color }]} />
              <View style={[styles.typingDot, { backgroundColor: character.color, opacity: 0.7 }]} />
              <View style={[styles.typingDot, { backgroundColor: character.color, opacity: 0.4 }]} />
              <Text style={[styles.typingText, { color: character.color }]}>{character.name} is thinking...</Text>
            </View>
          )}
          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput
              testID="chat-input"
              style={[styles.textInput, { borderColor: character.color + '30' }]}
              placeholder={`Ask ${character.name} anything...`}
              placeholderTextColor={COLORS.text.disabled}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
              maxLength={2000}
            />
            <TouchableOpacity 
              testID="send-msg-btn" 
              style={[styles.sendBtn, { backgroundColor: character.color }, !input.trim() && styles.sendBtnDisabled]} 
              onPress={sendMessage} 
              disabled={!input.trim() || loading}
            >
              {loading ? <ActivityIndicator size="small" color={COLORS.background.default} /> : <MaterialCommunityIcons name="send" size={20} color={COLORS.background.default} />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border.subtle },
  headerLeft: { marginRight: SPACING.sm },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  headerSub: { color: COLORS.text.secondary, fontSize: FONT_SIZES.xs, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  voiceToggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background.subtle, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border.subtle },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background.subtle, justifyContent: 'center', alignItems: 'center' },
  chatArea: { flex: 1 },
  msgList: { padding: SPACING.md, paddingBottom: 20, flexGrow: 1 },
  msgRow: { marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: COLORS.primary.main, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: COLORS.background.elevated, borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, lineHeight: 22 },
  speakBtn: { marginTop: 6, alignSelf: 'flex-start', padding: 4 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 8, gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  typingText: { fontSize: FONT_SIZES.sm, marginLeft: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border.subtle, backgroundColor: COLORS.background.paper, gap: 8 },
  textInput: { flex: 1, backgroundColor: COLORS.background.subtle, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.text.primary, fontSize: FONT_SIZES.body, maxHeight: 100, borderWidth: 1 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyChatTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.xxl, fontWeight: '700', marginTop: SPACING.lg },
  emptyChatSub: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 },
  quickPrompts: { marginTop: SPACING.xl, gap: SPACING.sm, width: '100%' },
  quickPromptBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: COLORS.background.paper },
  quickPromptText: { fontSize: FONT_SIZES.md, fontWeight: '600', textAlign: 'center' },
});
