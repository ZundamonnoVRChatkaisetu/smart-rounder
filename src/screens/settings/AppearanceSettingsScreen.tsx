import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  List,
  RadioButton,
  Divider,
  Text,
  Card,
  useTheme as usePaperTheme,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/feature/SettingsNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

type AppearanceSettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'AppearanceSettings'>;

const FONT_SIZE_KEY = 'app_font_size';
const THEME_MODE_KEY = 'app_theme_mode';
const PRIMARY_COLOR_KEY = 'app_primary_color';

// Available font sizes
const fontSizes = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

// Available theme modes
const themeModes = [
  { label: 'Light', value: 'light', icon: 'white-balance-sunny' },
  { label: 'Dark', value: 'dark', icon: 'weather-night' },
  { label: 'System', value: 'system', icon: 'theme-light-dark' },
];

// Available primary colors
const primaryColors = [
  { label: 'Blue', value: '#4169E1' },
  { label: 'Purple', value: '#673AB7' },
  { label: 'Teal', value: '#009688' },
  { label: 'Green', value: '#4CAF50' },
  { label: 'Orange', value: '#FF9800' },
  { label: 'Red', value: '#F44336' },
  { label: 'Pink', value: '#E91E63' },
];

const AppearanceSettingsScreen: React.FC = () => {
  const navigation = useNavigation<AppearanceSettingsScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const systemColorScheme = useColorScheme();
  
  const [fontSize, setFontSize] = useState('medium');
  const [themeMode, setThemeMode] = useState(isDarkMode ? 'dark' : 'light');
  const [primaryColor, setPrimaryColor] = useState('#4169E1');
  
  // Load appearance preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const fontSizeValue = await AsyncStorage.getItem(FONT_SIZE_KEY);
        const themeModeValue = await AsyncStorage.getItem(THEME_MODE_KEY);
        const primaryColorValue = await AsyncStorage.getItem(PRIMARY_COLOR_KEY);
        
        if (fontSizeValue) setFontSize(fontSizeValue);
        if (themeModeValue) setThemeMode(themeModeValue);
        if (primaryColorValue) setPrimaryColor(primaryColorValue);
      } catch (error) {
        console.error('Failed to load appearance preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Save preferences
  const savePreference = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to save ${key} preference:`, error);
    }
  };
  
  // Handle font size change
  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    savePreference(FONT_SIZE_KEY, value);
    // In a real app, this would trigger a font size change throughout the app
    Alert.alert('Font Size', 'Font size will be changed when you restart the app');
  };
  
  // Handle theme mode change
  const handleThemeModeChange = (value: string) => {
    setThemeMode(value);
    savePreference(THEME_MODE_KEY, value);
    
    // Change theme immediately
    if (value === 'light') {
      if (isDarkMode) toggleTheme();
    } else if (value === 'dark') {
      if (!isDarkMode) toggleTheme();
    } else if (value === 'system') {
      const shouldBeDark = systemColorScheme === 'dark';
      if (isDarkMode !== shouldBeDark) toggleTheme();
    }
  };
  
  // Handle primary color change
  const handlePrimaryColorChange = (value: string) => {
    setPrimaryColor(value);
    savePreference(PRIMARY_COLOR_KEY, value);
    // In a real app, this would trigger a theme color change throughout the app
    Alert.alert('Primary Color', 'Color theme will be changed when you restart the app');
  };
  
  // Reset to defaults
  const resetToDefaults = async () => {
    try {
      await AsyncStorage.removeItem(FONT_SIZE_KEY);
      await AsyncStorage.removeItem(THEME_MODE_KEY);
      await AsyncStorage.removeItem(PRIMARY_COLOR_KEY);
      
      setFontSize('medium');
      setThemeMode('system');
      setPrimaryColor('#4169E1');
      
      const shouldBeDark = systemColorScheme === 'dark';
      if (isDarkMode !== shouldBeDark) toggleTheme();
      
      Alert.alert('Reset Complete', 'Appearance settings have been reset to defaults');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      Alert.alert('Error', 'Failed to reset preferences');
    }
  };
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Theme
        </Text>
        
        <RadioButton.Group
          onValueChange={handleThemeModeChange}
          value={themeMode}
        >
          {themeModes.map((item) => (
            <List.Item
              key={item.value}
              title={item.label}
              left={() => (
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color={theme.colors.primary}
                  style={styles.listIcon}
                />
              )}
              right={() => (
                <RadioButton
                  value={item.value}
                  color={theme.colors.primary}
                  uncheckedColor={theme.colors.text + '80'}
                />
              )}
              onPress={() => handleThemeModeChange(item.value)}
            />
          ))}
        </RadioButton.Group>
        
        <Divider style={styles.divider} />
        
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Font Size
        </Text>
        
        <RadioButton.Group
          onValueChange={handleFontSizeChange}
          value={fontSize}
        >
          {fontSizes.map((item) => (
            <List.Item
              key={item.value}
              title={item.label}
              right={() => (
                <RadioButton
                  value={item.value}
                  color={theme.colors.primary}
                  uncheckedColor={theme.colors.text + '80'}
                />
              )}
              onPress={() => handleFontSizeChange(item.value)}
            />
          ))}
        </RadioButton.Group>
        
        <Divider style={styles.divider} />
        
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Primary Color
        </Text>
        
        <View style={styles.colorGrid}>
          {primaryColors.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorItem,
                { borderColor: primaryColor === color.value ? theme.colors.primary : 'transparent' }
              ]}
              onPress={() => handlePrimaryColorChange(color.value)}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.value }
                ]}
              />
              <Text style={[styles.colorLabel, { color: theme.colors.text }]}>
                {color.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.resetContainer}>
          <Button
            mode="outlined"
            onPress={resetToDefaults}
            style={styles.resetButton}
            color={theme.colors.primary}
          >
            Reset to Defaults
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 24,
  },
  listIcon: {
    marginRight: 8,
    marginLeft: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  colorItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderWidth: 2,
    borderRadius: 8,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 14,
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resetButton: {
    paddingHorizontal: 24,
  },
});

export default AppearanceSettingsScreen;
