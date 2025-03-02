import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const success = await signIn(email, password);
      
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <TouchableOpacity 
        style={styles.themeToggle} 
        onPress={toggleTheme}
      >
        <Ionicons 
          name={isDarkMode ? "sunny-outline" : "moon-outline"} 
          size={24} 
          color={theme.colors.text} 
        />
      </TouchableOpacity>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appTitle, { color: theme.colors.primary }]}>
            Smart Rounder
          </Text>
          <Text style={[styles.appSubtitle, { color: theme.colors.text }]}>
            Your all-in-one productivity solution
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
            left={<TextInput.Icon icon="email" />}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />
          
          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordContainer}
          >
            <Text style={[styles.forgotPassword, { color: theme.colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={{ color: theme.colors.text }}>
              Don't have an account?
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.registerButton}
            >
              <Text style={[styles.registerText, { color: theme.colors.primary }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPassword: {
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerButton: {
    marginLeft: 8,
  },
  registerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  themeToggle: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
});

export default LoginScreen;
