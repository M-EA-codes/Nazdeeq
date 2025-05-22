import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';

const mockServices = [
  { id: '1', title: 'Plumbing', provider: 'Ali Khan', rating: 4.8 },
  { id: '2', title: 'Electrician', provider: 'Sara Ahmed', rating: 4.6 },
  { id: '3', title: 'Gardening', provider: 'Bilal Raza', rating: 4.9 },
];

export default function ServiceListScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Neighbor Works Services</ThemedText>
      <FlatList
        data={mockServices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText type="subtitle">{item.title}</ThemedText>
            <ThemedText>Provider: {item.provider}</ThemedText>
            <ThemedText>Rating: {item.rating} ⭐</ThemedText>
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
    fontSize: 24,
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
});