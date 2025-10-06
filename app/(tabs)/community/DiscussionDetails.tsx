import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

interface Comment {
  _id: string;
  content: string;
  authorId: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
  };
  created_at: string;
}

export default function DiscussionDetails({ route, navigation }: { route: any; navigation: any }) {
  const { discussionId } = route.params;
  const [discussion, setDiscussion] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDiscussionDetails();
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

  const fetchDiscussionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/discussions/${discussionId}`);
      setDiscussion(response.data);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      Alert.alert('Error', 'Failed to load discussion details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      console.log('📝 COMMENTS: Fetching comments for discussion:', discussionId);
      const response = await api.get(`/comments?discussionId=${discussionId}`);
      console.log('📝 COMMENTS: Received comments:', response.data);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Don't show alert for comments, just log the error
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDiscussionDetails(),
      fetchComments()
    ]);
    setRefreshing(false);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Please log in to comment');
      return;
    }

    console.log('💬 COMMENT: Submitting comment:', commentText);
    setSubmittingComment(true);

    try {
      const commentData = {
        discussionId,
        authorId: userId,
        content: commentText.trim()
      };

      const response = await api.post('/comments', commentData);
      console.log('✅ COMMENT: Comment submitted successfully:', response.data._id);
      
      // Clear the input
      setCommentText('');
      
      // Refresh comments list
      await fetchComments();
      
      Alert.alert('Success', 'Your comment has been posted');
    } catch (error: any) {
      console.error('❌ COMMENT: Error submitting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading discussion...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!discussion) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Discussion not found</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Discussion</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Discussion Content */}
          <View style={styles.discussionCard}>
            <ThemedText style={styles.discussionTitle}>{discussion.title}</ThemedText>
            <ThemedText style={styles.discussionContent}>{discussion.content}</ThemedText>
            <ThemedText style={styles.discussionDate}>
              {new Date(discussion.created_at).toLocaleString()}
            </ThemedText>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <MaterialIcons name="comment" size={20} color="#fff" />
              <ThemedText style={styles.commentsTitle}>
                Comments ({comments.length})
              </ThemedText>
            </View>

            {/* Comments List */}
            {comments.length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <MaterialIcons name="comment" size={32} color="rgba(255, 255, 255, 0.3)" />
                <ThemedText style={styles.noCommentsText}>
                  No comments yet. Be the first to comment!
                </ThemedText>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment._id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAuthor}>
                      <MaterialIcons name="person" size={16} color="#fff" />
                      <ThemedText style={styles.commentAuthorName}>
                        {comment.authorId?.fullName || 'Unknown User'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleString()}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.commentContent}>
                    {comment.content}
                  </ThemedText>
                </View>
              ))
            )}
          </View>

          {/* Comment Input */}
          <View style={styles.commentInputSection}>
            <ThemedText style={styles.commentInputLabel}>Add a comment:</ThemedText>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your thoughts..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.submitCommentButton, submittingComment && styles.submitCommentButtonDisabled]}
                onPress={handleSubmitComment}
                disabled={submittingComment || !commentText.trim()}
              >
                <MaterialIcons 
                  name={submittingComment ? "hourglass-empty" : "send"} 
                  size={20} 
                  color="#fff" 
                />
                <ThemedText style={styles.submitCommentText}>
                  {submittingComment ? 'Posting...' : 'Post'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('CreatePoll', { discussionId })}
            >
              <MaterialIcons name="poll" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Create Poll</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  discussionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 15, padding: 20, marginBottom: 20,
  },
  discussionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  discussionContent: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 16, lineHeight: 24, marginBottom: 15 },
  discussionDate: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 },
  
  // Comments Section Styles
  commentsSection: {
    marginBottom: 25,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  commentsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noCommentsContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  noCommentsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  commentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  commentDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  commentContent: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 20,
  },
  
  // Comment Input Styles
  commentInputSection: {
    marginBottom: 25,
  },
  commentInputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  commentInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  commentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  submitCommentButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.5)',
  },
  submitCommentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Actions
  actionsContainer: { gap: 10 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15, padding: 15,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});
