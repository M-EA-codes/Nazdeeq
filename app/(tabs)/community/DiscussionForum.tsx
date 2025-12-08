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

interface Discussion {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorId: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
  };
  upvotes: string[];
  downvotes: string[];
  commentCount: number;
  viewCount: number;
  created_at: string;
  isResolved: boolean;
  isPinned: boolean;
  tags: string[];
}

export default function DiscussionForum({ navigation }: { navigation: any }) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
    { id: 'votes', name: 'Most Voted' },
    { id: 'viewCount', name: 'Most Viewed' },
    { id: 'commentCount', name: 'Most Discussed' }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDiscussions();
    }
  }, [userId, selectedCategory, sortBy, searchQuery]);

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

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        sortBy,
        order: 'desc',
        limit: '50'
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await api.get(`/discussions?${params.toString()}`);
      console.log('Discussions response:', response);
      
      // Handle different response structures
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && response.discussions && Array.isArray(response.discussions)) {
        data = response.discussions;
      } else if (response && response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.discussions) {
          data = response.data.discussions;
        }
      }
      
      setDiscussions(data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setDiscussions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVote = async (discussionId: string, voteType: 'up' | 'down') => {
    try {
      await api.post(`/discussions/${discussionId}/vote`, {
        userId,
        voteType
      });
      fetchDiscussions();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscussions();
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

  const renderDiscussion = ({ item }: { item: Discussion }) => {
    const voteScore = item.upvotes.length - item.downvotes.length;
    const hasUpvoted = item.upvotes.includes(userId || '');
    const hasDownvoted = item.downvotes.includes(userId || '');

    return (
      <TouchableOpacity
        style={styles.discussionCard}
        onPress={() => navigation.navigate('DiscussionDetail', { discussionId: item._id })}
      >
        <View style={styles.discussionHeader}>
          <View style={styles.discussionMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            {item.isPinned && (
              <MaterialIcons name="push-pin" size={16} color="#FF6B6B" style={styles.pinnedIcon} />
            )}
            {item.isResolved && (
              <MaterialIcons name="check-circle" size={16} color="#4ECDC4" style={styles.resolvedIcon} />
            )}
          </View>
          <ThemedText style={styles.timeAgo}>{getTimeAgo(item.created_at)}</ThemedText>
        </View>

        <ThemedText style={styles.discussionTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.discussionPreview} numberOfLines={2}>
          {item.content}
        </ThemedText>

        <View style={styles.discussionFooter}>
          <View style={styles.authorInfo}>
            <ThemedText style={styles.authorName}>by {item.authorId.fullName}</ThemedText>
          </View>

          <View style={styles.discussionStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="visibility" size={14} color="#666" />
              <Text style={styles.statText}>{item.viewCount}</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="comment" size={14} color="#666" />
              <Text style={styles.statText}>{item.commentCount}</Text>
            </View>

            <View style={styles.voteSection}>
              <TouchableOpacity
                style={[styles.voteButton, hasUpvoted && styles.voteButtonActive]}
                onPress={() => handleVote(item._id, 'up')}
              >
                <MaterialIcons 
                  name="keyboard-arrow-up" 
                  size={18} 
                  color={hasUpvoted ? '#4ECDC4' : '#666'} 
                />
              </TouchableOpacity>
              
              <Text style={[styles.voteScore, { color: voteScore > 0 ? '#4ECDC4' : voteScore < 0 ? '#FF6B6B' : '#666' }]}>
                {voteScore}
              </Text>
              
              <TouchableOpacity
                style={[styles.voteButton, hasDownvoted && styles.voteButtonActive]}
                onPress={() => handleVote(item._id, 'down')}
              >
                <MaterialIcons 
                  name="keyboard-arrow-down" 
                  size={18} 
                  color={hasDownvoted ? '#FF6B6B' : '#666'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
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
          <ThemedText style={styles.title}>Discussion Forum</ThemedText>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateDiscussion')}
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
              placeholder="Search discussions..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={fetchDiscussions}
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

        {/* Discussions List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4c669f" />
            <ThemedText style={styles.loadingText}>Loading discussions...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={discussions}
            keyExtractor={(item) => item._id}
            renderItem={renderDiscussion}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Sort Modal */}
        <Modal
          visible={showFilters}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Sort By</ThemedText>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
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
    marginBottom: 20,
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
  discussionCard: {
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
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discussionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  pinnedIcon: {
    marginRight: 4,
  },
  resolvedIcon: {
    marginRight: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  discussionPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  discussionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  discussionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 2,
  },
  voteButton: {
    padding: 4,
    borderRadius: 12,
  },
  voteButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  voteScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
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