import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

export default function CreateDiscussion({ route, navigation }: { route: any; navigation: any }) {
  const { groupId } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const prefs = await AsyncStorage.getItem('userPreferences');
      if (storedUserId) {
        setUserId(storedUserId);
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        setUserId(parsed.userId);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a discussion title');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter discussion content');
      return false;
    }
    return true;
  };

  const handleCreateDiscussion = async () => {
    console.log('🎯 CREATE_DISCUSSION: Form submission started');
    console.log('🎯 CREATE_DISCUSSION: Title:', title);
    console.log('🎯 CREATE_DISCUSSION: Content length:', content.length);
    console.log('🎯 CREATE_DISCUSSION: User ID:', userId);
    
    if (!validateForm() || !userId) {
      if (!userId) {
        console.log('❌ CREATE_DISCUSSION: No user ID found');
        Alert.alert('Error', 'Please log in to create discussions');
      } else {
        console.log('❌ CREATE_DISCUSSION: Form validation failed');
      }
      return;
    }

    console.log('✅ CREATE_DISCUSSION: All validations passed, starting API call');
    setLoading(true);
    try {
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        authorId: userId,
      };

      const response = await api.post('/discussions', discussionData);
      console.log('✅ CREATE_DISCUSSION: Discussion created successfully:', response.data._id);
      
      Alert.alert(
        'Success!', 
        `Your discussion "${title}" has been created successfully and is now available to the community.`,
        [
          { 
            text: 'View Discussion', 
            onPress: () => navigation.replace('DiscussionDetails', { discussionId: response.data._id })
          },
          { 
            text: 'Back to Discussions', 
            onPress: () => navigation.navigate('DiscussionsList')
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating discussion:', error);
      Alert.alert('Error', 'Failed to create discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Start Discussion</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Discussion Title *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter discussion title..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Content *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your thoughts, ask questions, or start a conversation..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>

          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={() => {
              console.log('🎯 CREATE_DISCUSSION: Create Discussion button pressed');
              handleCreateDiscussion();
            }}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#2ecc71', '#27ae60']}
              style={styles.createButtonGradient}
            >
              <MaterialIcons 
                name={loading ? "hourglass-empty" : "forum"} 
                size={20} 
                color="#fff" 
              />
              <ThemedText style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Start Discussion'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
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
  textArea: { height: 150, textAlignVertical: 'top' },
  createButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  createButtonDisabled: { opacity: 0.7 },
  createButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, paddingHorizontal: 30,
  },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});
