import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/theme/colors';
import { AppStateProvider, useAppState } from './src/store/AppStateContext';
import { auth } from './src/store/firebase';
import { AuthScreen } from './src/screens/onboarding/AuthScreen';
import { DiagnosticScreen, avatarImageMap } from './src/screens/onboarding/DiagnosticScreen';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { CalendarScreen } from './src/screens/calendar/CalendarScreen';
import { BathroomScreen } from './src/screens/bathroom/BathroomScreen';
import { ShopScreen } from './src/screens/shop/ShopScreen';
import { PremiumPaywallModal } from './src/components/premium/PremiumPaywallModal';
import { FeedbackSystem } from './src/components/common/FeedbackSystem';
import { SettingsModal } from './src/components/settings/SettingsModal';

type ActiveScreen = 'auth' | 'diagnostic' | 'home';
type ActiveTab = 'dashboard' | 'calendar' | 'bathroom' | 'shop' | 'profile';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('auth');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [tempUserName, setTempUserName] = useState('');
  const [isEditingDiagnostic, setIsEditingDiagnostic] = useState(false);
  const [autoOpenCalendarModal, setAutoOpenCalendarModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const hasProcessedColdLaunch = useRef(false);

  const { themeMode, activeProfile, profiles, isLoading, masterEmail, isPremium, logout: logoutSession, startActiveSession } = useAppState();

  // Listen to notification clicks (morning notification or step timer alert) to launch Active Session
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleNotificationClick = (data: any) => {
      if (data && (data.isMorningNotification || data.isNextStepNotification)) {
        // Redirect user to Home Screen and Dashboard tab
        setCurrentScreen('home');
        setActiveTab('dashboard');
        
        // Start the active session (wrapped in timeout to ensure state settles)
        setTimeout(() => {
          startActiveSession();
        }, 350);
      }
    };

    // 1. Listen when app is running/backgrounded and clicked
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      handleNotificationClick(data);
    });

    // 2. Check if launched cold from a clicked notification on startup (only once)
    if (!hasProcessedColdLaunch.current) {
      hasProcessedColdLaunch.current = true;
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          const data = response.notification.request.content.data;
          handleNotificationClick(data);
        }
      });
    }

    return () => {
      subscription.remove();
    };
  }, [startActiveSession]);

  // Automatically handle routing after login / fetch completes
  useEffect(() => {
    // We only route automatically when:
    // 1. The user is currently on the 'auth' screen
    // 2. We have successfully set a masterEmail (meaning they submitted login)
    // 3. The Firestore fetch has completed (isLoading is false)
    if (currentScreen === 'auth' && masterEmail && !isLoading) {
      if (profiles.length > 0) {
        // Existing user: redirect directly to home dashboard!
        setCurrentScreen('home');
        setActiveTab('dashboard');
      } else {
        // New user or no profiles: redirect to diagnostic onboarding!
        setCurrentScreen('diagnostic');
        const displayName = auth.currentUser?.displayName || 'Utilisateur';
        setTempUserName(displayName);
      }
    }
  }, [profiles, isLoading, masterEmail, currentScreen]);

  // Strict block: if user is not authenticated and loading is complete, redirect to Auth/Login screen
  useEffect(() => {
    if (currentScreen !== 'auth' && !masterEmail && !isLoading) {
      setCurrentScreen('auth');
    }
  }, [masterEmail, isLoading, currentScreen]);


  const navigateToDiagnostic = (userName: string) => {
    setTempUserName(userName);
    setIsEditingDiagnostic(false);
    setCurrentScreen('diagnostic');
  };

  const finishDiagnostic = () => {
    setCurrentScreen('home');
    setActiveTab('dashboard'); // reset to dashboard on complete
  };

  const logout = () => {
    logoutSession(() => {
      setCurrentScreen('auth');
    });
  };

  const isLight = themeMode === 'light';
  const appBackground = isLight ? '#F5F6FA' : colors.background;
  const barBackground = isLight ? '#FFFFFF' : colors.card;
  const barBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const activeTextColor = colors.primary;
  const inactiveTextColor = isLight ? '#888D9F' : colors.textSecondary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appBackground }]}>
      <StatusBar 
        style={isLight ? 'dark' : 'light'} 
      />
      
      <View style={styles.screenWrapper}>
        {currentScreen === 'auth' && (
          <AuthScreen onNavigateToDiagnostic={navigateToDiagnostic} />
        )}
        
        {currentScreen === 'diagnostic' && (
          <DiagnosticScreen 
            userName={tempUserName} 
            isEditing={isEditingDiagnostic}
            onFinishDiagnostic={finishDiagnostic} 
            onCancel={() => setCurrentScreen('home')}
          />
        )}
        
        {currentScreen === 'home' && (
          <View style={styles.homeTabWrapper}>
            {/* Active Tab View */}
            <View style={styles.tabContentWrapper}>
              {activeTab === 'dashboard' && (
                <HomeScreen 
                  onAddProfilePress={() => {
                    setTempUserName('');
                    setIsEditingDiagnostic(false);
                    setCurrentScreen('diagnostic');
                  }}
                  onLogoutPress={logout}
                  onNavigateToCalendar={() => {
                    setAutoOpenCalendarModal(true);
                    setActiveTab('calendar');
                  }}
                  onProfilePress={() => setActiveTab('profile')}
                />
              )}
              {activeTab === 'calendar' && (
                <CalendarScreen 
                  autoOpenAddModal={autoOpenCalendarModal}
                  onCloseAutoOpen={() => setAutoOpenCalendarModal(false)}
                />
              )}
              {activeTab === 'bathroom' && (
                <BathroomScreen />
              )}
              {activeTab === 'shop' && (
                <ShopScreen />
              )}
              {activeTab === 'profile' && (
                <ProfileScreen 
                  onRefireDiagnostic={() => {
                    setIsEditingDiagnostic(true);
                    setCurrentScreen('diagnostic');
                  }}
                  onLogoutPress={logout}
                  onGoBackToHome={() => setActiveTab('dashboard')}
                />
              )}
            </View>

            {/* AdMob Banner Placeholder (for Free Users only) */}
            {!isPremium && (
              <View style={[styles.adMobContainer, isLight ? styles.adMobContainerLight : styles.adMobContainerDark]}>
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={() => setShowPaywall(true)}
                  style={[styles.adMobBanner, isLight ? styles.adMobBannerLight : styles.adMobBannerDark]}
                >
                  <Text style={styles.adMobLabel}>SPONSORISÉ • Retirer les publicités ➔</Text>
                  <Text style={[styles.adMobTitle, { color: isLight ? '#1C1E26' : '#FFFFFF' }]}>
                    My Root'In Premium ✨ | Accès Illimité & Zéro Publicité
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Custom Premium Bottom Navigation Bar */}
            <View style={[
              styles.bottomTabBar, 
              { 
                backgroundColor: barBackground,
                borderColor: barBorder
              }
            ]}>
              {/* Tab 1: Accueil */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.tabItem} 
                onPress={() => setActiveTab('dashboard')}
              >
                <Text style={[styles.tabIcon, { opacity: activeTab === 'dashboard' ? 1 : 0.6 }]}>
                  🏠
                </Text>
                <Text style={[
                  styles.tabLabel, 
                  { color: activeTab === 'dashboard' ? activeTextColor : inactiveTextColor }
                ]}>
                  Accueil
                </Text>
              </TouchableOpacity>

              {/* Tab 2: Calendrier */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.tabItem} 
                onPress={() => setActiveTab('calendar')}
              >
                <Text style={[styles.tabIcon, { opacity: activeTab === 'calendar' ? 1 : 0.6 }]}>
                  📅
                </Text>
                <Text style={[
                  styles.tabLabel, 
                  { color: activeTab === 'calendar' ? activeTextColor : inactiveTextColor }
                ]}>
                  Calendrier
                </Text>
              </TouchableOpacity>

              {/* Tab 3: Mon Espace */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.tabItem} 
                onPress={() => setActiveTab('bathroom')}
              >
                <Text style={[styles.tabIcon, { opacity: activeTab === 'bathroom' ? 1 : 0.6 }]}>
                  🧴
                </Text>
                <Text style={[
                  styles.tabLabel, 
                  { color: activeTab === 'bathroom' ? activeTextColor : inactiveTextColor }
                ]}>
                  Mon Espace
                </Text>
              </TouchableOpacity>

              {/* Tab 4: Shop */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.tabItem} 
                onPress={() => setActiveTab('shop')}
              >
                <Text style={[styles.tabIcon, { opacity: activeTab === 'shop' ? 1 : 0.6 }]}>
                  🛒
                </Text>
                <Text style={[
                  styles.tabLabel, 
                  { color: activeTab === 'shop' ? activeTextColor : inactiveTextColor }
                ]}>
                  Shop
                </Text>
              </TouchableOpacity>

              {/* Tab 5: Paramètres */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.tabItem} 
                onPress={() => setShowSettings(true)}
              >
                <Text style={[styles.tabIcon, { opacity: showSettings ? 1 : 0.6, color: showSettings ? activeTextColor : inactiveTextColor }]}>
                  ⚙️
                </Text>
                <Text style={[
                  styles.tabLabel, 
                  { color: showSettings ? activeTextColor : inactiveTextColor }
                ]}>
                  Paramètres
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 💎 Premium Paywall Modal Overlay */}
      <PremiumPaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      {/* ⚙️ Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={logout}
        themeMode={themeMode}
        masterEmail={masterEmail}
      />

      {/* 💬 POP-UP Feedback Quiz & Care Summary Modal Overlay */}
      <FeedbackSystem />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <MainApp />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  homeTabWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tabContentWrapper: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    position: 'absolute',
    top: -4,
    right: -16,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
  },
  proBadgeText: {
    color: '#0B0D17', // Match dark background for strong contrast
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  adMobContainer: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adMobContainerLight: {
    backgroundColor: '#F5F6FA',
  },
  adMobContainerDark: {
    backgroundColor: '#0B0D17',
  },
  adMobBanner: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  adMobBannerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  adMobBannerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adMobLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  adMobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
