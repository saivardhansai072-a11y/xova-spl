import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, API_URL } from '../../src/constants/theme';

type Topic = { topic_id: string; name: string; category: string; icon: string; description: string; total_questions: number };

const CATEGORY_COLORS: Record<string, string> = { Quantitative: COLORS.primary.main, Logical: COLORS.secondary.main, Verbal: COLORS.accent.info };

export default function AptitudeScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => { fetchTopics(); }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/aptitude/topics`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setTopics(d.topics || []); }
    } catch (e) {}
  };

  const categories = ['All', ...new Set(topics.map(t => t.category))];
  const filtered = topics.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const renderTopic = ({ item, index }: { item: Topic; index: number }) => {
    const color = CATEGORY_COLORS[item.category] || COLORS.primary.main;
    return (
      <TouchableOpacity
        testID={`topic-${item.topic_id}-btn`}
        style={[styles.topicCard, { borderColor: color + '30' }]}
        onPress={() => router.push({ pathname: '/aptitude/[topicId]', params: { topicId: item.topic_id, topicName: item.name } })}
        activeOpacity={0.7}
      >
        <View style={[styles.topicIconBg, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={item.icon as any} size={26} color={color} />
        </View>
        <View style={styles.topicInfo}>
          <Text style={styles.topicName}>{item.name}</Text>
          <Text style={styles.topicDesc} numberOfLines={1}>{item.description}</Text>
        </View>
        <View style={[styles.catBadge, { borderColor: color + '50' }]}>
          <Text style={[styles.catBadgeText, { color }]}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Aptitude Training</Text>
          <Text style={styles.subtitle}>{topics.length} Topics Available</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.text.disabled} />
          <TextInput
            testID="aptitude-search"
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor={COLORS.text.disabled}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Filter */}
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catList}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`cat-${item}-btn`}
              style={[styles.catChip, selectedCategory === item && styles.catChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catChipText, selectedCategory === item && styles.catChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Topics List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.topic_id}
          renderItem={renderTopic}
          contentContainerStyle={styles.topicList}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.default },
  safe: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  title: { fontSize: FONT_SIZES.xxl, color: COLORS.text.primary, fontWeight: '800', letterSpacing: 1 },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.text.secondary, marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.subtle, borderRadius: 12, marginHorizontal: SPACING.lg, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: COLORS.border.default },
  searchInput: { flex: 1, color: COLORS.text.primary, fontSize: FONT_SIZES.body, marginLeft: 8 },
  catList: { flexGrow: 0, marginVertical: SPACING.md },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background.paper, borderWidth: 1, borderColor: COLORS.border.subtle, marginRight: 8 },
  catChipActive: { backgroundColor: COLORS.primary.main, borderColor: COLORS.primary.main },
  catChipText: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  catChipTextActive: { color: COLORS.background.default },
  topicList: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  topicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.paper, borderRadius: 14, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1 },
  topicIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  topicInfo: { flex: 1, marginLeft: SPACING.md },
  topicName: { color: COLORS.text.primary, fontSize: FONT_SIZES.body, fontWeight: '700' },
  topicDesc: { color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, marginTop: 2 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  catBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
});
