import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Comment {
  _id: string;
  content: string;
  authorId: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
  };
  createdAt: string;
  upvotes: string[];
  downvotes: string[];
}

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
  createdAt: string;
  upvotes: string[];
  downvotes: string[];
  viewCount: number;
  commentCount: number;
  comments?: Comment[];
}

export default function DiscussionDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as { id: string };
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  // Get the ID from params
  const discussionId = params?.id;

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    console.log('DiscussionDetail mounted');
    console.log('All params:', params);
    console.log('Discussion ID from params:', discussionId);
    
    if (discussionId) {
      fetchDiscussion(discussionId);
      fetchComments(discussionId);
    } else {
      console.error('No discussion ID provided in params');
      Alert.alert(
        'Error', 
        'No discussion ID provided',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    }
  }, [discussionId]);

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

  const fetchDiscussion = async (id: string) => {
    try {
      setLoading(true);
      console.log('Fetching discussion with ID:', id);
      
      const response = await api.get(`/discussions/${id}`);
      console.log('Discussion response:', response);
      
      if (response) {
        setDiscussion(response);
      } else {
        throw new Error('No discussion data received');
      }
    } catch (error) {
      console.error('Error fetching discussion:', error);
      Alert.alert(
        'Discussion Not Found',
        'The discussion you are looking for could not be found.',
        [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (id: string) => {
    try {
      console.log('Fetching comments for discussion:', id);
      const response = await api.get(`/discussions/${id}/comments`);
      console.log('Comments response:', response);
      
      if (response && Array.isArray(response)) {
        setComments(response);
        console.log('Set comments from array:', response.length);
      } else if (response && response.comments) {
        setComments(response.comments);
        console.log('Set comments from object:', response.comments.length);
      } else {
        console.log('No comments found or unexpected response format');
        setComments([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching comments:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      // Comments are optional, so we don't show an error
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!userId || !discussionId || voting) return;
    
    try {
      setVoting(true);
      await api.post(`/discussions/${discussionId}/vote`, {
        userId,
        voteType
      });
      
      // Refresh discussion data
      await fetchDiscussion(discussionId);
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const handleCommentVote = async (commentId: string, voteType: 'up' | 'down') => {
    if (!userId || voting) return;
    
    try {
      setVoting(true);
      await api.post(`/comments/${commentId}/vote`, {
        userId,
        voteType
      });
      
      // Refresh comments
      await fetchComments(discussionId);
    } catch (error) {
      console.error('Error voting on comment:', error);
      Alert.alert('Error', 'Failed to vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !userId || !discussionId || submittingComment) return;
    
    try {
      setSubmittingComment(true);
      console.log('Submitting comment to:', `/discussions/${discussionId}/comments`);
      console.log('Comment data:', { content: newComment.trim(), authorId: userId });
      
      // First test if server is reachable
      try {
        const healthCheck = await api.get('/health');
        console.log('Server health check:', healthCheck);
      } catch (healthError) {
        console.error('Server health check failed:', healthError);
        Alert.alert('Error', 'Server is not reachable. Please check if the server is running.');
        return;
      }
      
      const response = await api.post(`/discussions/${discussionId}/comments`, {
        content: newComment.trim(),
        authorId: userId
      });
      
      console.log('Comment submission response:', response);
      
      setNewComment('');
      await fetchComments(discussionId);
      
      // Update comment count
      if (discussion) {
        setDiscussion({
          ...discussion,
          commentCount: discussion.commentCount + 1
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        Alert.alert('Error', `Failed to submit comment: ${error.message}`);
      } else {
        console.error('Error details: Unknown error');
        Alert.alert('Error', 'Failed to submit comment. Please try again.');
      }
    } finally {
      setSubmittingComment(false);
    }
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
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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

  const hasUserVoted = (upvotes: string[], downvotes: string[]) => {
    if (!userId) return { hasUpvoted: false, hasDownvoted: false };
    return {
      hasUpvoted: upvotes.includes(userId),
      hasDownvoted: downvotes.includes(userId)
    };
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const { hasUpvoted, hasDownvoted } = hasUserVoted(item.upvotes, item.downvotes);
    
    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthor}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.commentAuthorName}>{item.authorId.fullName}</Text>
          </View>
          <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <Text style={styles.commentContent}>{item.content}</Text>
        
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={[styles.commentVoteButton, hasUpvoted && styles.commentVoteButtonActive]}
            onPress={() => handleCommentVote(item._id, 'up')}
            disabled={voting}
          >
            <MaterialIcons 
              name="thumb-up" 
              size={16} 
              color={hasUpvoted ? '#4c669f' : '#666'} 
            />
            <Text style={[styles.commentVoteText, hasUpvoted && styles.commentVoteTextActive]}>
              {item.upvotes.length}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.commentVoteButton, hasDownvoted && styles.commentVoteButtonActive]}
            onPress={() => handleCommentVote(item._id, 'down')}
            disabled={voting}
          >
            <MaterialIcons 
              name="thumb-down" 
              size={16} 
              color={hasDownvoted ? '#ff6b6b' : '#666'} 
            />
            <Text style={[styles.commentVoteText, hasDownvoted && styles.commentVoteTextActive]}>
              {item.downvotes.length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>Loading discussion...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!discussion) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={[styles.container, styles.centered]}>
          <MaterialIcons name="error" size={64} color="#fff" />
          <ThemedText style={styles.errorText}>Discussion not found</ThemedText>
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

  const { hasUpvoted, hasDownvoted } = hasUserVoted(discussion.upvotes, discussion.downvotes);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backIcon}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Discussion</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.discussionCard}>
            {/* Category Tag */}
            <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(discussion.category) }]}>
              <Text style={styles.categoryText}>{discussion.category.toUpperCase()}</Text>
            </View>
            
            {/* Title */}
            <Text style={styles.title}>{discussion.title}</Text>
            
            {/* Author Info */}
            <View style={styles.authorInfo}>
              <View style={styles.authorDetails}>
                <MaterialIcons name="person" size={20} color="#666" />
                <Text style={styles.authorName}>{discussion.authorId.fullName}</Text>
              </View>
              <Text style={styles.date}>{formatDate(discussion.createdAt)}</Text>
            </View>
            
            {/* Content */}
            <View style={styles.contentContainer}>
              <Text style={styles.contentText}>{discussion.content}</Text>
            </View>
            
            {/* Interactive Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, hasUpvoted && styles.actionButtonActive]}
                onPress={() => handleVote('up')}
                disabled={voting || !userId}
              >
                <MaterialIcons 
                  name="thumb-up" 
                  size={20} 
                  color={hasUpvoted ? '#4c669f' : '#666'} 
                />
                <Text style={[styles.actionText, hasUpvoted && styles.actionTextActive]}>
                  {discussion.upvotes.length}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, hasDownvoted && styles.actionButtonActive]}
                onPress={() => handleVote('down')}
                disabled={voting || !userId}
              >
                <MaterialIcons 
                  name="thumb-down" 
                  size={20} 
                  color={hasDownvoted ? '#ff6b6b' : '#666'} 
                />
                <Text style={[styles.actionText, hasDownvoted && styles.actionTextActive]}>
                  {discussion.downvotes.length}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.actionButton}>
                <MaterialIcons name="visibility" size={20} color="#666" />
                <Text style={styles.actionText}>{discussion.viewCount}</Text>
              </View>
              
              <View style={styles.actionButton}>
                <MaterialIcons name="comment" size={20} color="#666" />
                <Text style={styles.actionText}>{discussion.commentCount}</Text>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            
            {/* Add Comment */}
            {userId && (
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#999"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.submitButton, (!newComment.trim() || submittingComment) && styles.submitButtonDisabled]}
                  onPress={submitComment}
                  disabled={!newComment.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {/* Comments List */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item._id}
              renderItem={renderComment}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  discussionCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 32,
  },
  
  authorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  
  contentContainer: {
    marginBottom: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#4c669f',
    fontWeight: '600',
  },
  
  // Comments Section
  commentsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    minHeight: 40,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#4c669f',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    height: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  
  // Comment Card
  commentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAuthorName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginLeft: 6,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  commentVoteButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  commentVoteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  commentVoteTextActive: {
    color: '#4c669f',
    fontWeight: '600',
  },
});