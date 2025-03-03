import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import {
  Text,
  Divider,
  List,
  Card,
  useTheme as usePaperTheme,
  Button,
} from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const AboutScreen: React.FC = () => {
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  
  // Open URL in browser
  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error(`Cannot open URL: ${url}`);
    }
  };
  
  // Get app version
  const getAppVersion = (): string => {
    const version = Constants.manifest?.version || '1.0.0';
    const buildNumber = Platform.select({
      ios: Constants.manifest?.ios?.buildNumber,
      android: Constants.manifest?.android?.versionCode,
    });
    
    return buildNumber ? `${version} (${buildNumber})` : version;
  };
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.colors.primary }]}>
          Smart Rounder
        </Text>
        <Text style={[styles.appVersion, { color: theme.colors.text }]}>
          Version {getAppVersion()}
        </Text>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          About Smart Rounder
        </Text>
        
        <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
          Smart Rounder is an all-in-one productivity app designed to help you manage your tasks,
          notes, calendar, and alarms in one unified interface. Stay organized, boost your productivity,
          and never miss an important event or deadline.
        </Text>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Features
        </Text>
        
        <List.Item
          title="Task Management"
          description="Organize and manage your tasks with priorities and deadlines"
          left={props => (
            <List.Icon
              {...props}
              icon="checkbox-marked-circle-outline"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Notes"
          description="Create and organize notes by folders or categories"
          left={props => (
            <List.Icon
              {...props}
              icon="note-text-outline"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Calendar"
          description="Keep track of your events and appointments"
          left={props => (
            <List.Icon
              {...props}
              icon="calendar-outline"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Alarms"
          description="Set alarms and reminders for important events"
          left={props => (
            <List.Icon
              {...props}
              icon="alarm-outline"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="YouTube"
          description="Watch YouTube videos directly in the app"
          left={props => (
            <List.Icon
              {...props}
              icon="youtube"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Web Search"
          description="Search the web without leaving the app"
          left={props => (
            <List.Icon
              {...props}
              icon="web"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Weather Forecast"
          description="Check weather forecasts and alerts"
          left={props => (
            <List.Icon
              {...props}
              icon="weather-partly-cloudy"
              color={theme.colors.primary}
            />
          )}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Contact & Support
        </Text>
        
        <Card style={[styles.contactCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <List.Item
              title="Email"
              description="support@smartrounder.com"
              left={props => (
                <List.Icon
                  {...props}
                  icon="email-outline"
                  color={theme.colors.primary}
                />
              )}
              onPress={() => openURL('mailto:support@smartrounder.com')}
            />
            
            <List.Item
              title="Website"
              description="www.smartrounder.com"
              left={props => (
                <List.Icon
                  {...props}
                  icon="web"
                  color={theme.colors.primary}
                />
              )}
              onPress={() => openURL('https://www.example.com')}
            />
            
            <List.Item
              title="Privacy Policy"
              description="View our privacy policy"
              left={props => (
                <List.Icon
                  {...props}
                  icon="shield-account-outline"
                  color={theme.colors.primary}
                />
              )}
              onPress={() => openURL('https://www.example.com/privacy')}
            />
            
            <List.Item
              title="Terms of Service"
              description="View our terms of service"
              left={props => (
                <List.Icon
                  {...props}
                  icon="file-document-outline"
                  color={theme.colors.primary}
                />
              )}
              onPress={() => openURL('https://www.example.com/terms')}
            />
          </Card.Content>
        </Card>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Credits
        </Text>
        
        <Text style={[styles.creditsText, { color: theme.colors.text }]}>
          Smart Rounder is built with:
        </Text>
        
        <List.Item
          title="Expo"
          description="A framework for universal React applications"
          left={props => (
            <List.Icon
              {...props}
              icon="react"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="React Native"
          description="A framework for building native apps using React"
          left={props => (
            <List.Icon
              {...props}
              icon="language-javascript"
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="React Native Paper"
          description="Material Design for React Native"
          left={props => (
            <List.Icon
              {...props}
              icon="material-design"
              color={theme.colors.primary}
            />
          )}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.copyrightText, { color: theme.colors.text + '80' }]}>
          © {new Date().getFullYear()} Smart Rounder. All rights reserved.
        </Text>
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
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
    paddingHorizontal: 8,
  },
  contactCard: {
    marginTop: 8,
    elevation: 2,
  },
  creditsText: {
    fontSize: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  copyrightText: {
    fontSize: 14,
  },
});

export default AboutScreen;
