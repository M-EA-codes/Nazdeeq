import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

interface Event {
  _id: string;
  name: string;
  description: string;
  dateTime: string;
  location: {
    name: string;
    address: string;
  };
  attendeeIds: string[];
  groupId: string;
  createdBy?: string;
}

export default function EventsList({ navigation }: { navigation: any }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'attending'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [userId]);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, filterType, userId]);

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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      const eventsData = response.data || [];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    const now = new Date();
    switch (filterType) {
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.dateTime) > now);
        break;
      case 'attending':
        filtered = filtered.filter(event => event.attendeeIds?.includes(userId || ''));
        break;
      default:
        // Show all events
        break;
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    setFilteredEvents(filtered);
  };

  const joinEvent = async (eventId: string) => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to join events');
      return;
    }

    try {
      const event = events.find(e => e._id === eventId);
      if (!event) return;

      const isAlreadyJoined = event.attendeeIds?.includes(userId);
      
      if (isAlreadyJoined) {
        Alert.alert('Info', 'You are already attending this event');
        return;
      }

      const updatedEvent = {
        ...event,
        attendeeIds: [...(event.attendeeIds || []), userId]
      };

      await api.put(`/events/${eventId}`, updatedEvent);
      
      // Update local state
      setEvents(events.map(e => e._id === eventId ? updatedEvent : e));
      
      Alert.alert('Success', 'You have successfully joined the event!');
    } catch (error) {
      console.error('Error joining event:', error);
      Alert.alert('Error', 'Failed to join event. Please try again.');
    }
  };

  const leaveEvent = async (eventId: string) => {
    if (!userId) return;

    try {
      const event = events.find(e => e._id === eventId);
      if (!event) return;

      const updatedEvent = {
        ...event,
        attendeeIds: event.attendeeIds?.filter(id => id !== userId) || []
      };

      await api.put(`/events/${eventId}`, updatedEvent);
      
      // Update local state
      setEvents(events.map(e => e._id === eventId ? updatedEvent : e));
      
      Alert.alert('Success', 'You have left the event');
    } catch (error) {
      console.error('Error leaving event:', error);
      Alert.alert('Error', 'Failed to leave event. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const isEventPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const FilterButton = ({ type, label, active }: { type: any, label: string, active: boolean }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={() => setFilterType(type)}
    >
      <ThemedText style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Community Events</ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="rgba(255, 255, 255, 0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton type="all" label="All Events" active={filterType === 'all'} />
          <FilterButton type="upcoming" label="Upcoming" active={filterType === 'upcoming'} />
          <FilterButton type="attending" label="Attending" active={filterType === 'attending'} />
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        contentContainerStyle={styles.eventsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ThemedText style={styles.loadingText}>Loading events...</ThemedText>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="calendar-times" size={64} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>No events found</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create an event!'}
            </ThemedText>
            <TouchableOpacity 
              style={styles.createEventButton}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <ThemedText style={styles.createEventButtonText}>Create Event</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          filteredEvents.map((event) => {
            const { date, time } = formatDate(event.dateTime);
            const isPast = isEventPast(event.dateTime);
            const isAttending = event.attendeeIds?.includes(userId || '');
            
            return (
              <TouchableOpacity
                key={event._id}
                style={[styles.eventCard, isPast && styles.pastEventCard]}
                onPress={() => navigation.navigate('EventDetails', { eventId: event._id })}
                activeOpacity={0.8}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventDateContainer}>
                    <ThemedText style={styles.eventDate}>{date}</ThemedText>
                    <ThemedText style={styles.eventTime}>{time}</ThemedText>
                  </View>
                  <View style={styles.eventInfo}>
                    <ThemedText style={styles.eventTitle} numberOfLines={2}>
                      {event.name}
                    </ThemedText>
                    <View style={styles.eventLocation}>
                      <MaterialIcons name="place" size={16} color="rgba(255, 255, 255, 0.7)" />
                      <ThemedText style={styles.eventLocationText} numberOfLines={1}>
                        {event.location.name}
                      </ThemedText>
                    </View>
                  </View>
                  {isAttending && (
                    <View style={styles.attendingBadge}>
                      <FontAwesome5 name="check" size={12} color="#fff" />
                    </View>
                  )}
                </View>

                {event.description && (
                  <ThemedText style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </ThemedText>
                )}

                <View style={styles.eventFooter}>
                  <View style={styles.attendeesInfo}>
                    <FontAwesome5 name="users" size={16} color="rgba(255, 255, 255, 0.7)" />
                    <ThemedText style={styles.attendeesText}>
                      {event.attendeeIds?.length || 0} attending
                    </ThemedText>
                  </View>

                  {!isPast && (
                    <TouchableOpacity
                      style={[styles.joinButton, isAttending && styles.leaveButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        isAttending ? leaveEvent(event._id) : joinEvent(event._id);
                      }}
                    >
                      <ThemedText style={styles.joinButtonText}>
                        {isAttending ? 'Leave' : 'Join'}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  eventsList: {
    flex: 1,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyStateSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  createEventButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  createEventButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  pastEventCard: {
    opacity: 0.7,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventDateContainer: {
    alignItems: 'center',
    marginRight: 15,
    minWidth: 60,
  },
  eventDate: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginLeft: 5,
    flex: 1,
  },
  attendingBadge: {
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
