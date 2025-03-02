import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Divider,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MoreStackParamList } from '../../navigation/feature/MoreNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type MoreScreenNavigationProp = StackNavigationProp<MoreStackParamList, 'MoreList'>;

// Define feature items
const featureItems = [
  {
    id: 'youtube',
    title: 'YouTube',
    description: 'Watch videos directly in the app',
    icon: 'youtube',
    iconFamily: 'MaterialCommunityIcons',
    color: '#FF0000',
    screen: 'Youtube',
    params: { url: 'https://www.youtube.com/' },
  },
  {
    id: 'websearch',
    title: 'Web Search',
    description: 'Search the web with Google',
    icon: 'search',
    iconFamily: 'Ionicons',
    color: '#4285F4',
    screen: 'WebSearch',
    params: {},
  },
  {
    id: 'weather',
    title: 'Weather Forecast',
    description: 'Check the weather forecast',
    icon: 'partly-sunny',
    iconFamily: 'Ionicons',
    color: '#FFB100',
    screen: 'Weather',
    params: {},
  },
];

const MoreScreen: React.FC = () => {
  const navigation = useNavigation<MoreScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  
  // Render icon based on family
  const renderIcon = (item: typeof featureItems[0]) => {
    const size = 36;
    
    switch (item.iconFamily) {
      case 'MaterialIcons':
        return <MaterialIcons name={item.icon as any} size={size} color={item.color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={item.icon as any} size={size} color={item.color} />;
      case 'Ionicons':
      default:
        return <Ionicons name={item.icon as any} size={size} color={item.color} />;
    }
  };
  
  // Navigate to the selected feature
  const navigateToFeature = (item: typeof featureItems[0]) => {
    navigation.navigate(item.screen as any, item.params);
  };
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
          Additional Features
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text }]}>
          Explore more tools to boost your productivity
        </Text>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.featuresContainer}>
        {featureItems.map(item => (
          <Card
            key={item.id}
            style={[
              styles.featureCard,
              { backgroundColor: theme.colors.card }
            ]}
            onPress={() => navigateToFeature(item)}
          >
            <Card.Content style={styles.featureContent}>
              <View style={styles.featureIconContainer}>
                {renderIcon(item)}
              </View>
              <View style={styles.featureTextContainer}>
                <Title style={[styles.featureTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Title>
                <Paragraph style={[styles.featureDescription, { color: theme.colors.text + 'CC' }]}>
                  {item.description}
                </Paragraph>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.aboutContainer}>
        <Text style={[styles.aboutTitle, { color: theme.colors.primary }]}>
          About Smart Rounder
        </Text>
        <Text style={[styles.aboutText, { color: theme.colors.text }]}>
          Smart Rounder is an all-in-one productivity app designed to help you manage your tasks,
          notes, calendar, and alarms in one unified interface.
        </Text>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.text + '99' }]}>
            Version 1.0.0
          </Text>
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
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  divider: {
    marginVertical: 16,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    marginBottom: 16,
    elevation: 2,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
  },
  aboutContainer: {
    marginBottom: 32,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  versionContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
  },
});

export default MoreScreen;
