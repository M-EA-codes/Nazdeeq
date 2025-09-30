import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

export default function CreatePoll({ route, navigation }: { route: any; navigation: any }) {
  const { discussionId } = route.params;
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) setUserId(storedUserId);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a poll question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please provide at least 2 options');
      return;
    }

    setLoading(true);
    try {
      const pollData = {
        question: question.trim(),
        options: validOptions.map((opt, index) => ({
          optionId: index,
          text: opt.trim(),
          votes: 0
        })),
        discussionId,
        createdBy: userId
      };

      await api.post('/polls', pollData);
      Alert.alert('Success!', 'Your poll has been created', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Create Poll</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Poll Question *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Ask a question..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={question}
            onChangeText={setQuestion}
            maxLength={200}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Options</ThemedText>
          {options.map((option, index) => (
            <View key={index} style={styles.optionContainer}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={option}
                onChangeText={(value) => updateOption(index, value)}
                maxLength={100}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeOption(index)}
                >
                  <MaterialIcons name="remove" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {options.length < 6 && (
            <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <ThemedText style={styles.addOptionText}>Add Option</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreatePoll}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#2ecc71', '#27ae60']}
            style={styles.createButtonGradient}
          >
            <MaterialIcons name={loading ? "hourglass-empty" : "poll"} size={20} color="#fff" />
            <ThemedText style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Poll'}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12,
    paddingHorizontal: 15, paddingVertical: 12, color: '#fff', fontSize: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  optionInput: {
    flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12,
    paddingHorizontal: 15, paddingVertical: 12, color: '#fff', fontSize: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  removeButton: {
    backgroundColor: '#e74c3c', borderRadius: 8, width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  addOptionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, padding: 12, marginTop: 10,
  },
  addOptionText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  createButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  createButtonDisabled: { opacity: 0.7 },
  createButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, paddingHorizontal: 30,
  },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});
