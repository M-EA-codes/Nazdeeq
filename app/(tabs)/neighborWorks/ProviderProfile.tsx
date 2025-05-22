import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';

const mockProvider = {
  name: 'Ali Khan',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  rating: 4.8,
  completedOrders: 120,
  bio: 'Experienced plumber with 10+ years serving the local community. Reliable, friendly, and always on time.',
  address: '123 Main Street, Lahore',
};

export default function ProviderProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: mockProvider.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <ThemedText type="title" style={styles.name}>{mockProvider.name}</ThemedText>
          <ThemedText>Rating: {mockProvider.rating} ⭐</ThemedText>
          <ThemedText>Completed Orders: {mockProvider.completedOrders}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.bio}>{mockProvider.bio}</ThemedText>
      <ThemedText style={styles.address}>Address: {mockProvider.address}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f7f9fa',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#3b5998',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: 4,
  },
  bio: {
    fontSize: 16,
    marginBottom: 10,
    color: '#444',
  },
  address: {
    fontSize: 15,
    color: '#666',
  },
});