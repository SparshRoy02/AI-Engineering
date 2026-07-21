import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { BACKEND_URL, MODEL } from '../../config';

export default function VoiceAssistantScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync();
      Speech.stop();
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for Voice Assistant.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      setTranscript('🎤 Listening...');
      setResponse('');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    setTranscript('Processing voice...');
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        // NOTE: Without a cloud STT service (e.g., Google Speech), we simulate with a prompt.
        // In a real app, send the audio URI to a transcription service here.
        setTranscript('Voice recorded. (Simulated: "Tell me a fun fact about space")');
        await processWithAI('Tell me a fun fact about space');
      }
    } catch (err) {
      setTranscript('Error processing audio.');
      console.error(err);
    } finally {
      recordingRef.current = null;
      setIsProcessing(false);
    }
  };

  const processWithAI = async (text) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }], model: MODEL }),
      });
      const data = await res.json();
      const aiText = data.message?.content || 'No response.';
      setResponse(aiText);
      Speech.speak(aiText, { language: 'en-US', rate: 0.95 });
    } catch (err) {
      setResponse('Error connecting to AI backend.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎙️ Voice Assistant</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusBox}>
          {isProcessing
            ? <><ActivityIndicator color="#a5b4fc" /><Text style={styles.statusText}> Processing...</Text></>
            : isRecording
              ? <Text style={[styles.statusText, { color: '#ef4444' }]}>🔴 Recording...</Text>
              : <Text style={styles.statusText}>Tap the mic to speak</Text>
          }
        </View>

        <TouchableOpacity
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
          onPress={toggleRecording}
          disabled={isProcessing}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOU SAID</Text>
          <Text style={styles.cardText}>{transcript || '...'}</Text>
        </View>

        {response ? (
          <View style={[styles.card, styles.responseCard]}>
            <Text style={[styles.cardLabel, { color: '#a5b4fc' }]}>LLAMA 3 REPLIED</Text>
            <Text style={styles.cardText}>{response}</Text>
            <TouchableOpacity onPress={() => Speech.speak(response, { language: 'en-US' })} style={styles.speakBtn}>
              <Text style={styles.speakBtnText}>🔊 Read Aloud</Text>
            </TouchableOpacity>
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
  content: { alignItems: 'center', padding: 24, gap: 24 },
  statusBox: { flexDirection: 'row', alignItems: 'center', minHeight: 28 },
  statusText: { color: '#94a3b8', fontSize: 15 },
  micBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  micBtnActive: { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
  micIcon: { fontSize: 48 },
  card: { width: '100%', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  responseCard: { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 1.5, marginBottom: 10 },
  cardText: { color: '#e2e8f0', fontSize: 16, lineHeight: 24 },
  speakBtn: { marginTop: 14, alignSelf: 'flex-start', backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  speakBtnText: { color: '#a5b4fc', fontWeight: '600' },
});
