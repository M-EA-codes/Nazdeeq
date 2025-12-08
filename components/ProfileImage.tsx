import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';

interface ProfileImageProps {
  source?: string | null;
  userId?: string;
  userName?: string;
  size?: number;
  style?: ImageStyle | ViewStyle;
  textStyle?: TextStyle;
}

export default function ProfileImage({ 
  source, 
  userId = '', 
  userName = '', 
  size = 50,
  style,
  textStyle 
}: ProfileImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Generate placeholder URL
  const generatePlaceholder = () => {
    if (!userId && !userName) {
      return `https://via.placeholder.com/${size}x${size}/cccccc/ffffff?text=?`;
    }
    
    const colors = ['#7f53ac', '#4b32c3', '#3ad29f', '#3a8fd2', '#ff6b6b'];
    const colorIndex = (userId || userName).length % colors.length;
    const initial = userName?.charAt(0)?.toUpperCase() || userId?.charAt(0)?.toUpperCase() || '?';
    const color = colors[colorIndex].substring(1);
    
    return `https://via.placeholder.com/${size}x${size}/${color}/ffffff?text=${initial}`;
  };

  const imageUri = (!source || source.trim() === '' || imageError) 
    ? generatePlaceholder() 
    : source;

  const handleError = () => {
    setImageError(true);
  };

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#e0e0e0' }, style]}>
      <Image
        source={{ uri: imageUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={handleError}
        resizeMode="cover"
      />
    </View>
  );
}

