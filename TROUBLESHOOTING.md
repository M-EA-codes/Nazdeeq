# Troubleshooting: codegenNativeCommands Error

## Error
```
ERROR TypeError: 0, _reactNative.codegenNativeCommands is not a function (it is undefined), js engine: hermes
```

## This error occurs with react-native-maps when native modules aren't properly linked.

## Solutions (Try in order):

### Solution 1: Clear Cache and Rebuild
```bash
# Stop the metro bundler (Ctrl+C)

# Clear all caches
npx expo start -c

# Or manually:
rm -rf node_modules
npm cache clean --force
npm install
npx expo start -c
```

### Solution 2: Reset Metro Bundler
```bash
# Stop expo
# Clear watchman cache (if on Mac/Linux)
watchman watch-del-all

# Clear metro cache
npx react-native start --reset-cache
```

### Solution 3: Reinstall react-native-maps
```bash
npm uninstall react-native-maps
npx expo install react-native-maps
```

### Solution 4: For iOS (if using iOS)
```bash
cd ios
pod deintegrate
pod install
cd ..
npx expo start -c
```

### Solution 5: Temporary Workaround (Use Text Input Instead of Map)

If the above doesn't work immediately and you need to test other features, you can temporarily revert to the text-based location input:

Edit `app/(auth)/onboarding.tsx` and replace Step 3 map section with a simple text input (see below).

---

## Quick Fix: Revert to Text Input Temporarily

Replace Step 3 in onboarding.tsx:

```tsx
case 3:
  return (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Where do you live?</ThemedText>
      <ThemedText style={styles.stepSubtitle}>
        Enter your home address or neighborhood
      </ThemedText>
      
      <View style={styles.locationContainer}>
        <TextInput
          style={styles.locationInput}
          placeholder="Enter your location (e.g., F-8 Markaz, Islamabad)"
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            setAddress(text);
          }}
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.switchContainer}>
        <ThemedText style={styles.switchLabel}>
          Connect with people from nearby areas?
        </ThemedText>
        <Switch
          value={connectNearby}
          onValueChange={setConnectNearby}
          trackColor={{ false: '#767577', true: '#4c669f' }}
          thumbColor={connectNearby ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );
```

And update the imports to remove map-related imports:
```tsx
// Comment out or remove these lines temporarily:
// import * as Location from 'expo-location';
// import MapView, { Marker } from 'react-native-maps';
```

The backend will still accept location data, just without precise coordinates for now.

---

## Recommended Fix for Production

The best solution is **Solution 1** - clear cache and rebuild. This will properly link all native modules.

After running Solution 1, you should be able to use the map-based location picker without issues.

