import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Avatar,
  Divider,
  Text,
  useTheme as usePaperTheme,
  Dialog,
  Portal,
  Paragraph,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/feature/SettingsNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

type AccountSettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'AccountSettings'>;

const AccountSettingsScreen: React.FC = () => {
  const navigation = useNavigation<AccountSettingsScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [secureCurrentPassword, setSecureCurrentPassword] = useState(true);
  const [secureNewPassword, setSecureNewPassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Validation errors
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };
  
  // Handle profile save
  const handleProfileSave = async () => {
    // Validate inputs
    let isValid = true;
    
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    if (!isValid) return;
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setIsProfileEditing(false);
      
      setSnackbarMessage('Profile updated successfully');
      setSnackbarVisible(true);
    }, 1000);
  };
  
  // Handle password save
  const handlePasswordSave = async () => {
    // Validate inputs
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordError('');
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setIsPasswordEditing(false);
      
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSnackbarMessage('Password updated successfully');
      setSnackbarVisible(true);
    }, 1000);
  };
  
  // Cancel editing
  const handleCancel = () => {
    if (isProfileEditing) {
      setUsername(user?.username || '');
      setEmail(user?.email || '');
      setIsProfileEditing(false);
    }
    
    if (isPasswordEditing) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordEditing(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={100}
            label={(user?.username || '').substring(0, 2).toUpperCase()}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          
          <TouchableOpacity style={styles.avatarEditButton}>
            <MaterialIcons
              name="edit"
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Profile Information
            </Text>
            {!isProfileEditing ? (
              <Button
                mode="text"
                onPress={() => setIsProfileEditing(true)}
                color={theme.colors.primary}
              >
                Edit
              </Button>
            ) : null}
          </View>
          
          {isProfileEditing ? (
            <>
              <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                error={!!usernameError}
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              {usernameError ? (
                <HelperText type="error" visible={!!usernameError}>
                  {usernameError}
                </HelperText>
              ) : null}
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                error={!!emailError}
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              {emailError ? (
                <HelperText type="error" visible={!!emailError}>
                  {emailError}
                </HelperText>
              ) : null}
              
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                  color={theme.colors.text}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleProfileSave}
                  style={styles.saveButton}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Save
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.profileInfoRow}>
                <Text style={[styles.profileLabel, { color: theme.colors.text + '99' }]}>
                  Username
                </Text>
                <Text style={[styles.profileValue, { color: theme.colors.text }]}>
                  {user?.username || ''}
                </Text>
              </View>
              
              <View style={styles.profileInfoRow}>
                <Text style={[styles.profileLabel, { color: theme.colors.text + '99' }]}>
                  Email
                </Text>
                <Text style={[styles.profileValue, { color: theme.colors.text }]}>
                  {user?.email || ''}
                </Text>
              </View>
            </>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Password
            </Text>
            {!isPasswordEditing ? (
              <Button
                mode="text"
                onPress={() => setIsPasswordEditing(true)}
                color={theme.colors.primary}
              >
                Change
              </Button>
            ) : null}
          </View>
          
          {isPasswordEditing ? (
            <>
              <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={secureCurrentPassword}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: theme.colors.primary } }}
                right={
                  <TextInput.Icon
                    icon={secureCurrentPassword ? 'eye' : 'eye-off'}
                    onPress={() => setSecureCurrentPassword(!secureCurrentPassword)}
                  />
                }
              />
              
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={secureNewPassword}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: theme.colors.primary } }}
                right={
                  <TextInput.Icon
                    icon={secureNewPassword ? 'eye' : 'eye-off'}
                    onPress={() => setSecureNewPassword(!secureNewPassword)}
                  />
                }
              />
              
              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secureConfirmPassword}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: theme.colors.primary } }}
                right={
                  <TextInput.Icon
                    icon={secureConfirmPassword ? 'eye' : 'eye-off'}
                    onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                  />
                }
              />
              
              {passwordError ? (
                <HelperText type="error" visible={!!passwordError}>
                  {passwordError}
                </HelperText>
              ) : null}
              
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                  color={theme.colors.text}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handlePasswordSave}
                  style={styles.saveButton}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Update Password
                </Button>
              </View>
            </>
          ) : (
            <Text style={[styles.passwordInfo, { color: theme.colors.text }]}>
              Change your password to keep your account secure
            </Text>
          )}
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    position: 'relative',
  },
  avatar: {
    marginBottom: 16,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 20,
    right: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileInfoRow: {
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 2,
  },
  divider: {
    marginVertical: 16,
  },
  passwordInfo: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default AccountSettingsScreen;
