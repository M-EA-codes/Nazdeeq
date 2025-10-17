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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PollOption {
  id: number;
  text: string;
}

export default function CreatePoll({ navigation }: { navigation: any }) {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('other');
  const [location, setLocation] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: '' },
    { id: 2, text: '' }
  ]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  useEffect(() => {
    fetchUserData();
    // Set minimum end date to 1 hour from now
    const minEndDate = new Date();
    minEndDate.setHours(minEndDate.getHours() + 1);
    setEndDate(minEndDate);
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

  const addOption = () => {
    if (options.length < 6) {
      const newId = Math.max(...options.map(o => o.id)) + 1;
      setOptions([...options, { id: newId, text: '' }]);
    } else {
      Alert.alert('Limit Reached', 'You can add maximum 6 options');
    }
  };

  const removeOption = (id: number) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    } else {
      Alert.alert('Minimum Required', 'Poll must have at least 2 options');
    }
  };

  const updateOption = (id: number, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim() || !question.trim()) {
      Alert.alert('Error', 'Please fill in title and question');
      return;
    }

    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please provide at least 2 valid options');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    if (hasEndDate && endDate <= new Date()) {
      Alert.alert('Error', 'End date must be in the future');
      return;
    }

    setLoading(true);
    try {
      const pollData = {
        title: title.trim(),
        question: question.trim(),
        category,
        location: location.trim(),
        options: validOptions.map((option, index) => ({
          optionId: index + 1,
          text: option.text.trim(),
          votes: []
        })),
        createdBy: userId,
        allowMultipleVotes,
        isAnonymous,
        endDate: hasEndDate ? endDate.toISOString() : null,
        isActive: true,
        totalVotes: 0
      };

      await api.post('/polls', pollData);
      Alert.alert('Success', 'Poll created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating poll:', error);
      Alert.alert('Error', 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    console.log('Date picker event:', event);
    console.log('Selected date:', selectedDate);
    
    // Hide the date picker
    setShowDatePicker(false);
    
    // Handle the selected date
    if (selectedDate) {
      setEndDate(selectedDate);
    }
    
    // Handle Android date picker dismissal
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        console.log('Date picker dismissed');
        return;
      }
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
          <ThemedText style={styles.title}>Create Poll</ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Poll Title *</ThemedText>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter poll title..."
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <ThemedText style={styles.charCount}>{title.length}/100</ThemedText>
          </View>

          {/* Question Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Question *</ThemedText>
            <TextInput
              style={styles.questionInput}
              placeholder="What would you like to ask the community?"
              placeholderTextColor="#666"
              value={question}
              onChangeText={setQuestion}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <ThemedText style={styles.charCount}>{question.length}/500</ThemedText>
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

          {/* Poll Options */}
          <View style={styles.inputContainer}>
            <View style={styles.optionsHeader}>
              <ThemedText style={styles.label}>Poll Options *</ThemedText>
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={addOption}
              >
                <MaterialIcons name="add" size={20} color="#4c669f" />
                <ThemedText style={styles.addOptionText}>Add Option</ThemedText>
              </TouchableOpacity>
            </View>
            
            {options.map((option, index) => (
              <View key={option.id} style={styles.optionContainer}>
                <TextInput
                  style={[styles.optionInput, options.length > 2 && styles.optionInputRemovable]}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="#666"
                  value={option.text}
                  onChangeText={(text) => updateOption(option.id, text)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeOptionButton}
                    onPress={() => removeOption(option.id)}
                  >
                    <MaterialIcons name="close" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <ThemedText style={styles.helperText}>
              Add 2-6 options for your poll
            </ThemedText>
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

          {/* Poll Settings */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Poll Settings</ThemedText>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>Allow Multiple Votes</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Users can select more than one option
                </ThemedText>
              </View>
              <Switch
                value={allowMultipleVotes}
                onValueChange={setAllowMultipleVotes}
                trackColor={{ false: '#e0e0e0', true: '#4c669f' }}
                thumbColor={allowMultipleVotes ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>Anonymous Poll</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Hide voter identities from results
                </ThemedText>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#e0e0e0', true: '#4c669f' }}
                thumbColor={isAnonymous ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>Set End Date</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Automatically end poll at specific time
                </ThemedText>
              </View>
              <Switch
                value={hasEndDate}
                onValueChange={setHasEndDate}
                trackColor={{ false: '#e0e0e0', true: '#4c669f' }}
                thumbColor={hasEndDate ? '#fff' : '#f4f3f4'}
              />
            </View>

            {hasEndDate && (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="schedule" size={20} color="#4c669f" />
                <ThemedText style={styles.dateButtonText}>
                  End Date: {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
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
  questionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
    minHeight: 80,
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
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addOptionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4c669f',
    fontWeight: '500',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  optionInputRemovable: {
    marginRight: 12,
  },
  removeOptionButton: {
    padding: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4c669f',
    fontWeight: '500',
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