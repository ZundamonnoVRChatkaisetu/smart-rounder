import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Appbar, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MoreStackParamList } from '../../navigation/feature/MoreNavigator';

type YoutubeScreenRouteProp = RouteProp<MoreStackParamList, 'Youtube'>;
type YoutubeScreenNavigationProp = StackNavigationProp<MoreStackParamList, 'Youtube'>;

const YoutubeScreen: React.FC = () => {
  const route = useRoute<YoutubeScreenRouteProp>();
  const navigation = useNavigation<YoutubeScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(route.params?.url || 'https://www.youtube.com/');
  
  const webViewRef = useRef<WebView>(null);
  
  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen (exit screen)
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, [canGoBack]);
  
  // Navigation state change handler
  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
  };
  
  // Create user agent that doesn't get mobile YouTube
  const userAgent = Platform.select({
    ios: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    android: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
    default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
  });
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.card }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="YouTube" />
        <Appbar.Action
          icon="reload"
          onPress={() => webViewRef.current?.reload()}
        />
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
          // Allows YouTube to play videos in fullscreen
          allowsFullscreenVideo={true}
          // Allows inline playback on iOS
          mediaPlaybackRequiresUserAction={false}
          // Better performance
          cacheEnabled={true}
          // Prevent navigation away from YouTube
          onShouldStartLoadWithRequest={(request) => {
            // Allow navigating within YouTube
            if (request.url.includes('youtube.com') || request.url.includes('youtu.be')) {
              return true;
            }
            
            // Override navigation for external links and open them in the app's web browser
            if (request.url !== 'about:blank' && !request.url.includes('javascript:')) {
              navigation.navigate('WebSearch', { query: request.url });
              return false;
            }
            
            return true;
          }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default YoutubeScreen;
