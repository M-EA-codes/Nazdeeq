import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Poll {
  _id: string;
  title: string;
  question: string;
  options: {
    optionId: number;
    text: string;
    votes: string[];
  }[];
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

export default function PollsSection({ navigation }: { navigation: any }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterActive, setFilterActive] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: 'list' },
    { id: 'infrastructure', name: 'Infrastructure', icon: 'build' },
    { id: 'safety', name: 'Safety', icon: 'security' },
    { id: 'environment', name: 'Environment', icon: 'eco' },
    { id: 'community', name: 'Community', icon: 'people' },
    { id: 'government', name: 'Government', icon: 'account-balance' },
    { id: 'other', name: 'Other', icon: 'more-horiz' }
  ];

  const sortOptions = [
    { id: 'created_at', name: 'Latest' },
    { id: 'totalVotes', name: 'Most Voted' },
    { id: 'endDate', name: 'Ending Soon' }
  ];

  const activeFilters = [
    { id: 'all', name: 'All Polls' },
    { id: 'active', name: 'Active Only' },
    { id: 'ended', name: 'Ended' }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPolls();
    }
  }, [userId, selectedCategory, sortBy, searchQuery, filterActive]);

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

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        sortBy,
        order: 'desc',
        limit: '50'
      });
      
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }

      const response = await api.get(`/polls?${params.toString()}`);
      console.log('Polls response:', response);
      
      // Handle different response structures
      let pollsData = [];
      if (Array.isArray(response)) {
        pollsData = response;
      } else if (response && response.polls && Array.isArray(response.polls)) {
        pollsData = response.polls;
      } else if (response && response.data) {
        if (Array.isArray(response.data)) {
          pollsData = response.data;
        } else if (response.data.polls) {
          pollsData = response.data.polls;
        }
      }
      
      // Filter by search query if provided
      if (searchQuery.trim()) {
        pollsData = pollsData.filter((poll: Poll) => 
          poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          poll.question.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setPolls(pollsData);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setPolls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVote = async (pollId: string, optionId: number) => {
    try {
      await api.post(`/polls/${pollId}/vote`, {
        userId,
        optionId
      });
      fetchPolls();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPolls();
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

  const hasUserVoted = (poll: Poll) => {
    return poll.options.some(option => option.votes.includes(userId || ''));
  };

  const getUserVoteOption = (poll: Poll) => {
    return poll.options.find(option => option.votes.includes(userId || ''));
  };

  const getVotePercentage = (option: any, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((option.votes.length / totalVotes) * 100);
  };

  const renderPoll = ({ item }: { item: Poll }) => {
    const userVoted = hasUserVoted(item);
    const userVoteOption = getUserVoteOption(item);
    const isExpired = item.endDate && new Date(item.endDate) < new Date();

    return (
      <TouchableOpacity
        style={styles.pollCard}
        onPress={() => navigation.navigate('PollDetail', { pollId: item._id })}
      >
        <View style={styles.pollHeader}>
          <View style={styles.pollMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            {!item.isActive && (
              <View style={styles.endedBadge}>
                <Text style={styles.endedText}>Ended</Text>
              </View>
            )}
            {item.isAnonymous && (
              <MaterialIcons name="visibility-off" size={14} color="#666" style={styles.anonymousIcon} />
            )}
          </View>
          <ThemedText style={styles.timeAgo}>{getTimeAgo(item.created_at)}</ThemedText>
        </View>

        <ThemedText style={styles.pollTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.pollQuestion}>{item.question}</ThemedText>

        {/* Poll Options - Show results if user voted or poll ended */}
        <View style={styles.optionsContainer}>
          {item.options.map((option, index) => {
            const percentage = getVotePercentage(option, item.totalVotes);
            const isUserChoice = userVoteOption?.optionId === option.optionId;
            
            return (
              <TouchableOpacity
                key={option.optionId}
                style={[
                  styles.optionItem,
                  userVoted || isExpired ? styles.optionResult : styles.optionVotable,
                  isUserChoice && styles.optionUserChoice
                ]}
                onPress={() => {
                  if (!userVoted && !isExpired && item.isActive) {
                    handleVote(item._id, option.optionId);
                  }
                }}
                disabled={userVoted || isExpired || !item.isActive}
              >
                {(userVoted || isExpired) && (
                  <View 
                    style={[styles.optionProgress, { width: `${percentage}%` }]} 
                  />
                )}
                <View style={styles.optionContent}>
                  <ThemedText style={[
                    styles.optionText,
                    isUserChoice && styles.optionTextHighlight
                  ]}>
                    {option.text}
                  </ThemedText>
                  {(userVoted || isExpired) && (
                    <View style={styles.optionStats}>
                      <ThemedText style={styles.optionPercentage}>{percentage}%</ThemedText>
                      <ThemedText style={styles.optionVotes}>
                        {option.votes.length} vote{option.votes.length !== 1 ? 's' : ''}
                      </ThemedText>
                    </View>
                  )}
                  {isUserChoice && (
                    <MaterialIcons name="check" size={16} color="#4ECDC4" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.pollFooter}>
          <View style={styles.pollInfo}>
            <ThemedText style={styles.authorName}>by {item.createdBy.fullName}</ThemedText>
            <View style={styles.pollStats}>
              <MaterialIcons name="how-to-vote" size={14} color="#666" />
              <ThemedText style={styles.statText}>{item.totalVotes} votes</ThemedText>
              {item.endDate && (
                <>
                  <MaterialIcons name="schedule" size={14} color="#666" style={styles.statIcon} />
                  <ThemedText style={[
                    styles.statText,
                    isExpired && styles.expiredText
                  ]}>
                    {getTimeRemaining(item.endDate)}
                  </ThemedText>
                </>
              )}
            </View>
          </View>

          {item.allowMultipleVotes && (
            <View style={styles.multipleVotesBadge}>
              <ThemedText style={styles.multipleVotesText}>Multiple</ThemedText>
            </View>
          )}
        </View>

        {item.location && (
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={12} color="#666" />
            <ThemedText style={styles.locationText}>{item.location}</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          <ThemedText style={styles.title}>Community Polls</ThemedText>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreatePoll')}
            style={styles.createButton}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search polls..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={fetchPolls}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <MaterialIcons name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === item.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <MaterialIcons 
                  name={item.icon as any} 
                  size={16} 
                  color={selectedCategory === item.id ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === item.id && styles.categoryChipTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Active Filter Pills */}
        <View style={styles.activeFiltersContainer}>
          {activeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.activeFilterPill,
                filterActive === filter.id && styles.activeFilterPillActive
              ]}
              onPress={() => setFilterActive(filter.id)}
            >
              <Text style={[
                styles.activeFilterText,
                filterActive === filter.id && styles.activeFilterTextActive
              ]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Polls List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4c669f" />
            <ThemedText style={styles.loadingText}>Loading polls...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={polls}
            keyExtractor={(item) => item._id}
            renderItem={renderPoll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Sort and Filter Modal */}
        <Modal
          visible={showFilters}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Sort & Filter</ThemedText>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={styles.modalSectionTitle}>Sort By</ThemedText>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortOption,
                    sortBy === option.id && styles.sortOptionActive
                  ]}
                  onPress={() => {
                    setSortBy(option.id);
                    setShowFilters(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === option.id && styles.sortOptionTextActive
                  ]}>
                    {option.name}
                  </Text>
                  {sortBy === option.id && (
                    <MaterialIcons name="check" size={20} color="#4c669f" />
                  )}
                </TouchableOpacity>
              ))}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: 15,
    paddingLeft: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#4c669f',
  },
  categoryChipText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  activeFilterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterPillActive: {
    backgroundColor: '#4ECDC4',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pollCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pollQuestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionItem: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  optionVotable: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionResult: {
    backgroundColor: '#f8f9fa',
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
    padding: 12,
    position: 'relative',
    zIndex: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  optionTextHighlight: {
    fontWeight: '600',
    color: '#4ECDC4',
  },
  optionStats: {
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
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  pollStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 11,
    color: '#666',
  },
  statIcon: {
    marginLeft: 8,
  },
  expiredText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  multipleVotesBadge: {
    backgroundColor: '#45B7D1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  multipleVotesText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: '#f0f4ff',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  sortOptionTextActive: {
    color: '#4c669f',
    fontWeight: '600',
  },
});