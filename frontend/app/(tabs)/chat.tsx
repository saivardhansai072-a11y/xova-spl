import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, API_URL } from '../../src/constants/theme';

type Message = { message_id: string; role: string; content: string; timestamp: string };

export default function ChatScreen() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/history?limit=50`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    } catch (e) {}
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
        body: JSON.stringify({ message: text, personality: user?.mentor_personality || 'friendly' }),
      });
      if (res.ok) {
        const d = await res.json();
        const aiMsg: Message = { message_id: d.message_id, role: 'assistant', content: d.response, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, aiMsg]);
      } else if (res.status === 429) {
        setMessages(prev => [...prev, { message_id: `err_${Date.now()}`, role: 'assistant', content: '⚡ Daily credit limit reached. Upgrade your plan for more AI responses!', timestamp: new Date().toISOString() }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { message_id: `err_${Date.now()}`, role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  const speakText = (text: string) => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); return; }
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      pitch: user?.mentor_voice === 'male' ? 0.9 : 1.1,
      rate: 0.95,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isUser && (
          <View style={styles.msgAvatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={18} color={COLORS.primary.main} />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.msgText, isUser && { color: COLORS.background.default }]}>{item.content}</Text>
          {!isUser && (
            <TouchableOpacity testID={`speak-msg-${item.message_id}`} style={styles.speakBtn} onPress={() => speakText(item.content)}>
              <MaterialCommunityIcons name={isSpeaking ? 'stop' : 'volume-high'} size={16} color={COLORS.primary.main} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={24} color={COLORS.primary.main} />
          </View>
          <View>
            <Text style={styles.headerTitle}>XOVA Mentor</Text>
            <Text style={styles.headerSub}>Online • {user?.mentor_personality || 'Friendly'} Mode</Text>
          </View>
          <TouchableOpacity testID="clear-chat-btn" style={styles.clearBtn} onPress={async () => {
            await fetch(`${API_URL}/api/chat/history`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            setMessages([]);
          }}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

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
                <MaterialCommunityIcons name="robot-happy-outline" size={64} color={COLORS.primary.main} />
                <Text style={styles.emptyChatTitle}>Hey there! I'm XOVA</Text>
                <Text style={styles.emptyChatSub}>Your AI mentor. Ask me about studies, career, interviews, or startup ideas!</Text>
              </View>
            }
          />
          {loading && (
            <View style={styles.typingIndicator}>
              <MaterialCommunityIcons name="robot-happy-outline" size={16} color={COLORS.primary.main} />
              <Text style={styles.typingText}>XOVA is thinking...</Text>
            </View>
          )}
          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput
              testID="chat-input"
              style={styles.textInput}
              placeholder="Ask XOVA anything..."
              placeholderTextColor={COLORS.text.disabled}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
              maxLength={2000}
            />
            <TouchableOpacity testID="send-msg-btn" style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim() || loading}>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border.subtle, gap: SPACING.sm },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,243,255,0.1)', borderWidth: 1.5, borderColor: COLORS.primary.main, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  headerSub: { color: COLORS.accent.success, fontSize: FONT_SIZES.xs },
  clearBtn: { marginLeft: 'auto', padding: 8 },
  chatArea: { flex: 1 },
  msgList: { padding: SPACING.md, paddingBottom: 20, flexGrow: 1 },
  msgRow: { marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,243,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  msgBubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: COLORS.primary.main, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: COLORS.background.paper, borderWidth: 1, borderColor: COLORS.border.subtle, borderBottomLeftRadius: 4 },
  msgText: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, lineHeight: 22 },
  speakBtn: { marginTop: 6, alignSelf: 'flex-start' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 8, gap: 6 },
  typingText: { color: COLORS.primary.main, fontSize: FONT_SIZES.sm },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border.subtle, backgroundColor: COLORS.background.paper, gap: 8 },
  textInput: { flex: 1, backgroundColor: COLORS.background.subtle, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.text.primary, fontSize: FONT_SIZES.body, maxHeight: 100, borderWidth: 1, borderColor: COLORS.border.default },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary.main, justifyContent: 'center', alignItems: 'center', ...SHADOWS.neonCyan },
  sendBtnDisabled: { opacity: 0.4 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyChatTitle: { color: COLORS.text.primary, fontSize: FONT_SIZES.xxl, fontWeight: '700', marginTop: SPACING.lg },
  emptyChatSub: { color: COLORS.text.secondary, fontSize: FONT_SIZES.body, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 },
});
