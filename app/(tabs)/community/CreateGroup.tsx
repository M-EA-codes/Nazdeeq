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
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

interface GroupData {
  name: string;
  description: string;
}

export default function CreateGroup({ route, navigation }: { route: any; navigation: any }) {
  const [groupData, setGroupData] = useState<GroupData>({
    name: '',
    description: ''
  });
  
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

  const handleInputChange = (field: keyof GroupData, value: string) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return false;
    }

    if (groupData.name.length < 3) {
      Alert.alert('Error', 'Group name must be at least 3 characters long');
      return false;
    }

    if (!groupData.description.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return false;
    }

    return true;
  };

  const handleCreateGroup = async () => {
    console.log('🎯 CREATE_GROUP: Form submission started');
    console.log('🎯 CREATE_GROUP: Group data:', groupData);
    console.log('🎯 CREATE_GROUP: User ID:', userId);
    
    if (!validateForm()) {
      console.log('❌ CREATE_GROUP: Form validation failed');
      return;
    }

    if (!userId) {
      console.log('❌ CREATE_GROUP: No user ID found');
      Alert.alert('Error', 'Please log in to create groups');
      return;
    }

    console.log('✅ CREATE_GROUP: All validations passed, starting API call');
    setLoading(true);

    try {
      const groupPayload = {
        name: groupData.name.trim(),
        description: groupData.description.trim(),
        createdBy: userId
      };

      const response = await api.post('/groups', groupPayload);
      console.log('✅ CREATE_GROUP: Group created successfully:', response.data._id);
      
      // Check if we came from CreateEvent (need to go back there)
      const { fromScreen } = route.params || {};
      
      // Clear the form fields
      setGroupData({
        name: '',
        description: ''
      });

      Alert.alert(
        'Success!', 
        'Your group has been created successfully',
        [
          { 
            text: 'OK', 
            onPress: () => {
              if (fromScreen === 'CreateEvent') {
                console.log('🔀 CREATE_GROUP: Returning to CreateEvent screen');
                navigation.navigate('CreateEvent', { 
                  newGroupId: response.data._id,
                  newGroupName: response.data.name 
                });
              } else {
                console.log('🔀 CREATE_GROUP: Going to GroupDetails');
                navigation.replace('GroupDetails', { groupId: response.data._id });
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      let errorMessage = 'Failed to create group. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Create Group</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Group Name */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Group Name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter group name..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={groupData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your group's purpose and activities..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={groupData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>


          {/* Create Button */}
          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={() => {
              console.log('🎯 CREATE_GROUP: Create Group button pressed');
              handleCreateGroup();
            }}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#2ecc71', '#27ae60']}
              style={styles.createButtonGradient}
            >
              <MaterialIcons 
                name={loading ? "hourglass-empty" : "group-add"} 
                size={20} 
                color="#fff" 
              />
              <ThemedText style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create Group'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
  },
  categorySelector: {
    marginBottom: 25,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  categoryOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryOptionText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
    lineHeight: 20,
  },
  privacySelector: {
    gap: 10,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  privacyOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  privacyContent: {
    marginLeft: 15,
    flex: 1,
  },
  privacyOptionTitle: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyOptionTitleSelected: {
    color: '#fff',
  },
  privacyOptionDesc: {
    color: 'rgba(102, 126, 234, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  privacyOptionDescSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addTagButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  createButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
