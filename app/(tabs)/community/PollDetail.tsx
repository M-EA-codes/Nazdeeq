import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  Text,
} from 'react-native';
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
  options: PollOption[];
  createdBy: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
  };
  category: string;
  isActive: boolean;
  endDate?: string;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
  totalVotes: number;
  created_at: string;
  location: string;
}

export default function PollDetail({ route, navigation }: { route: any, navigation: any }) {
  const { pollId } = route.params;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [showVoters, setShowVoters] = useState(false);
  const [selectedOptionVoters, setSelectedOptionVoters] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPoll();
    }
  }, [userId, pollId]);

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

  const fetchPoll = async () => {
    try {
      const response = await api.get(`/polls/${pollId}`);
      setPoll(response.data);
      
      // Set selected options if user has voted
      if (response.data.options) {
        const userVotes = response.data.options
          .filter((option: PollOption) => option.votes.includes(userId || ''))
          .map((option: PollOption) => option.optionId);
        setSelectedOptions(userVotes);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) return;
    
    try {
      // For multiple votes, vote on each selected option
      for (const optionId of selectedOptions) {
        await api.post(`/polls/${pollId}/vote`, {
          userId,
          optionId
        });
      }
      
      fetchPoll();
      Alert.alert('Success', 'Your vote has been recorded!');
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to record vote. Please try again.');
    }
  };

  const handleOptionSelect = (optionId: number) => {
    if (!poll || hasUserVoted()) return;
    
    if (poll.allowMultipleVotes) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const showOptionVoters = async (option: PollOption) => {
    if (poll?.isAnonymous) {
      Alert.alert('Anonymous Poll', 'Voter details are hidden for this poll');
      return;
    }
    
    try {
      const voterPromises = option.votes.map(async (voterId) => {
        const response = await api.get(`/users/${voterId}`);
        return response.data;
      });
      
      const voters = await Promise.all(voterPromises);
      setSelectedOptionVoters(voters);
      setShowVoters(true);
    } catch (error) {
      console.error('Error fetching voters:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPoll();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffInMinutes = Math.floor((end.getTime() - now.getTime()) / 60000);
    
    if (diffInMinutes < 0) return 'Ended';
    if (diffInMinutes < 60) return `${diffInMinutes}m left`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h left`;
    return `${Math.floor(diffInMinutes / 1440)}d left`;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      infrastructure: '#FF6B6B',
      safety: '#4ECDC4',
      environment: '#45B7D1',
      community: '#96CEB4',
      government: '#FFEAA7',
      other: '#DDA0DD'
    };
    return colors[category] || colors.other;
  };

  const hasUserVoted = () => {
    if (!poll || !userId) return false;
    return poll.options.some(option => option.votes.includes(userId));
  };

  const getVotePercentage = (option: PollOption) => {
    if (poll?.totalVotes === 0) return 0;
    return Math.round((option.votes.length / poll!.totalVotes) * 100);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading poll...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!poll) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Poll not found</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  const isExpired = poll.endDate && new Date(poll.endDate) < new Date();
  const userHasVoted = hasUserVoted();
  const canVote = poll.isActive && !isExpired && !userHasVoted;

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Poll Details</ThemedText>
          <TouchableOpacity
            onPress={() => {/* Share functionality */}}
            style={styles.shareButton}
          >
            <MaterialIcons name="share" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Poll Header */}
          <View style={styles.pollCard}>
            <View style={styles.pollHeader}>
              <View style={styles.pollMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(poll.category) }]}>
                  <Text style={styles.categoryText}>{poll.category}</Text>
                </View>
                {!poll.isActive && (
                  <View style={styles.endedBadge}>
                    <Text style={styles.endedText}>Ended</Text>
                  </View>
                )}
                {poll.isAnonymous && (
                  <MaterialIcons name="visibility-off" size={16} color="#666" style={styles.anonymousIcon} />
                )}
              </View>
              <ThemedText style={styles.timeAgo}>{getTimeAgo(poll.created_at)}</ThemedText>
            </View>

            <ThemedText style={styles.pollTitle}>{poll.title}</ThemedText>
            <ThemedText style={styles.pollQuestion}>{poll.question}</ThemedText>

            {/* Poll Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialIcons name="how-to-vote" size={16} color="#666" />
                <ThemedText style={styles.statText}>{poll.totalVotes} votes</ThemedText>
              </View>
              
              {poll.endDate && (
                <View style={styles.statItem}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <ThemedText style={[
                    styles.statText,
                    isExpired && styles.expiredText
                  ]}>
                    {getTimeRemaining(poll.endDate)}
                  </ThemedText>
                </View>
              )}

              <View style={styles.statItem}>
                <MaterialIcons name="person" size={16} color="#666" />
                <ThemedText style={styles.statText}>by {poll.createdBy.fullName}</ThemedText>
              </View>
            </View>

            {poll.location && (
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <ThemedText style={styles.locationText}>{poll.location}</ThemedText>
              </View>
            )}
          </View>

          {/* Poll Options */}
          <View style={styles.optionsContainer}>
            <ThemedText style={styles.optionsTitle}>Options</ThemedText>
            
            {poll.options.map((option) => {
              const percentage = getVotePercentage(option);
              const isSelected = selectedOptions.includes(option.optionId);
              const isUserChoice = userHasVoted && option.votes.includes(userId || '');

              return (
                <TouchableOpacity
                  key={option.optionId}
                  style={[
                    styles.optionCard,
                    canVote && isSelected && styles.optionSelected,
                    isUserChoice && styles.optionUserChoice
                  ]}
                  onPress={() => {
                    if (canVote) {
                      handleOptionSelect(option.optionId);
                    } else if (userHasVoted || isExpired) {
                      showOptionVoters(option);
                    }
                  }}
                  disabled={!canVote && !userHasVoted && !isExpired}
                >
                  {(userHasVoted || isExpired) && (
                    <View 
                      style={[styles.optionProgress, { width: `${percentage}%` }]} 
                    />
                  )}
                  
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      {canVote && (
                        <View style={styles.radioContainer}>
                          <View style={[
                            styles.radio,
                            isSelected && styles.radioSelected
                          ]} />
                        </View>
                      )}
                      <ThemedText style={[
                        styles.optionText,
                        isUserChoice && styles.optionTextHighlight
                      ]}>
                        {option.text}
                      </ThemedText>
                    </View>
                    
                    {(userHasVoted || isExpired) && (
                      <View style={styles.optionResults}>
                        <ThemedText style={styles.optionPercentage}>{percentage}%</ThemedText>
                        <ThemedText style={styles.optionVotes}>
                          {option.votes.length} vote{option.votes.length !== 1 ? 's' : ''}
                        </ThemedText>
                      </View>
                    )}
                    
                    {isUserChoice && (
                      <MaterialIcons name="check" size={20} color="#4ECDC4" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Vote Button */}
          {canVote && selectedOptions.length > 0 && (
            <TouchableOpacity
              style={styles.voteButton}
              onPress={handleVote}
            >
              <ThemedText style={styles.voteButtonText}>
                Cast Vote{selectedOptions.length > 1 ? 's' : ''}
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Poll Settings Info */}
          <View style={styles.infoContainer}>
            <ThemedText style={styles.infoTitle}>Poll Settings</ThemedText>
            
            <View style={styles.infoItem}>
              <MaterialIcons 
                name={poll.allowMultipleVotes ? "check-box" : "check-box-outline-blank"} 
                size={16} 
                color={poll.allowMultipleVotes ? "#4ECDC4" : "#666"} 
              />
              <ThemedText style={styles.infoText}>Multiple votes allowed</ThemedText>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons 
                name={poll.isAnonymous ? "visibility-off" : "visibility"} 
                size={16} 
                color={poll.isAnonymous ? "#FF6B6B" : "#666"} 
              />
              <ThemedText style={styles.infoText}>
                {poll.isAnonymous ? 'Anonymous voting' : 'Public voting'}
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        {/* Voters Modal */}
        <Modal
          visible={showVoters}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVoters(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Voters ({selectedOptionVoters.length})</ThemedText>
                <TouchableOpacity onPress={() => setShowVoters(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.votersContainer}>
                {selectedOptionVoters.map((voter, index) => (
                  <View key={index} style={styles.voterItem}>
                    <View style={styles.voterAvatar}>
                      <ThemedText style={styles.voterInitial}>
                        {voter.fullName?.charAt(0) || 'U'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.voterName}>{voter.fullName || 'Unknown User'}</ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
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
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    fontSize: 16,
  },
  pollCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  endedBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  endedText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  anonymousIcon: {
    marginLeft: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pollQuestion: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  expiredText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  optionCard: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionSelected: {
    borderColor: '#4c669f',
    borderWidth: 2,
  },
  optionUserChoice: {
    borderColor: '#4ECDC4',
    borderWidth: 2,
  },
  optionProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 102, 159, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioContainer: {
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  radioSelected: {
    borderColor: '#4c669f',
    backgroundColor: '#4c669f',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  optionTextHighlight: {
    fontWeight: '600',
    color: '#4ECDC4',
  },
  optionResults: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  optionPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4c669f',
  },
  optionVotes: {
    fontSize: 11,
    color: '#666',
  },
  voteButton: {
    backgroundColor: '#4c669f',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  votersContainer: {
    maxHeight: 300,
  },
  voterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  voterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4c669f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voterInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  voterName: {
    fontSize: 14,
    color: '#333',
  },
});