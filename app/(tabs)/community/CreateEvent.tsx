import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

interface EventData {
  name: string;
  description: string;
  dateTime: Date;
  location: {
    name: string;
    address: string;
  };
  groupId?: string;
}

interface Group {
  _id: string;
  name: string;
  memberIds: string[];
}

export default function CreateEvent({ route, navigation }: { route: any; navigation: any }) {
  const [eventData, setEventData] = useState<EventData>({
    name: '',
    description: '',
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    location: {
      name: '',
      address: ''
    }
  });
  
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  // Handle returning from CreateGroup with new group data
  useEffect(() => {
    const { newGroupId, newGroupName } = route.params || {};
    if (newGroupId) {
      console.log('✅ CREATE_EVENT: Received new group from CreateGroup:', newGroupName);
      setSelectedGroupId(newGroupId);
      // Refresh groups list to include the new group
      if (userId) {
        console.log('🔄 CREATE_EVENT: Refreshing groups after new group creation');
        fetchGroups();
      }
    }
  }, [route.params, userId]);

  // Refresh groups when component comes into focus (when returning from CreateGroup)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 CREATE_EVENT: Screen focused, refreshing groups');
      if (userId) {
        fetchGroups();
      }
    });

    return unsubscribe;
  }, [navigation, userId]);

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

  const fetchGroups = async () => {
    try {
      console.log('📋 CREATE_EVENT: Fetching groups for user:', userId);
      const response = await api.get('/groups');
      const allGroups = response.data || [];
      console.log('📋 CREATE_EVENT: All groups received:', allGroups.length);
      
      // Filter groups where user is member or creator
      const userGroups = allGroups.filter((group: Group) => {
        const isMember = group.memberIds?.includes(userId || '');
        const isCreator = group.createdBy?._id === userId || group.createdBy === userId;
        console.log(`📋 CREATE_EVENT: Group "${group.name}" - isMember: ${isMember}, isCreator: ${isCreator}`);
        return isMember || isCreator;
      });
      
      console.log('📋 CREATE_EVENT: User groups filtered:', userGroups.length);
      setGroups(userGroups);
    } catch (error) {
      console.error('❌ CREATE_EVENT: Error fetching groups:', error);
    }
  };

  const handleInputChange = (field: keyof EventData | string, value: string | Date) => {
    if (field.includes('.')) {
      // Handle nested fields like location.name
      const [parent, child] = field.split('.');
      setEventData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EventData] as any),
          [child]: value
        }
      }));
    } else {
      setEventData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(eventData.dateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setEventData(prev => ({ ...prev, dateTime: newDateTime }));
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(eventData.dateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setEventData(prev => ({ ...prev, dateTime: newDateTime }));
    }
  };

  const validateForm = (): boolean => {
    if (!eventData.name.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return false;
    }

    if (!eventData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }

    if (!eventData.location.name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return false;
    }

    if (eventData.dateTime <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return false;
    }

    return true;
  };

  const handleCreateEvent = async () => {
    console.log('🎯 CREATE_EVENT: Form submission started');
    console.log('🎯 CREATE_EVENT: Event data:', eventData);
    console.log('🎯 CREATE_EVENT: Selected group ID:', selectedGroupId);
    console.log('🎯 CREATE_EVENT: User ID:', userId);
    
    if (!validateForm()) {
      console.log('❌ CREATE_EVENT: Form validation failed');
      return;
    }

    if (!userId) {
      console.log('❌ CREATE_EVENT: No user ID found');
      Alert.alert('Error', 'Please log in to create events');
      return;
    }

    if (!selectedGroupId) {
      console.log('❌ CREATE_EVENT: No group selected');
      Alert.alert('Error', 'Please select a group for this event');
      return;
    }

    console.log('✅ CREATE_EVENT: All validations passed, starting API call');
    setLoading(true);

    try {
      const eventPayload = {
        name: eventData.name.trim(),
        description: eventData.description.trim(),
        dateTime: eventData.dateTime.toISOString(),
        location: {
          name: eventData.location.name.trim(),
          address: eventData.location.address.trim() || eventData.location.name.trim()
        },
        groupId: selectedGroupId,
        attendeeIds: [userId] // Creator automatically attends
      };

      const response = await api.post('/events', eventPayload);
      console.log('✅ CREATE_EVENT: Event created successfully:', response.data._id);
      
      Alert.alert(
        'Success!', 
        `Your event "${eventData.name}" has been created successfully and will be held on ${formatDate(eventData.dateTime).date}.`,
        [
          { 
            text: 'View Event', 
            onPress: () => navigation.replace('EventDetails', { eventId: response.data._id })
          },
          { 
            text: 'Back to Events', 
            onPress: () => navigation.navigate('EventsList')
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      let errorMessage = 'Failed to create event. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
          <ThemedText style={styles.headerTitle}>Create Event</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Event Name */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Event Name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter event name..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={eventData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your event..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={eventData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {/* Date and Time */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeGroup}>
              <ThemedText style={styles.label}>Date *</ThemedText>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="event" size={20} color="rgba(255, 255, 255, 0.8)" />
                <ThemedText style={styles.dateTimeText}>
                  {formatDate(eventData.dateTime)}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.dateTimeGroup}>
              <ThemedText style={styles.label}>Time *</ThemedText>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <MaterialIcons name="access-time" size={20} color="rgba(255, 255, 255, 0.8)" />
                <ThemedText style={styles.dateTimeText}>
                  {formatTime(eventData.dateTime)}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Location Name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., Community Center, Park..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={eventData.location.name}
              onChangeText={(text) => handleInputChange('location.name', text)}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Full Address (Optional)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Street address..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={eventData.location.address}
              onChangeText={(text) => handleInputChange('location.address', text)}
              maxLength={200}
            />
          </View>

          {/* Group Selection */}
          <View style={styles.inputGroup}>
            <View style={styles.groupHeader}>
              <ThemedText style={styles.label}>Select Group *</ThemedText>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  console.log('🔄 CREATE_EVENT: Manual refresh groups button pressed');
                  fetchGroups();
                }}
              >
                <MaterialIcons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {groups.length > 0 ? (
              <View style={styles.groupSelector}>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group._id}
                    style={[styles.groupOption, selectedGroupId === group._id && styles.groupOptionSelected]}
                    onPress={() => setSelectedGroupId(group._id)}
                  >
                    <ThemedText style={[styles.groupOptionText, selectedGroupId === group._id && styles.groupOptionTextSelected]}>
                      {group.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noGroupsContainer}>
                <ThemedText style={styles.noGroupsText}>
                  No groups available. You need to create a group first.
                </ThemedText>
                <TouchableOpacity 
                  style={styles.createGroupButton}
                  onPress={() => {
                    console.log('🔀 CREATE_EVENT: Navigating to CreateGroup from CreateEvent');
                    navigation.navigate('CreateGroup', { fromScreen: 'CreateEvent' });
                  }}
                >
                  <ThemedText style={styles.createGroupButtonText}>Create Group</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Create Button */}
          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={() => {
              console.log('🎯 CREATE_EVENT: Create Event button pressed');
              handleCreateEvent();
            }}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#2ecc71', '#27ae60']}
              style={styles.createButtonGradient}
            >
              <MaterialIcons 
                name={loading ? "hourglass-empty" : "event"} 
                size={20} 
                color="#fff" 
              />
              <ThemedText style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create Event'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={eventData.dateTime}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={eventData.dateTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
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
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  dateTimeGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateTimeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
  },
  groupOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  groupOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  groupOptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  groupOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
  noGroupsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noGroupsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  createGroupButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createGroupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
