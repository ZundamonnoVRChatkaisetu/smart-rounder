import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  TextInput,
  TouchableOpacity,
  Share,
  Platform,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Appbar, useTheme as usePaperTheme, IconButton } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MoreStackParamList } from '../../navigation/feature/MoreNavigator';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

type WebSearchScreenRouteProp = RouteProp<MoreStackParamList, 'WebSearch'>;
type WebSearchScreenNavigationProp = StackNavigationProp<MoreStackParamList, 'WebSearch'>;

const WebSearchScreen: React.FC = () => {
  const route = useRoute<WebSearchScreenRouteProp>();
  const navigation = useNavigation<WebSearchScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState(route.params?.query || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const webViewRef = useRef<WebView>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  // Load initial URL or search query
  useEffect(() => {
    if (route.params?.query) {
      // Check if the query is a URL
      if (isValidUrl(route.params.query)) {
        const url = formatUrl(route.params.query);
        setCurrentUrl(url);
      } else {
        // Perform search
        performSearch(route.params.query);
      }
    } else {
      // Default to Google
      setCurrentUrl('https://www.google.com/');
    }
  }, [route.params?.query]);
  
  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (isSearchFocused) {
        Keyboard.dismiss();
        setIsSearchFocused(false);
        return true;
      }
      
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen (exit screen)
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, [canGoBack, isSearchFocused]);
  
  // Check if string is a valid URL
  const isValidUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
    return urlPattern.test(text);
  };
  
  // Format URL with protocol if missing
  const formatUrl = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };
  
  // Perform search
  const performSearch = (query: string) => {
    if (isValidUrl(query)) {
      const url = formatUrl(query);
      setCurrentUrl(url);
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      setCurrentUrl(searchUrl);
    }
  };
  
  // Handle search submission
  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    performSearch(searchQuery);
  };
  
  // Navigation state change handler
  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    
    // Extract search query from Google search URL
    if (navState.url.includes('google.com/search?q=')) {
      const urlObj = new URL(navState.url);
      const q = urlObj.searchParams.get('q');
      if (q) {
        setSearchQuery(q);
      }
    } else {
      // Set the URL as search query for other sites
      setSearchQuery(navState.url);
    }
  };
  
  // Share current URL
  const shareUrl = async () => {
    try {
      await Share.share({
        message: currentUrl,
        title: 'Share URL',
      });
    } catch (error) {
      console.error('Error sharing URL:', error);
    }
  };
  
  // Copy URL to clipboard
  const copyUrlToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(currentUrl);
    } catch (error) {
      console.error('Error copying URL to clipboard:', error);
    }
  };
  
  // Clear search input
  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };
  
  // Create user agent
  const userAgent = Platform.select({
    ios: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    android: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
    default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
  });
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.card }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        
        <View style={styles.searchContainer}>
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: isSearchFocused ? theme.colors.primary : theme.colors.border,
              },
            ]}
            placeholder="Search or enter URL"
            placeholderTextColor={theme.colors.text + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.text + '80'}
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchSubmit}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </Appbar.Header>
      
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          userAgent={userAgent}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
              />
            </View>
          )}
          // Better performance
          cacheEnabled={true}
        />
        
        {isLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.background + 'E6' }]}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />
          </View>
        )}
      </View>
      
      <Appbar
        style={[
          styles.bottomBar,
          { backgroundColor: theme.colors.card }
        ]}
      >
        <Appbar.Action
          icon="arrow-left"
          disabled={!canGoBack}
          onPress={() => webViewRef.current?.goBack()}
        />
        <Appbar.Action
          icon="arrow-right"
          disabled={!canGoForward}
          onPress={() => webViewRef.current?.goForward()}
        />
        <Appbar.Action
          icon="reload"
          onPress={() => webViewRef.current?.reload()}
        />
        <Appbar.Action
          icon="home"
          onPress={() => setCurrentUrl('https://www.google.com/')}
        />
        <Appbar.Action
          icon="share-variant"
          onPress={shareUrl}
        />
        <Appbar.Action
          icon="content-copy"
          onPress={copyUrlToClipboard}
        />
      </Appbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingRight: 70,
  },
  clearButton: {
    position: 'absolute',
    right: 40,
    padding: 8,
  },
  searchButton: {
    position: 'absolute',
    right: 8,
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    justifyContent: 'space-around',
    elevation: 4,
  },
});

export default WebSearchScreen;
