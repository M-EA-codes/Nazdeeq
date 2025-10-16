import React from 'react';
import NeighborWorksDashboard from './Dashboard';
import { useNavigation } from '@react-navigation/native';

export default function NeighborWorksIndex() {
  const navigation = useNavigation();
  return <NeighborWorksDashboard navigation={navigation} />;
}