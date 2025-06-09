import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReviewSection({ route }: { route: any }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      let userId = route?.params?.providerId;
      if (!userId) {
        try {
          const prefs = await AsyncStorage.getItem('userPreferences');
          if (prefs) {
            const parsed = JSON.parse(prefs);
            userId = parsed.userId;
          }
        } catch {}
      }
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/neighbor-works/provider/${userId}/reviews`);
        const data = await res.json();
        setReviews(data);
      } catch {}
      setLoading(false);
    };
    fetchReviews();
  }, [route]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b5998" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>User Reviews</ThemedText>
      <FlatList
        data={reviews}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText type="subtitle">{item.reviewer?.fullName || 'Anonymous'}</ThemedText>
            <ThemedText>Rating: {item.rating} ⭐</ThemedText>
            <ThemedText style={styles.comment}>{item.comment}</ThemedText>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<ThemedText>No reviews found.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fa',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3b5998',
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  comment: {
    marginTop: 6,
    color: '#444',
    fontStyle: 'italic',
  },
});