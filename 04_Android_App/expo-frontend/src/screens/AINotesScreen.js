import { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL, MODEL } from '../../config';

const STORAGE_KEY = 'ai_notes_v1';

export default function AINotesScreen() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'editor'

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setNotes(JSON.parse(data));
    } catch (err) { console.error(err); }
  };

  const saveNotes = async (updated) => {
    setNotes(updated);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (err) { console.error(err); }
  };

  const createNote = () => {
    const note = { id: Date.now().toString(), title: 'Untitled Note', content: '', tags: [], createdAt: new Date().toISOString() };
    const updated = [note, ...notes];
    saveNotes(updated);
    setActiveNote(note);
    setView('editor');
  };

  const updateNote = (field, value) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    saveNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const deleteNote = (id) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveNotes(notes.filter(n => n.id !== id)) }
    ]);
  };

  const enhanceWithAI = async () => {
    if (!activeNote?.content) return;
    setIsEnhancing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Enhance and improve this note. Make it cleaner and structured. Also suggest 3-5 short tags on a new line starting with "Tags:":\n\n${activeNote.content}` }],
          model: MODEL
        }),
      });
      const data = await res.json();
      const result = data.message?.content || '';
      const tagsMatch = result.match(/Tags?:\s*(.+)/i);
      const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/^#/, '')) : [];
      const cleanContent = result.replace(/Tags?:.+$/im, '').trim();
      updateNote('content', cleanContent);
      if (tags.length > 0) updateNote('tags', tags);
    } catch (err) { Alert.alert('Error', 'Could not connect to AI.'); }
    finally { setIsEnhancing(false); }
  };

  if (view === 'editor' && activeNote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('list')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.enhanceBtn} onPress={enhanceWithAI} disabled={isEnhancing || !activeNote.content}>
            {isEnhancing ? <ActivityIndicator color="#a5b4fc" size="small" /> : <Text style={styles.enhanceBtnText}>✨ AI Enhance</Text>}
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ padding: 20, flex: 1, gap: 12 }}>
            <TextInput
              style={styles.titleInput}
              value={activeNote.title}
              onChangeText={v => updateNote('title', v)}
              placeholder="Note title..."
              placeholderTextColor="#475569"
            />
            {activeNote.tags?.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {activeNote.tags.map(tag => <Text key={tag} style={styles.tagChip}>#{tag}</Text>)}
              </View>
            )}
            <TextInput
              style={styles.contentInput}
              value={activeNote.content}
              onChangeText={v => updateNote('content', v)}
              placeholder="Write your note here... AI can enhance it!"
              placeholderTextColor="#475569"
              multiline
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 AI Notes</Text>
        <TouchableOpacity style={styles.newBtn} onPress={createNote}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notes}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No notes yet. Tap "+ New" to create one!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.noteCard} onPress={() => { setActiveNote(item); setView('editor'); }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.notePreview} numberOfLines={2}>{item.content || 'Empty note...'}</Text>
              {item.tags?.length > 0 && <Text style={styles.noteTags}>{item.tags.map(t => `#${t}`).join('  ')}</Text>}
            </View>
            <TouchableOpacity onPress={() => deleteNote(item.id)} style={{ padding: 4 }}>
              <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  backBtn: { color: '#a5b4fc', fontWeight: '600', fontSize: 15 },
  newBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: '#fff', fontWeight: '700' },
  enhanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  enhanceBtnText: { color: '#a5b4fc', fontWeight: '600' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 15 },
  noteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155' },
  noteTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  notePreview: { color: '#64748b', fontSize: 13, lineHeight: 19, marginBottom: 6 },
  noteTags: { color: '#6366f1', fontSize: 12 },
  titleInput: { backgroundColor: 'transparent', color: '#f8fafc', fontSize: 22, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 10 },
  contentInput: { flex: 1, color: '#e2e8f0', fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  tagChip: { backgroundColor: 'rgba(99,102,241,0.15)', color: '#a5b4fc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, fontSize: 12 },
});
