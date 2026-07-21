import { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView,
  FlatList, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL, MODEL } from '../../config';

const STORAGE_KEY = 'ai_tasks_v1';

export default function TaskPlannerScreen() {
  const [tasks, setTasks] = useState([]);
  const [goal, setGoal] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setTasks(JSON.parse(data));
    } catch (err) { console.error(err); }
  };

  const saveTasks = async (updated) => {
    setTasks(updated);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (err) { console.error(err); }
  };

  const generateTasks = async () => {
    if (!goal.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Break down the following goal into clear, actionable tasks. Return ONLY a numbered list like "1. Task", "2. Task". Goal: "${goal}"` }],
          model: MODEL
        }),
      });
      const data = await res.json();
      const result = data.message?.content || '';
      const parsed = result.split('\n')
        .filter(l => /^\d+[\.\)]/.test(l.trim()))
        .map((l, i) => ({ id: Date.now().toString() + i, text: l.replace(/^\d+[\.\)]\s*/, '').trim(), completed: false }));
      if (parsed.length > 0) saveTasks([...parsed, ...tasks]);
    } catch { Alert.alert('Error', 'Could not connect to AI backend.'); }
    finally { setIsGenerating(false); setGoal(''); }
  };

  const addManualTask = () => {
    if (!newTaskText.trim()) return;
    saveTasks([{ id: Date.now().toString(), text: newTaskText.trim(), completed: false }, ...tasks]);
    setNewTaskText('');
  };

  const toggleTask = (id) => saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => saveTasks(tasks.filter(t => t.id !== id));

  const completed = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>✅ AI Task Planner</Text></View>
      <FlatList
        data={tasks}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet. Enter a goal or add tasks manually!</Text>}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            {/* AI Goal Input */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>BREAK DOWN A GOAL WITH AI</Text>
              <TextInput
                style={styles.goalInput}
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g. Build a full-stack web app"
                placeholderTextColor="#475569"
                onSubmitEditing={generateTasks}
              />
              <TouchableOpacity style={[styles.primaryBtn, !goal.trim() && styles.disabled]} onPress={generateTasks} disabled={!goal.trim() || isGenerating}>
                {isGenerating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>✨ Generate Tasks</Text>}
              </TouchableOpacity>
            </View>

            {/* Manual Add */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.manualInput}
                value={newTaskText}
                onChangeText={setNewTaskText}
                placeholder="Add a task manually..."
                placeholderTextColor="#475569"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addManualTask}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
            </View>

            {/* Progress */}
            {tasks.length > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressCount}>{completed}/{tasks.length}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.taskItem, item.completed && styles.taskCompleted]}>
            <TouchableOpacity style={[styles.checkCircle, item.completed && styles.checkCircleDone]} onPress={() => toggleTask(item.id)}>
              {item.completed && <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>{item.text}</Text>
            <TouchableOpacity onPress={() => deleteTask(item.id)} style={{ padding: 4 }}>
              <Text style={{ color: '#ef4444' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', alignItems: 'center' },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 20, fontSize: 14 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 12 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', letterSpacing: 1.5 },
  goalInput: { backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  primaryBtn: { backgroundColor: '#6366f1', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.4 },
  inputRow: { flexDirection: 'row', gap: 10 },
  manualInput: { flex: 1, backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  addBtn: { width: 48, backgroundColor: 'rgba(99,102,241,0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)' },
  addBtnText: { color: '#a5b4fc', fontSize: 22, fontWeight: 'bold' },
  progressCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#94a3b8', fontSize: 13 },
  progressCount: { color: '#a5b4fc', fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#0f172a', borderRadius: 100 },
  progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 100 },
  taskItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155' },
  taskCompleted: { opacity: 0.5 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  checkCircleDone: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: '#22c55e' },
  taskText: { flex: 1, color: '#e2e8f0', fontSize: 15 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#64748b' },
});
