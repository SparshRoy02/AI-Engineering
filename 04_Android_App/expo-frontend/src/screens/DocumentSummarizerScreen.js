import { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { BACKEND_URL, MODEL } from '../../config';

export default function DocumentSummarizerScreen() {
  const [docText, setDocText] = useState('');
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/*' });
    if (!result.canceled && result.assets?.length > 0) {
      const file = result.assets[0];
      setFileName(file.name);
      setSummary('');
      try {
        const content = await FileSystem.readAsStringAsync(file.uri);
        setDocText(content);
      } catch (err) {
        setDocText('Could not read file. Please paste text manually.');
      }
    }
  };

  const summarize = async () => {
    if (!docText.trim()) return;
    setIsLoading(true);
    setSummary('');
    try {
      const truncated = docText.substring(0, 6000);
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Summarize this document clearly and concisely with key points and conclusions:\n\n---\n${truncated}\n---`
          }],
          model: MODEL
        }),
      });
      const data = await res.json();
      setSummary(data.message?.content || 'Could not generate summary.');
    } catch { setSummary('Error connecting to AI backend.'); }
    finally { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>📄 Document Summarizer</Text></View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
          <Text style={styles.uploadIcon}>📂</Text>
          <Text style={styles.uploadText}>{fileName || 'Upload a .txt file'}</Text>
        </TouchableOpacity>

        <Text style={styles.orLabel}>— or paste text below —</Text>

        <TextInput
          style={styles.textarea}
          value={docText}
          onChangeText={setDocText}
          placeholder="Paste document content here..."
          placeholderTextColor="#475569"
          multiline
          numberOfLines={10}
        />

        <Text style={styles.charCount}>{docText.length.toLocaleString()} characters</Text>

        <TouchableOpacity style={[styles.primaryBtn, !docText.trim() && styles.disabled]} onPress={summarize} disabled={!docText.trim() || isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>✨ Summarize with AI</Text>}
        </TouchableOpacity>

        {summary ? (
          <View style={styles.responseCard}>
            <Text style={styles.cardLabel}>AI SUMMARY</Text>
            <Text style={styles.cardText}>{summary}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', alignItems: 'center' },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, gap: 16 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  uploadIcon: { fontSize: 24 },
  uploadText: { color: '#a5b4fc', fontSize: 15, fontWeight: '500' },
  orLabel: { textAlign: 'center', color: '#475569', fontSize: 13 },
  textarea: { backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 22, minHeight: 200, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
  charCount: { textAlign: 'right', color: '#475569', fontSize: 12 },
  primaryBtn: { backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.4 },
  responseCard: { backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#a5b4fc', letterSpacing: 1.5, marginBottom: 10 },
  cardText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
});
