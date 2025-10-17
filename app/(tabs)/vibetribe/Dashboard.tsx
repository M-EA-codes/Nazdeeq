import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';
import { useNavigation } from '@react-navigation/native';

// Define navigation types for VibeTribe stack
type VibeTribeStackParamList = {
  Dashboard: undefined;
  InterestSelection: undefined;
  MatchedUsers: undefined;
  UserProfile: { userId: string };
  ConnectionsList: undefined;
  ConnectionRequests: undefined;
  ConversationsList: undefined;
  ChatScreen: {
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
    otherUserPhoto?: string;
  };
};

const { width } = Dimensions.get('window');
const api = axios.create({ baseURL: config.API_URL });

export default function VibeTribeDashboard() {
  const navigation = useNavigation<any>();
  const [userId, setUserId] = useState<string | null>(null);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!userId) return;

    try {
      setLoading(true);

      // Get user interests and setup status
      const userResponse = await api.get(`/vibe-tribe/interests/${userId}`);
      console.log('User response:', userResponse);
      
      if (userResponse && userResponse.data && userResponse.data.success) {
        setSetupCompleted(userResponse.data.user.vibeTribeSetupCompleted);
        setUserInterests(userResponse.data.user.vibeTribeInterests || []);

        // If setup is completed, fetch match count and connection stats
        if (userResponse.data.user.vibeTribeSetupCompleted) {
          try {
            const matchesResponse = await api.get(`/vibe-tribe/matches/${userId}?limit=100`);
            console.log('Matches response:', matchesResponse);
            if (matchesResponse && matchesResponse.data && matchesResponse.data.success) {
              setMatchCount(matchesResponse.data.totalMatches || 0);
            }
          } catch (error) {
            console.log('No matches yet or error fetching matches:', error);
            setMatchCount(0);
          }

          // Fetch connection stats
          try {
            const statsResponse = await api.get(`/connections/stats/${userId}`);
            console.log('Stats response:', statsResponse);
            if (statsResponse && statsResponse.data && statsResponse.data.success) {
              setConnectionsCount(statsResponse.data.stats.totalConnections || 0);
              setPendingRequestsCount(statsResponse.data.stats.pendingReceived || 0);
            }
          } catch (error) {
            console.log('Error fetching connection stats:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleGetStarted = () => {
    navigation.navigate('InterestSelection');
  };

  const handleViewMatches = () => {
    navigation.navigate('MatchedUsers');
  };

  const handleUpdateInterests = () => {
    navigation.navigate('InterestSelection');
  };

  // If not set up, show onboarding
  if (!loading && !setupCompleted) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Onboarding Header */}
          <View style={styles.onboardingHeader}>
            <FontAwesome5 name="users" size={80} color="#fff" />
            <ThemedText style={styles.onboardingTitle}>Welcome to VibeTribe!</ThemedText>
            <ThemedText style={styles.onboardingSubtitle}>
              Connect with neighbors who share your interests
            </ThemedText>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <FontAwesome5 name="heart" size={30} color="#e74c3c" />
              <ThemedText style={styles.featureTitle}>Match by Interests</ThemedText>
              <ThemedText style={styles.featureText}>
                Find neighbors with similar hobbies and passions
              </ThemedText>
            </View>

            <View style={styles.featureCard}>
              <FontAwesome5 name="users" size={30} color="#3498db" />
              <ThemedText style={styles.featureTitle}>Build Connections</ThemedText>
              <ThemedText style={styles.featureText}>
                Connect with like-minded people in your community
              </ThemedText>
            </View>

            <View style={styles.featureCard}>
              <FontAwesome5 name="comments" size={30} color="#2ecc71" />
              <ThemedText style={styles.featureTitle}>Start Conversations</ThemedText>
              <ThemedText style={styles.featureText}>
                Message and engage with your matches (coming soon)
              </ThemedText>
            </View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
      <LinearGradient
              colors={['#2ecc71', '#27ae60']}
              style={styles.getStartedGradient}
            >
              <MaterialIcons name="navigate-next" size={28} color="#fff" />
              <ThemedText style={styles.getStartedText}>Get Started</ThemedText>
      </LinearGradient>
    </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
  );
  }

  // Main Dashboard (after setup)
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
            Connect with Like-Minded Neighbors
          </ThemedText>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <FontAwesome5 name="heart" size={30} color="#e74c3c" />
            <ThemedText style={styles.statValue}>{userInterests.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Interests</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome5 name="user-friends" size={30} color="#2ecc71" />
            <ThemedText style={styles.statValue}>{matchCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Matches</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('ConnectionsList')}
          >
            <FontAwesome5 name="link" size={30} color="#3498db" />
            <ThemedText style={styles.statValue}>{connectionsCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Connected</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Pending Requests Banner */}
        {pendingRequestsCount > 0 && (
          <TouchableOpacity
            style={styles.requestsBanner}
            onPress={() => navigation.navigate('ConnectionRequests')}
          >
            <MaterialIcons name="notifications-active" size={24} color="#fff" />
            <ThemedText style={styles.requestsBannerText}>
              You have {pendingRequestsCount} pending connection request{pendingRequestsCount !== 1 ? 's' : ''}
            </ThemedText>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Your Interests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Interests</ThemedText>
            <TouchableOpacity onPress={handleUpdateInterests}>
              <MaterialIcons name="edit" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.interestsContainer}>
            {userInterests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <ThemedText style={styles.interestTagText}>
                  {interest.charAt(0).toUpperCase() + interest.slice(1)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleViewMatches}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a24']}
              style={styles.actionGradient}
            >
              <FontAwesome5 name="users" size={32} color="#fff" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>View Matches</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  {matchCount} potential connections found
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleUpdateInterests}
          >
            <LinearGradient
              colors={['#4b7bec', '#3742fa']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="edit" size={32} color="#fff" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Update Interests</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Refine your matching preferences
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ConnectionsList')}
          >
            <LinearGradient
              colors={['#26de81', '#20bf6b']}
              style={styles.actionGradient}
            >
              <FontAwesome5 name="link" size={32} color="#fff" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>My Connections</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  {connectionsCount} active connection{connectionsCount !== 1 ? 's' : ''}
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ConversationsList')}
          >
            <LinearGradient
              colors={['#a55eea', '#8854d0']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="chat-bubble" size={32} color="#fff" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Messages</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Chat with your connections
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={24} color="#fff" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>How It Works</ThemedText>
            <ThemedText style={styles.infoText}>
              We use an advanced matching algorithm to connect you with neighbors
              who share similar interests. The more interests you have in common,
              the higher the match percentage!
                  </ThemedText>
                </View>
          </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { paddingBottom: 30 },
  
  // Onboarding Styles
  onboardingHeader: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
  },
  onboardingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  getStartedButton: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  // Main Dashboard Styles
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginBottom: 25,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  interestTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  actionCard: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 196, 15, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  requestsBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
