import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import config from '@/config';

export default function ServiceListScreen({ navigation }: { navigation: { navigate: (screen: string, params?: any) => void } }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${config.API_URL}/neighbor-works/services`)
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b5998" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Neighbor Works Services</ThemedText>
      <FlatList
        data={services}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProviderProfile', { provider: item.provider })}>
            <ThemedText type="subtitle">{item.category}</ThemedText>
            <ThemedText>Provider: {item.provider.fullName}</ThemedText>
            <ThemedText>Rating: {item.provider.rating} ⭐</ThemedText>
            <ThemedText>Verified: {item.provider.isVerified ? 'Yes' : 'No'}</ThemedText>
            {item.priceRange && <ThemedText>Price: {item.priceRange}</ThemedText>}
            {item.location && <ThemedText>Location: {item.location}</ThemedText>}
            {item.gallery && item.gallery.length > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                {item.gallery.slice(0, 3).map((img: string, idx: number) => (
                  <Image key={idx} source={{ uri: img }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 4 }} />
                ))}
              </View>
            )}
          </TouchableOpacity>
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