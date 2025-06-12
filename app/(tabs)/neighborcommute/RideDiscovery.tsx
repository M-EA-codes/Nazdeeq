import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';

// Dummy data for UI preview
const dummyRides = [
	{
		_id: '1',
		driver: { name: 'Ali Raza', trustScore: 92, rating: 4.8 },
		origin: { name: 'F-11 Markaz' },
		destination: { name: 'H-9 GIKI Bus Stop' },
		dateTime: '2025-06-07T08:00:00Z',
		seatsAvailable: 2,
		fare: 0,
		recurrence: ['Mon', 'Tue', 'Wed'],
		genderPreference: 'female-only',
		rideNotes: 'Leave sharp at 8 AM',
	},
	// ...add more rides as needed
];

export default function RideDiscovery() {
	const [pickup, setPickup] = useState('');
	const [dropoff, setDropoff] = useState('');
	const [date, setDate] = useState('');
	const [loading, setLoading] = useState(false);
	const [rides, setRides] = useState(dummyRides);

	// Placeholder for search/filter logic
	const handleSearch = () => {
		setLoading(true);
		// TODO: Fetch rides from backend using pickup, dropoff, date
		setTimeout(() => setLoading(false), 1000);
	};

	const renderRide = ({ item }) => (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.driverName}>{item.driver.name}</Text>
				<Text style={styles.trustScore}>Trust: {item.driver.trustScore}</Text>
				<Text style={styles.rating}>⭐ {item.driver.rating}</Text>
			</View>
			<Text style={styles.route}>
				{item.origin.name} → {item.destination.name}
			</Text>
			<Text style={styles.datetime}>{new Date(item.dateTime).toLocaleString()}</Text>
			<View style={styles.cardRow}>
				<Text style={styles.seats}>Seats: {item.seatsAvailable}</Text>
				<Text style={styles.recurrence}>
					{item.recurrence ? `Recurring: ${item.recurrence.join(', ')}` : ''}
				</Text>
				<Text style={styles.fare}>{item.fare === 0 ? 'Free' : `Rs. ${item.fare}`}</Text>
			</View>
			<Text style={styles.notes}>{item.rideNotes}</Text>
			<TouchableOpacity style={styles.joinBtn}>
				<Text style={styles.joinBtnText}>Join Ride</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Ride Discovery</Text>
			<View style={styles.form}>
				<TextInput
					style={styles.input}
					placeholder="Pickup Location"
					value={pickup}
					onChangeText={setPickup}
				/>
				<TextInput
					style={styles.input}
					placeholder="Dropoff Location"
					value={dropoff}
					onChangeText={setDropoff}
				/>
				<TextInput
					style={styles.input}
					placeholder="Departure Date (YYYY-MM-DD)"
					value={date}
					onChangeText={setDate}
				/>
				<TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
					<Text style={styles.searchBtnText}>Search</Text>
				</TouchableOpacity>
			</View>
			{loading ? (
				<ActivityIndicator size="large" color="#3b5998" style={{ marginTop: 20 }} />
			) : (
				<FlatList
					data={rides}
					keyExtractor={item => item._id}
					renderItem={renderRide}
					contentContainerStyle={{ paddingBottom: 40 }}
					ListEmptyComponent={
						<Text style={{ textAlign: 'center', marginTop: 30 }}>No rides found.</Text>
					}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
	title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#3b5998' },
	form: { marginBottom: 18, backgroundColor: '#fff', borderRadius: 8, padding: 12, elevation: 2 },
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 6,
		padding: 10,
		marginBottom: 10,
		backgroundColor: '#f5f5f5',
	},
	searchBtn: { backgroundColor: '#3b5998', borderRadius: 6, padding: 12, alignItems: 'center' },
	searchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
	card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, elevation: 2 },
	cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
	driverName: { fontWeight: 'bold', fontSize: 16, color: '#222' },
	trustScore: { fontSize: 13, color: '#4c669f' },
	rating: { fontSize: 13, color: '#f4b400' },
	route: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
	datetime: { fontSize: 13, color: '#666', marginBottom: 6 },
	cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
	seats: { fontSize: 13, color: '#3b5998' },
	recurrence: { fontSize: 13, color: '#888' },
	fare: { fontSize: 13, color: '#388e3c' },
	notes: { fontSize: 13, color: '#555', fontStyle: 'italic', marginBottom: 8 },
	joinBtn: { backgroundColor: '#4c669f', borderRadius: 6, padding: 10, alignItems: 'center' },
	joinBtnText: { color: '#fff', fontWeight: 'bold' },
});
