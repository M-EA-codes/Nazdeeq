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
  createdAt: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  endDate?: string;
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

  const fetchPoll = async (id: string) => {
    try {
      setLoading(true);
      console.log('Fetching poll with ID:', id);
      
      const response = await api.get(`/polls/${id}`);
      console.log('Poll response:', response);
      
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    } catch {
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
              <Text style={styles.date}>{formatDate(poll.createdAt)}</Text>
            </View>
            
            {/* Poll Options */}
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>
                {hasUserVoted() ? `Results (${poll.totalVotes} total votes)` : 'Vote on this poll'}
              </Text>
              {poll.options.map((option) => {
                const percentage = poll.totalVotes > 0 ? (option.votes.length / poll.totalVotes) * 100 : 0;
                const userVoted = hasUserVoted();
                const userVoteOption = getUserVoteOption();
                const isUserChoice = userVoteOption?.optionId === option.optionId;
                const isExpired = poll.endDate && new Date(poll.endDate) < new Date();
                
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
  },
  authorName: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginLeft: 8,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  
  optionsContainer: {
    marginTop: 8,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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