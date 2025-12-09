import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PollOption {
  optionId: number;
  text: string;
  votes: string[];
}

interface Poll {
  _id: string;
  title: string;
  question: string;
  category: string;
  createdBy: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
  };
  createdAt?: string;
  created_at?: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  endDate?: string | null;
}

export default function PollDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as { id: string };
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  // Get the ID from params
  const pollId = params?.id;

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    console.log('userId or poll changed:', { userId, poll: !!poll });
    if (userId && poll) {
      console.log('Checking if user is creator...');
      isUserCreator();
    }
  }, [userId, poll]);

  useEffect(() => {
    console.log('PollDetail mounted');
    console.log('All params:', params);
    console.log('Poll ID from params:', pollId);
    
    if (pollId) {
      fetchPoll(pollId);
    } else {
      console.error('No poll ID provided in params');
      Alert.alert(
        'Error', 
        'No poll ID provided',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    }
  }, [pollId]);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const prefs = await AsyncStorage.getItem('userPreferences');
      console.log('Fetching user data:', { storedUserId, prefs });
      
      if (storedUserId) {
        console.log('Setting userId from storedUserId:', storedUserId);
        setUserId(storedUserId);
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        console.log('Setting userId from prefs:', parsed.userId);
        setUserId(parsed.userId);
      } else {
        console.log('No userId found in storage');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchPoll = async (id: string) => {
    try {
      setLoading(true);
      console.log('Fetching poll with ID:', id);
      
      const response = await api.get(`/polls/${id}`);
      console.log('Poll response:', response);
      console.log('Poll createdAt:', response?.createdAt);
      console.log('Poll created_at:', response?.created_at);
      console.log('Poll endDate:', response?.endDate);
      console.log('Poll createdBy:', response?.createdBy);
      console.log('Poll isActive:', response?.isActive);
      
      if (response) {
        setPoll(response);
      } else {
        throw new Error('No poll data received');
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      Alert.alert(
        'Poll Not Found',
        'The poll you are looking for could not be found.',
        [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: number) => {
    if (!userId || !pollId || voting || !poll?.isActive) return;
    
    try {
      setVoting(true);
      await api.post(`/polls/${pollId}/vote`, {
        userId,
        optionId
      });
      
      // Refresh poll data
      await fetchPoll(pollId);
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const hasUserVoted = () => {
    if (!userId || !poll) return false;
    return poll.options.some(option => option.votes.includes(userId));
  };

  const getUserVoteOption = () => {
    if (!userId || !poll) return null;
    return poll.options.find(option => option.votes.includes(userId));
  };

  const isUserCreator = () => {
    if (!userId || !poll) {
      console.log('isUserCreator: Missing userId or poll', { userId, poll: !!poll });
      return false;
    }
    const creatorId = poll.createdBy._id || poll.createdBy;
    const isCreator = creatorId === userId;
    console.log('isUserCreator check:', {
      userId,
      creatorId,
      isCreator,
      pollCreatedBy: poll.createdBy
    });
    return isCreator;
  };

  const endPoll = async () => {
    if (!userId || !poll || !isUserCreator()) return;
    
    Alert.alert(
      'End Poll',
      'Are you sure you want to end this poll? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Poll', 
          style: 'destructive',
          onPress: async () => {
            try {
              setVoting(true);
              await api.post(`/polls/${poll._id}/end`, { userId });
              
              // Refresh poll data
              await fetchPoll(poll._id);
              
              Alert.alert('Success', 'Poll ended successfully');
            } catch (error) {
              console.error('Error ending poll:', error);
              Alert.alert('Error', 'Failed to end poll. Please try again.');
            } finally {
              setVoting(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return 'Unknown date';
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Unknown date';
      }
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
      
      // For older dates, show compact formatted date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      infrastructure: '#ff6b6b',
      safety: '#4ecdc4',
      environment: '#45b7d1',
      community: '#96ceb4',
      government: '#feca57',
      other: '#a0a0a0'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>Loading poll...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!poll) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={[styles.container, styles.centered]}>
          <MaterialIcons name="error" size={64} color="#fff" />
          <ThemedText style={styles.errorText}>Poll not found</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backIcon}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Poll</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.pollCard}>
            {/* Category and Status */}
            <View style={styles.topRow}>
              <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(poll.category) }]}>
                <Text style={styles.categoryText}>{poll.category.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: poll.isActive ? '#4caf50' : '#ff9800' }]}>
                <Text style={styles.statusText}>{poll.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
              </View>
            </View>
            
            {/* Title and Question */}
            <Text style={styles.title}>{poll.title}</Text>
            <Text style={styles.question}>{poll.question}</Text>
            
            {/* Author Info */}
            <View style={styles.authorInfo}>
              <View style={styles.authorDetails}>
                <MaterialIcons name="person" size={20} color="#666" />
                <Text style={styles.authorName}>{poll.createdBy.fullName}</Text>
              </View>
              <Text 
                style={styles.date}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {formatDate(poll.createdAt || poll.created_at)}
              </Text>
            </View>
            
            {/* Poll Options */}
            <View style={styles.optionsContainer}>
              <View style={styles.optionsHeader}>
                <Text style={styles.optionsTitle}>
                  {hasUserVoted() ? `Results (${poll.totalVotes} total votes)` : 'Vote on this poll'}
                </Text>
                {(() => {
                  const isCreator = isUserCreator();
                  const isActive = poll.isActive;
                  console.log('End Poll button conditions:', {
                    isCreator,
                    isActive,
                    shouldShow: isCreator && isActive
                  });
                  return isCreator && isActive;
                })() && (
                  <TouchableOpacity
                    style={styles.endPollButton}
                    onPress={endPoll}
                    disabled={voting}
                  >
                    <MaterialIcons name="stop" size={16} color="#fff" />
                    <Text style={styles.endPollButtonText}>End Poll</Text>
                  </TouchableOpacity>
                )}
              </View>
              {poll.options.map((option) => {
                const percentage = poll.totalVotes > 0 ? (option.votes.length / poll.totalVotes) * 100 : 0;
                const userVoted = hasUserVoted();
                const userVoteOption = getUserVoteOption();
                const isUserChoice = userVoteOption?.optionId === option.optionId;
                const isExpired = (() => {
                  if (!poll.endDate) return false;
                  try {
                    const endDate = new Date(poll.endDate);
                    if (isNaN(endDate.getTime())) {
                      console.warn('Invalid endDate:', poll.endDate);
                      return false;
                    }
                    return endDate < new Date();
                  } catch (error) {
                    console.error('Error checking endDate:', error);
                    return false;
                  }
                })();
                
                return (
                  <TouchableOpacity
                    key={option.optionId}
                    style={[
                      styles.option,
                      isUserChoice && styles.optionUserChoice,
                      !userVoted && !isExpired && poll.isActive && styles.optionVotable
                    ]}
                    onPress={() => {
                      if (!userVoted && !isExpired && poll.isActive) {
                        handleVote(option.optionId);
                      }
                    }}
                    disabled={userVoted || isExpired || !poll.isActive || voting}
                  >
                    <Text style={[
                      styles.optionText,
                      isUserChoice && styles.optionTextHighlight
                    ]}>
                      {option.text}
                    </Text>
                    
                    {(userVoted || isExpired) && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                      </View>
                      <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
                    </View>
                    )}
                    
                    <View style={styles.optionFooter}>
                    <Text style={styles.voteCount}>{option.votes.length} votes</Text>
                      {isUserChoice && (
                        <MaterialIcons name="check-circle" size={20} color="#4caf50" />
                      )}
                  </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  scrollView: { flex: 1 },
  pollCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  question: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  
  authorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  authorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '40%',
  },
  
  optionsContainer: {
    marginTop: 8,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  endPollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  endPollButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  option: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionVotable: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  optionUserChoice: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  optionTextHighlight: {
    color: '#4caf50',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4c669f',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    minWidth: 45,
  },
  voteCount: {
    fontSize: 12,
    color: '#999',
  },
  optionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});