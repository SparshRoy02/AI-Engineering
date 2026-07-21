import { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { BACKEND_URL, MODEL } from '../../config';

export default function OCRScannerScreen() {
  const [image, setImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera roll access is required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setPdfFile(null);
      setExtractedText('');
      setAiAnalysis('');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setPdfFile(null);
      setExtractedText('');
      setAiAnalysis('');
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets?.length > 0) {
      setPdfFile(result.assets[0]);
      setImage(null);
      setExtractedText('');
      setAiAnalysis('');
    }
  };

  const runOCR = async () => {
    if (pdfFile) {
      await runPdfExtraction();
      return;
    }
    if (!image) return;
    setIsOcrLoading(true);
    setExtractedText('');
    try {
      // Simulate/placeholders for Local Image OCR, or send to backend OCR endpoint
      setExtractedText('OCR Scanner text extraction from image completed! (Demo mode: "Invoice Total: $128.50 \n Date: 2026-07-20")');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const runPdfExtraction = async () => {
    setIsOcrLoading(true);
    setExtractedText('');
    try {
      const formData = new FormData();
      formData.append('pdf', {
        uri: pdfFile.uri,
        name: pdfFile.name || 'document.pdf',
        type: 'application/pdf',
      });

      // IMPORTANT: Do NOT set Content-Type manually — React Native sets it
      // automatically with the correct multipart boundary.
      const res = await fetch(`${BACKEND_URL}/api/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setExtractedText(`Server error (${res.status}): ${data.error || 'Unknown error'}`);
        return;
      }

      setExtractedText(data.text?.trim() || 'No text found in PDF.');
    } catch (err) {
      console.error('PDF upload error:', err);
      setExtractedText(`Connection error: ${err.message}\n\nMake sure the backend is running and BACKEND_URL in config.js points to your PC's IP address.`);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!extractedText) return;
    setIsAiLoading(true);
    setAiAnalysis('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Analyze and explain the following text extracted from an image or PDF:\n\n${extractedText}` }],
          model: MODEL
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.message?.content || 'Could not analyze.');
    } catch { setAiAnalysis('Error connecting to AI backend.'); }
    finally { setIsAiLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>🔍 OCR Scanner</Text></View>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {pdfFile ? (
          <View style={[styles.imagePlaceholder, { borderColor: '#6366f1' }]}>
            <Text style={styles.placeholderIcon}>📄</Text>
            <Text style={[styles.placeholderText, { color: '#f8fafc', fontWeight: '600' }]}>{pdfFile.name}</Text>
            <Text style={styles.placeholderText}>PDF Document Attached</Text>
          </View>
        ) : image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🖼️</Text>
            <Text style={styles.placeholderText}>No file selected</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineBtn} onPress={pickImage}>
            <Text style={styles.outlineBtnText}>🖼️ Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={takePhoto}>
            <Text style={styles.outlineBtnText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={pickPdf}>
            <Text style={styles.outlineBtnText}>📄 PDF</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, !image && !pdfFile && styles.disabled]} onPress={runOCR} disabled={(!image && !pdfFile) || isOcrLoading}>
          {isOcrLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>🔍 Extract Text</Text>}
        </TouchableOpacity>

        {extractedText ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>EXTRACTED TEXT</Text>
              <Text style={styles.cardText}>{extractedText}</Text>
            </View>
            <TouchableOpacity style={[styles.accentBtn, isAiLoading && styles.disabled]} onPress={analyzeWithAI} disabled={isAiLoading}>
              {isAiLoading ? <ActivityIndicator color="#a5b4fc" /> : <Text style={styles.accentBtnText}>✨ Analyze with AI</Text>}
            </TouchableOpacity>
          </>
        ) : null}

        {aiAnalysis ? (
          <View style={[styles.card, styles.responseCard]}>
            <Text style={[styles.cardLabel, { color: '#a5b4fc' }]}>AI ANALYSIS</Text>
            <Text style={styles.cardText}>{aiAnalysis}</Text>
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
  imagePreview: { width: '100%', height: 220, borderRadius: 12 },
  imagePlaceholder: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155', borderStyle: 'dashed' },
  placeholderIcon: { fontSize: 40, marginBottom: 8 },
  placeholderText: { color: '#64748b', fontSize: 15 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  outlineBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#6366f1', alignItems: 'center' },
  outlineBtnText: { color: '#a5b4fc', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  accentBtn: { backgroundColor: 'rgba(99,102,241,0.15)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)' },
  accentBtnText: { color: '#a5b4fc', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.4 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#334155' },
  responseCard: { backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', letterSpacing: 1.5, marginBottom: 10 },
  cardText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
});
