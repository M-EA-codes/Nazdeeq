# Installation Notes for Location Features

## Required Packages

To enable the map-based onboarding and location features, you need to install the following packages:

```bash
# Install expo-location for geolocation
npx expo install expo-location

# Install react-native-maps for map display
npx expo install react-native-maps

# For iOS, also install pods
cd ios && pod install && cd ..
```

## Configuration

### 1. Add permissions to app.json or app.config.js

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Nazdeeq to use your location to find nearby neighbors and services."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Nazdeeq needs your location to show nearby neighbors, rides, and services.",
        "NSLocationAlwaysUsageDescription": "Nazdeeq needs your location to show nearby neighbors, rides, and services."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

### 2. Google Maps API Key (for Android)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
</application>
```

### 3. Backend Setup

The backend now uses MongoDB's geospatial indexing. Make sure to:

1. Restart your MongoDB server
2. The geospatial index on `User.location` will be created automatically
3. Restart your Node.js server

## Testing

After installation:

1. Run `npx expo start` and scan QR code
2. Go through onboarding flow
3. When you reach step 3, you should see a map
4. Tap on the map to set location or use "current location" button
5. Complete onboarding
6. Home dashboard should now show location-aware recommendations

## Troubleshooting

- **Map not showing**: Check that react-native-maps is properly linked
- **Location permission denied**: Check app permissions in device settings
- **Backend errors**: Ensure MongoDB geospatial index is created (`db.users.getIndexes()`)

