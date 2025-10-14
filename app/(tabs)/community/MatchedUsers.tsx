import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

interface MatchedUser {
  user: {
    _id: string;
    fullName: string;
    email: string;
    profilePhoto?: string;
    address: string;
    trustScore: number;
    rating: number;
    interests: string[];
  };
  matchScore: number;
  sharedInterests: string[];
  sharedCount: number;
}

export default function MatchedUsers({ navigation }: { navigation: any }) {
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMatches();
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

  const fetchMatches = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await api.get(`/vibe-tribe/matches/${userId}`, {
        params: {
          limit: 50,
          minScore: 0.1,
        },
      });

      if (response.data.success) {
        setMatches(response.data.matches);
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      if (error.response?.status === 400) {
        Alert.alert(
          'Setup Required',
          'Please set up your interests first.',
          [
            {
              text: 'Set Up Now',
              onPress: () => navigation.navigate('InterestSelection'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load matches. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  const getMatchPercentage = (score: number) => {
    return Math.round(score * 100);
  };

  const getMatchColor = (score: number) => {
    if (score >= 0.7) return '#2ecc71'; // High match
    if (score >= 0.4) return '#f39c12'; // Medium match
    return '#95a5a6'; // Low match
  };

  const renderMatchCard = (match: MatchedUser) => {
    const matchPercentage = getMatchPercentage(match.matchScore);
    const matchColor = getMatchColor(match.matchScore);

    return (
      <TouchableOpacity
        key={match.user._id}
        style={styles.matchCard}
        onPress={() =>
          navigation.navigate('UserProfile', { userId: match.user._id })
        }
        activeOpacity={0.8}
      >
        <View style={styles.matchHeader}>
          {/* Profile Photo */}
          <View style={styles.profilePhotoContainer}>
            {match.user.profilePhoto ? (
              <Image
                source={{ uri: match.user.profilePhoto }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <FontAwesome5 name="user" size={30} color="#fff" />
              </View>
            )}
            {/* Match Badge */}
            <View style={[styles.matchBadge, { backgroundColor: matchColor }]}>
              <ThemedText style={styles.matchBadgeText}>
                {matchPercentage}%
              </ThemedText>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <ThemedText style={styles.userName}>{match.user.fullName}</ThemedText>
            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={16} color="rgba(255, 255, 255, 0.7)" />
              <ThemedText style={styles.location} numberOfLines={1}>
                {match.user.address || 'Location not set'}
              </ThemedText>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5 name="star" size={12} color="#f39c12" />
                <ThemedText style={styles.statText}>
                  {match.user.rating.toFixed(1)}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5 name="shield-alt" size={12} color="#3498db" />
                <ThemedText style={styles.statText}>
                  {match.user.trustScore}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Shared Interests */}
        <View style={styles.sharedInterestsContainer}>
          <View style={styles.sharedInterestsHeader}>
            <FontAwesome5 name="heart" size={14} color="#e74c3c" />
            <ThemedText style={styles.sharedInterestsTitle}>
              {match.sharedCount} Shared Interest{match.sharedCount !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <View style={styles.interestTags}>
            {match.sharedInterests.slice(0, 4).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <ThemedText style={styles.interestTagText}>
                  {interest}
                </ThemedText>
              </View>
            ))}
            {match.sharedInterests.length > 4 && (
              <View style={styles.interestTag}>
                <ThemedText style={styles.interestTagText}>
                  +{match.sharedInterests.length - 4}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* View Profile Button */}
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() =>
            navigation.navigate('UserProfile', { 
              userId: match.user._id,
              matchScore: match.matchScore,
              sharedInterests: match.sharedInterests
            })
          }
        >
          <ThemedText style={styles.viewProfileText}>View Profile</ThemedText>
          <MaterialIcons name="arrow-forward" size={18} color="#667eea" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialIcons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Your Matches</ThemedText>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('InterestSelection')}
        >
          <MaterialIcons name="settings" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <FontAwesome5 name="spinner" size={40} color="#fff" />
            <ThemedText style={styles.loadingText}>Finding your matches...</ThemedText>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="user-friends" size={64} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateTitle}>No Matches Yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              We couldn't find any users with similar interests yet. Check back later!
            </ThemedText>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('InterestSelection')}
            >
              <ThemedText style={styles.emptyStateButtonText}>
                Update Interests
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.matchesHeader}>
              <ThemedText style={styles.matchesCount}>
                {matches.length} Match{matches.length !== 1 ? 'es' : ''} Found
              </ThemedText>
              <ThemedText style={styles.matchesSubtitle}>
                Based on your interests
              </ThemedText>
            </View>
            {matches.map(renderMatchCard)}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginTop: 30,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  matchesHeader: {
    marginBottom: 20,
  },
  matchesCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchesSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  matchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  matchHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profilePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  matchBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 5,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  sharedInterestsContainer: {
    marginBottom: 15,
  },
  sharedInterestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sharedInterestsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  interestTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    gap: 8,
  },
  viewProfileText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

