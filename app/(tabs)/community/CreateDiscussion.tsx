import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateDiscussion({ navigation }: { navigation: any }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('low');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const categories = [
    { id: 'infrastructure', name: 'Infrastructure', icon: 'build' },
    { id: 'safety', name: 'Safety', icon: 'security' },
    { id: 'environment', name: 'Environment', icon: 'eco' },
    { id: 'community', name: 'Community', icon: 'people' },
    { id: 'government', name: 'Government', icon: 'account-balance' },
    { id: 'other', name: 'Other', icon: 'more-horiz' }
  ];

  const priorities = [
    { id: 'low', name: 'Low', color: '#4ECDC4' },
    { id: 'medium', name: 'Medium', color: '#45B7D1' },
    { id: 'high', name: 'High', color: '#FFA07A' },
    { id: 'urgent', name: 'Urgent', color: '#FF6B6B' }
  ];

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

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        location: location.trim(),
        priority,
        authorId: userId,
      };

      await api.post('/discussions', discussionData);
      Alert.alert('Success', 'Discussion created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating discussion:', error);
      Alert.alert('Error', 'Failed to create discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Create Discussion</ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? 'Posting...' : 'Post'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Title *</ThemedText>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter discussion title..."
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <ThemedText style={styles.charCount}>{title.length}/100</ThemedText>
          </View>

          {/* Content Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Content *</ThemedText>
            <TextInput
              style={styles.contentInput}
              placeholder="What's on your mind? Share your thoughts about the community..."
              placeholderTextColor="#666"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <ThemedText style={styles.charCount}>{content.length}/2000</ThemedText>
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    category === cat.id && styles.categoryOptionActive
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <MaterialIcons 
                    name={cat.icon as any} 
                    size={20} 
                    color={category === cat.id ? '#fff' : '#666'} 
                  />
                  <ThemedText style={[
                    styles.categoryOptionText,
                    category === cat.id && styles.categoryOptionTextActive
                  ]}>
                    {cat.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Selection */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Priority Level</ThemedText>
            <View style={styles.priorityContainer}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.priorityOption,
                    priority === p.id && { backgroundColor: p.color }
                  ]}
                  onPress={() => setPriority(p.id)}
                >
                  <ThemedText style={[
                    styles.priorityOptionText,
                    priority === p.id && styles.priorityOptionTextActive
                  ]}>
                    {p.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Location (Optional)</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Specific area or neighborhood..."
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Tags Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Tags (Optional)</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Separate tags with commas (e.g., road repair, traffic)"
              placeholderTextColor="#666"
              value={tags}
              onChangeText={setTags}
            />
            <ThemedText style={styles.helperText}>
              Tags help others find your discussion more easily
            </ThemedText>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { 
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
    minHeight: 120,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: '45%',
  },
  categoryOptionActive: {
    backgroundColor: '#4c669f',
  },
  categoryOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 40,
  },
});