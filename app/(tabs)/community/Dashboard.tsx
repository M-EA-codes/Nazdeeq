import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const api = axios.create({ baseURL: config.API_URL });

interface CommunityStats {
  upcomingEvents: number;
  myGroups: number;
  activeDiscussions: number;
  totalMembers: number;
}

export default function CommunityDashboard() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<CommunityStats>({
    upcomingEvents: 0,
    myGroups: 0,
    activeDiscussions: 0,
    totalMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [myGroups, setMyGroups] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch events
      const eventsResponse = await api.get('/events');
      const events = eventsResponse.data || [];
      const upcomingEvents = events.filter((event: any) => new Date(event.dateTime) > new Date());

      // Fetch groups
      const groupsResponse = await api.get('/groups');
      const allGroups = groupsResponse.data || [];
      const userGroups = allGroups.filter((group: any) => 
        group.memberIds?.includes(userId) || group.createdBy === userId
      );

      // Fetch discussions
      const discussionsResponse = await api.get('/discussions');
      const discussions = discussionsResponse.data || [];

      // Calculate stats
      setStats({
        upcomingEvents: upcomingEvents.length,
        myGroups: userGroups.length,
        activeDiscussions: discussions.length,
        totalMembers: allGroups.reduce((total: number, group: any) => total + (group.memberIds?.length || 0), 0)
      });

      setRecentEvents(upcomingEvents.slice(0, 3));
      setMyGroups(userGroups.slice(0, 3));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load community data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient
        colors={[color, color + '80']}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FontAwesome5 name={icon} size={24} color="#fff" />
        <ThemedText style={styles.statValue}>{value}</ThemedText>
        <ThemedText style={styles.statTitle}>{title}</ThemedText>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome5 name="users" size={40} color="#fff" />
          <ThemedText style={styles.headerTitle}>VibeTribe</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Connect • Engage • Build Community
          </ThemedText>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="calendar-alt"
            title="Upcoming Events"
            value={stats.upcomingEvents}
            color="#e74c3c"
            onPress={() => navigation.navigate('EventsList')}
          />
          <StatCard
            icon="users"
            title="My Groups"
            value={stats.myGroups}
            color="#3498db"
            onPress={() => navigation.navigate('GroupsList')}
          />
          <StatCard
            icon="comments"
            title="Discussions"
            value={stats.activeDiscussions}
            color="#2ecc71"
            onPress={() => navigation.navigate('DiscussionsList')}
          />
          <StatCard
            icon="heart"
            title="Total Members"
            value={stats.totalMembers}
            color="#f39c12"
            onPress={() => {}}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              console.log('🎯 DASHBOARD: Create Event button pressed');
              console.log('🎯 DASHBOARD: Navigation object:', navigation);
              try {
                navigation.navigate('CreateEvent');
                console.log('✅ DASHBOARD: Navigation to CreateEvent successful');
              } catch (error) {
                console.log('❌ DASHBOARD: Navigation error:', error);
              }
            }}
          >
            <LinearGradient
              colors={["#ff6b6b", "#ee5a24"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="event" size={32} color="#fff" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Create Event</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Organize neighborhood gatherings and activities
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              console.log('🎯 DASHBOARD: Create Group button pressed');
              try {
                navigation.navigate('CreateGroup');
                console.log('✅ DASHBOARD: Navigation to CreateGroup successful');
              } catch (error) {
                console.log('❌ DASHBOARD: Navigation error:', error);
              }
            }}
          >
            <LinearGradient
              colors={["#4b7bec", "#3742fa"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="group-add" size={32} color="#fff" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Start a Group</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Create communities around shared interests
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              console.log('🎯 DASHBOARD: Create Discussion button pressed');
              try {
                navigation.navigate('CreateDiscussion');
                console.log('✅ DASHBOARD: Navigation to CreateDiscussion successful');
              } catch (error) {
                console.log('❌ DASHBOARD: Navigation error:', error);
              }
            }}
          >
            <LinearGradient
              colors={["#26de81", "#20bf6b"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="forum" size={32} color="#fff" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Start Discussion</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Share thoughts and engage with neighbors
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Upcoming Events</ThemedText>
            {recentEvents.map((event: any, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.eventCard}
                onPress={() => navigation.navigate('EventDetails', { eventId: event._id })}
              >
                <View style={styles.eventIcon}>
                  <FontAwesome5 name="calendar" size={20} color="#667eea" />
                </View>
                <View style={styles.eventInfo}>
                  <ThemedText style={styles.eventTitle}>{event.name}</ThemedText>
                  <ThemedText style={styles.eventDate}>
                    {new Date(event.dateTime).toLocaleDateString()}
                  </ThemedText>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Groups */}
        {myGroups.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>My Groups</ThemedText>
            {myGroups.map((group: any, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.groupCard}
                onPress={() => navigation.navigate('GroupDetails', { groupId: group._id })}
              >
                <View style={styles.groupIcon}>
                  <FontAwesome5 name="users" size={20} color="#764ba2" />
                </View>
                <View style={styles.groupInfo}>
                  <ThemedText style={styles.groupTitle}>{group.name}</ThemedText>
                  <ThemedText style={styles.groupMembers}>
                    {group.memberIds?.length || 0} members
                  </ThemedText>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
  },
  statGradient: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 5,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionCard: {
    marginBottom: 15,
    borderRadius: 15,
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
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionContent: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 15,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  groupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 15,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupMembers: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});
