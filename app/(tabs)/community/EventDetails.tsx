import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
  Linking,
  Platform,
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
  groupId?: string;
  createdBy?: string;
}

interface User {
  _id: string;
  fullName: string;
  profilePhoto?: string;
}

export default function EventDetails({ route, navigation }: { route: any; navigation: any }) {
  const { eventId } = route.params;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchEventDetails();
    }
  }, [userId, eventId]);

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

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const eventResponse = await api.get(`/events/${eventId}`);
      const eventData = eventResponse.data;
      setEvent(eventData);

      // Fetch attendees details
      if (eventData.attendeeIds && eventData.attendeeIds.length > 0) {
        const attendeePromises = eventData.attendeeIds.map((attendeeId: string) =>
          api.get(`/users/${attendeeId}`)
        );
        
        try {
          const attendeeResponses = await Promise.all(attendeePromises);
          const attendeeData = attendeeResponses.map(response => response.data);
          setAttendees(attendeeData);
        } catch (error) {
          console.error('Error fetching some attendees:', error);
          // Continue even if some attendee fetches fail
          setAttendees([]);
        }
      }

    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Failed to load event details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const joinEvent = async () => {
    if (!userId || !event) {
      Alert.alert('Error', 'Please log in to join events');
      return;
    }

    const isAlreadyJoined = event.attendeeIds?.includes(userId);
    
    if (isAlreadyJoined) {
      Alert.alert('Info', 'You are already attending this event');
      return;
    }

    try {
      const updatedEvent = {
        ...event,
        attendeeIds: [...(event.attendeeIds || []), userId]
      };

      await api.put(`/events/${eventId}`, updatedEvent);
      setEvent(updatedEvent);
      
      // Add current user to attendees list
      const userResponse = await api.get(`/users/${userId}`);
      setAttendees(prev => [...prev, userResponse.data]);
      
      Alert.alert('Success', 'You have successfully joined the event!');
    } catch (error) {
      console.error('Error joining event:', error);
      Alert.alert('Error', 'Failed to join event. Please try again.');
    }
  };

  const leaveEvent = async () => {
    if (!userId || !event) return;

    Alert.alert(
      'Leave Event',
      'Are you sure you want to leave this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEvent = {
                ...event,
                attendeeIds: event.attendeeIds?.filter(id => id !== userId) || []
              };

              await api.put(`/events/${eventId}`, updatedEvent);
              setEvent(updatedEvent);
              
              // Remove current user from attendees list
              setAttendees(prev => prev.filter(attendee => attendee._id !== userId));
              
              Alert.alert('Success', 'You have left the event');
            } catch (error) {
              console.error('Error leaving event:', error);
              Alert.alert('Error', 'Failed to leave event. Please try again.');
            }
          }
        }
      ]
    );
  };

  const shareEvent = async () => {
    if (!event) return;

    const message = `Join me at "${event.name}"!\n\nWhen: ${formatDateTime(event.dateTime)}\nWhere: ${event.location.name}\n\n${event.description}`;
    
    try {
      await Share.share({
        message,
        title: event.name,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const openLocationInMaps = () => {
    if (!event?.location.address && !event?.location.name) return;

    const query = encodeURIComponent(event.location.address || event.location.name);
    const url = Platform.OS === 'ios' 
      ? `maps://app?q=${query}`
      : `geo:0,0?q=${query}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEventDetails();
    setRefreshing(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
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

  const isUserAttending = () => {
    return event?.attendeeIds?.includes(userId || '') || false;
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading event details...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!event) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Event not found</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  const { date, time } = formatDateTime(event.dateTime);
  const isPast = isEventPast(event.dateTime);
  const isAttending = isUserAttending();

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={shareEvent}
          >
            <MaterialIcons name="share" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <ThemedText style={styles.eventTitle}>{event.name}</ThemedText>
          {isPast && (
            <View style={styles.pastBadge}>
              <ThemedText style={styles.pastBadgeText}>Past Event</ThemedText>
            </View>
          )}
          {isAttending && !isPast && (
            <View style={styles.attendingBadge}>
              <FontAwesome5 name="check" size={12} color="#fff" />
              <ThemedText style={styles.attendingBadgeText}>Attending</ThemedText>
            </View>
          )}
        </View>

        {/* Date and Time */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="calendar-alt" size={20} color="#fff" />
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>Date & Time</ThemedText>
              <ThemedText style={styles.infoText}>{date}</ThemedText>
              <ThemedText style={styles.infoText}>{time}</ThemedText>
            </View>
          </View>
        </View>

        {/* Location */}
        <TouchableOpacity style={styles.infoSection} onPress={openLocationInMaps}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#fff" />
            </View>
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>Location</ThemedText>
              <ThemedText style={styles.infoText}>{event.location.name}</ThemedText>
              {event.location.address && event.location.address !== event.location.name && (
                <ThemedText style={styles.infoSubtext}>{event.location.address}</ThemedText>
              )}
              <ThemedText style={styles.tapToViewText}>Tap to view in maps</ThemedText>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(255, 255, 255, 0.6)" />
          </View>
        </TouchableOpacity>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <ThemedText style={styles.sectionTitle}>About This Event</ThemedText>
          <ThemedText style={styles.descriptionText}>{event.description}</ThemedText>
        </View>

        {/* Attendees */}
        <View style={styles.attendeesSection}>
          <ThemedText style={styles.sectionTitle}>
            Attendees ({attendees.length})
          </ThemedText>
          
          {attendees.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.attendeesList}>
                {attendees.map((attendee) => (
                  <View key={attendee._id} style={styles.attendeeItem}>
                    <View style={styles.attendeeAvatar}>
                      <ThemedText style={styles.attendeeInitial}>
                        {attendee.fullName?.charAt(0).toUpperCase() || 'U'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.attendeeName} numberOfLines={1}>
                      {attendee.fullName || 'User'}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <ThemedText style={styles.noAttendeesText}>
              No attendees yet. Be the first to join!
            </ThemedText>
          )}
        </View>

        {/* Action Button */}
        {!isPast && (
          <TouchableOpacity 
            style={[styles.actionButton, isAttending && styles.leaveButton]}
            onPress={isAttending ? leaveEvent : joinEvent}
          >
            <LinearGradient
              colors={isAttending ? ['#e74c3c', '#c0392b'] : ['#2ecc71', '#27ae60']}
              style={styles.actionButtonGradient}
            >
              <MaterialIcons 
                name={isAttending ? "event-busy" : "event-available"} 
                size={20} 
                color="#fff" 
              />
              <ThemedText style={styles.actionButtonText}>
                {isAttending ? 'Leave Event' : 'Join Event'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  eventHeader: {
    marginBottom: 30,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  pastBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 5,
  },
  pastBadgeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  attendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2ecc71',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 5,
  },
  attendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  tapToViewText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
    fontStyle: 'italic',
  },
  descriptionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  attendeesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  attendeesList: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  attendeeItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 60,
  },
  attendeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendeeInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  attendeeName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  noAttendeesText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  actionButton: {
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
  leaveButton: {},
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
