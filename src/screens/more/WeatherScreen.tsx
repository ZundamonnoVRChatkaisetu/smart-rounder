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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MoreStackParamList } from '../../navigation/feature/MoreNavigator';

type WeatherScreenNavigationProp = StackNavigationProp<MoreStackParamList, 'Weather'>;

const WeatherScreen: React.FC = () => {
  const navigation = useNavigation<WeatherScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('https://x.gd/k1Gao');
  
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
    setCurrentUrl(navState.url);
  };
  
  // Create user agent that works well with weather sites
  const userAgent = Platform.select({
    ios: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    android: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
    default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
  });
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.card }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Weather Forecast" />
        <Appbar.Action
          icon="reload"
          onPress={() => webViewRef.current?.reload()}
        />
        <Appbar.Action
          icon="home"
          onPress={() => {
            setCurrentUrl('https://x.gd/k1Gao');
            webViewRef.current?.goBack();
          }}
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
          // Better performance
          cacheEnabled={true}
          // Inject CSS to hide annoying elements that might appear on weather sites
          injectedJavaScript={`
            (function() {
              // Create a style element
              var style = document.createElement('style');
              
              // Add CSS to hide common ad containers and overlays
              style.textContent = \`
                .ad, .advertisement, .advert, .banner-ad, .ad-banner, 
                [class*="ad-container"], [class*="ad_container"], [class*="adContainer"],
                [id*="ad-container"], [id*="ad_container"], [id*="adContainer"],
                .popup, .modal, .overlay, .cookie-banner, .consent-banner, .gdpr, .subscription-popup,
                .premium-subscription, .premium-banner, .premium-overlay
                {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  opacity: 0 !important;
                  pointer-events: none !important;
                }
                
                /* Make sure the weather content is visible and scrollable */
                body {
                  overflow: auto !important;
                  height: auto !important;
                  position: static !important;
                }
              \`;
              
              // Append the style element to the head
              document.head.appendChild(style);
            })();
          `}
          // Make the weather site responsive
          scalesPageToFit={true}
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

export default WeatherScreen;
