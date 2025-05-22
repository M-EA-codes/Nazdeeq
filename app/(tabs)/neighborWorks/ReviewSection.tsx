import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';

const mockReviews = [
  { id: '1', reviewer: 'Sara Ahmed', rating: 5, comment: 'Excellent service, very professional!' },
  { id: '2', reviewer: 'Bilal Raza', rating: 4, comment: 'Good work, but arrived a bit late.' },
  { id: '3', reviewer: 'Ayesha Noor', rating: 5, comment: 'Highly recommended! Will hire again.' },
];

export default function ReviewSection() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>User Reviews</ThemedText>
      <FlatList
        data={mockReviews}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText type="subtitle">{item.reviewer}</ThemedText>
            <ThemedText>Rating: {item.rating} ⭐</ThemedText>
            <ThemedText style={styles.comment}>{item.comment}</ThemedText>
          </View>
        )}
        contentContainerStyle={styles.list}
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