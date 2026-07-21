import { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BACKEND_URL, MODEL } from '../../config';

export default function ImageCaptionScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setCaption(''); }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setCaption(''); }
  };

  const generateCaption = async () => {
    if (!imageUri) return;
    setIsLoading(true);
    setCaption('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: 'Generate a creative, evocative image caption and a short paragraph describing what might be in this photo. Make it suitable for social media or a photo gallery. Be descriptive and engaging.'
          }],
          model: MODEL
        }),
      });
      const data = await res.json();
      setCaption(data.message?.content || 'Could not generate caption.');
    } catch { setCaption('Error connecting to AI backend.'); }
    finally { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>🖼️ Image Caption Generator</Text></View>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>🖼️</Text>
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineBtn} onPress={pickImage}>
            <Text style={styles.outlineBtnText}>📂 Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={takePhoto}>
            <Text style={styles.outlineBtnText}>📷 Camera</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, !imageUri && styles.disabled]} onPress={generateCaption} disabled={!imageUri || isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>✨ Generate AI Caption</Text>}
        </TouchableOpacity>

        {caption ? (
          <View style={styles.responseCard}>
            <Text style={styles.cardLabel}>GENERATED CAPTION</Text>
            <Text style={styles.cardText}>{caption}</Text>
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
  imagePreview: { width: '100%', height: 260, borderRadius: 14 },
  imagePlaceholder: { width: '100%', height: 220, backgroundColor: '#1e293b', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155', borderStyle: 'dashed' },
  placeholderText: { color: '#64748b', fontSize: 15 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  outlineBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#6366f1', alignItems: 'center' },
  outlineBtnText: { color: '#a5b4fc', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.4 },
  responseCard: { backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#a5b4fc', letterSpacing: 1.5, marginBottom: 10 },
  cardText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
});
