import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Author {
  _id: string;
  fullName: string;
  profilePhoto?: string;
  rating: number;
}

interface Comment {
  _id: string;
  content: string;
  authorId: Author;
  upvotes: string[];
  downvotes: string[];
  created_at: string;
  parentCommentId?: string;
  replies?: Comment[];
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorId: Author;
  upvotes: string[];
  downvotes: string[];
  commentCount: number;
  viewCount: number;
  created_at: string;
  isResolved: boolean;
  isPinned: boolean;
  tags: string[];
  location: string;
  priority: string;
}

export default function DiscussionDetail({ route, navigation }: { route: any, navigation: any }) {
  // Add safety check for route params
  const discussionId = route?.params?.discussionId;
  
  if (!discussionId) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Discussion ID not provided</ThemedText>
          <TouchableOpacity 
            onPress={() => navigation?.goBack?.()}
            style={styles.backButton}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDiscussion();
      fetchComments();
    }
  }, [userId, discussionId]);

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

  const fetchDiscussion = async () => {
    try {
      const response = await api.get(`/discussions/${discussionId}`);
      setDiscussion(response.data);
    } catch (error) {
      console.error('Error fetching discussion:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/discussions/${discussionId}/comments`);
      // Handle response structure - API returns { comments: [...] }
      const commentsData = response.data?.comments || response.data || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]); // Set empty array on error
    }
  };

  const handleVote = async (type: 'discussion' | 'comment', id: string, voteType: 'up' | 'down') => {
    try {
      const endpoint = type === 'discussion' ? `/discussions/${id}/vote` : `/comments/${id}/vote`;
      await api.post(endpoint, { userId, voteType });
      
      if (type === 'discussion') {
        fetchDiscussion();
      } else {
        fetchComments();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData = {
        discussionId,
        authorId: userId,
        content: newComment.trim(),
        parentCommentId: replyToComment,
      };

      await api.post('/comments', commentData);
      setNewComment('');
      setReplyToComment(null);
      fetchComments();
      fetchDiscussion(); // Update comment count
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting');
      return;
    }

    try {
      await api.post(`/discussions/${discussionId}/report`, {
        userId,
        reason: reportReason.trim(),
      });
      setShowReportModal(false);
      setReportReason('');
      Alert.alert('Success', 'Discussion reported successfully');
    } catch (error) {
      console.error('Error reporting discussion:', error);
      Alert.alert('Error', 'Failed to report discussion');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscussion();
    fetchComments();
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

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: '#4ECDC4',
      medium: '#45B7D1',
      high: '#FFA07A',
      urgent: '#FF6B6B'
    };
    return colors[priority] || colors.low;
  };

  const renderComment = (comment: Comment, isReply = false) => {
    // Handle both vote structures: { upvotes, downvotes } or { votes }
    const upvotes = comment.upvotes || [];
    const downvotes = comment.downvotes || [];
    const voteScore = upvotes.length - downvotes.length;
    const hasUpvoted = upvotes.includes(userId || '');
    const hasDownvoted = downvotes.includes(userId || '');

    return (
      <View key={comment._id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthor}>
            <ThemedText style={styles.commentAuthorName}>{comment.authorId.fullName}</ThemedText>
            <ThemedText style={styles.commentTime}>{getTimeAgo(comment.created_at)}</ThemedText>
          </View>
          {!isReply && (
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setReplyToComment(comment._id)}
            >
              <MaterialIcons name="reply" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <ThemedText style={styles.commentContent}>{comment.content}</ThemedText>
        
        <View style={styles.commentFooter}>
          <View style={styles.commentVotes}>
            <TouchableOpacity
              style={[styles.voteButton, hasUpvoted && styles.voteButtonActive]}
              onPress={() => handleVote('comment', comment._id, 'up')}
            >
              <MaterialIcons 
                name="keyboard-arrow-up" 
                size={18} 
                color={hasUpvoted ? '#4ECDC4' : '#666'} 
              />
            </TouchableOpacity>
            
            <ThemedText style={[styles.voteScore, { 
              color: voteScore > 0 ? '#4ECDC4' : voteScore < 0 ? '#FF6B6B' : '#666' 
            }]}>
              {voteScore}
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.voteButton, hasDownvoted && styles.voteButtonActive]}
              onPress={() => handleVote('comment', comment._id, 'down')}
            >
              <MaterialIcons 
                name="keyboard-arrow-down" 
                size={18} 
                color={hasDownvoted ? '#FF6B6B' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading discussion...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!discussion) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Discussion not found</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  // Safety check for upvotes/downvotes
  const upvotes = discussion?.upvotes || [];
  const downvotes = discussion?.downvotes || [];
  const voteScore = upvotes.length - downvotes.length;
  const hasUpvoted = upvotes.includes(userId || '');
  const hasDownvoted = downvotes.includes(userId || '');

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
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Discussion</ThemedText>
          <TouchableOpacity
            onPress={() => setShowReportModal(true)}
            style={styles.reportButton}
          >
            <MaterialIcons name="flag" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Discussion Content */}
          <View style={styles.discussionCard}>
            <View style={styles.discussionHeader}>
              <View style={styles.discussionMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(discussion.category) }]}>
                  <ThemedText style={styles.categoryText}>{discussion.category}</ThemedText>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(discussion.priority) }]}>
                  <ThemedText style={styles.priorityText}>{discussion.priority}</ThemedText>
                </View>
                {discussion.isPinned && (
                  <MaterialIcons name="push-pin" size={16} color="#FF6B6B" style={styles.pinnedIcon} />
                )}
                {discussion.isResolved && (
                  <MaterialIcons name="check-circle" size={16} color="#4ECDC4" style={styles.resolvedIcon} />
                )}
              </View>
              <ThemedText style={styles.timeAgo}>{getTimeAgo(discussion.created_at)}</ThemedText>
            </View>

            <ThemedText style={styles.discussionTitle}>{discussion.title}</ThemedText>
            <ThemedText style={styles.discussionContent}>{discussion.content}</ThemedText>

            {discussion.location && (
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <ThemedText style={styles.locationText}>{discussion.location}</ThemedText>
              </View>
            )}

            {discussion.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {discussion.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <ThemedText style={styles.tagText}>#{tag}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.discussionFooter}>
              <View style={styles.authorInfo}>
                <ThemedText style={styles.authorName}>by {discussion.authorId.fullName}</ThemedText>
                <View style={styles.discussionStats}>
                  <MaterialIcons name="visibility" size={14} color="#666" />
                  <ThemedText style={styles.statText}>{discussion.viewCount} views</ThemedText>
                  <MaterialIcons name="comment" size={14} color="#666" style={styles.statIcon} />
                  <ThemedText style={styles.statText}>{discussion.commentCount} comments</ThemedText>
                </View>
              </View>

              <View style={styles.voteSection}>
                <TouchableOpacity
                  style={[styles.voteButton, hasUpvoted && styles.voteButtonActive]}
                  onPress={() => handleVote('discussion', discussion._id, 'up')}
                >
                  <MaterialIcons 
                    name="keyboard-arrow-up" 
                    size={24} 
                    color={hasUpvoted ? '#4ECDC4' : '#666'} 
                  />
                </TouchableOpacity>
                
                <ThemedText style={[styles.voteScore, { 
                  color: voteScore > 0 ? '#4ECDC4' : voteScore < 0 ? '#FF6B6B' : '#666' 
                }]}>
                  {voteScore}
                </ThemedText>
                
                <TouchableOpacity
                  style={[styles.voteButton, hasDownvoted && styles.voteButtonActive]}
                  onPress={() => handleVote('discussion', discussion._id, 'down')}
                >
                  <MaterialIcons 
                    name="keyboard-arrow-down" 
                    size={24} 
                    color={hasDownvoted ? '#FF6B6B' : '#666'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <ThemedText style={styles.commentsTitle}>
              Comments ({comments.length})
            </ThemedText>
            
            {comments.map(comment => renderComment(comment))}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          {replyToComment && (
            <View style={styles.replyIndicator}>
              <ThemedText style={styles.replyText}>Replying to comment</ThemedText>
              <TouchableOpacity onPress={() => setReplyToComment(null)}>
                <MaterialIcons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentTextInput}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <MaterialIcons 
                name="send" 
                size={20} 
                color={newComment.trim() ? '#4c669f' : '#ccc'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Report Modal */}
        <Modal
          visible={showReportModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Report Discussion</ThemedText>
                <TouchableOpacity onPress={() => setShowReportModal(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={styles.modalDescription}>
                Please provide a reason for reporting this discussion:
              </ThemedText>
              
              <TextInput
                style={styles.reportInput}
                placeholder="Enter reason..."
                placeholderTextColor="#666"
                value={reportReason}
                onChangeText={setReportReason}
                multiline
                textAlignVertical="top"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowReportModal(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reportSubmitButton}
                  onPress={handleReport}
                >
                  <ThemedText style={styles.reportSubmitButtonText}>Report</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  reportButton: {
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
  discussionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discussionMeta: {
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
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  pinnedIcon: {
    marginLeft: 4,
  },
  resolvedIcon: {
    marginLeft: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  discussionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
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
    marginBottom: 4,
  },
  discussionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 11,
    color: '#666',
  },
  statIcon: {
    marginLeft: 8,
  },
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 4,
  },
  voteButton: {
    padding: 4,
    borderRadius: 16,
  },
  voteButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  voteScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  commentsSection: {
    marginBottom: 100,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  commentContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
    backgroundColor: '#f0f4ff',
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
    gap: 8,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 11,
    color: '#666',
  },
  replyButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    padding: 2,
  },
  repliesContainer: {
    marginTop: 12,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 12,
    color: '#4c669f',
    fontStyle: 'italic',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    maxHeight: 80,
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  reportSubmitButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportSubmitButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});