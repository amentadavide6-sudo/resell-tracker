import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider, useTranslation } from './src/i18n';
import { AlertProvider, useAlert } from './src/context/AlertContext';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ProModal } from './src/components/ProModal';
import { OnboardingModal } from './src/components/OnboardingModal';
import { AdBanner } from './src/components/AdBanner';
import { hasSeenOnboarding } from './src/services/onboarding';
import { scheduleSmartNotifications } from './src/services/notifications';

type Tab = 'calculator' | 'inventory' | 'stats' | 'settings';

function MainApp() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState<number>(0);
  const [proModalVisible, setProModalVisible] = useState<boolean>(false);
  const [onboardingVisible, setOnboardingVisible] = useState<boolean>(() => !hasSeenOnboarding());

  useEffect(() => {
    scheduleSmartNotifications();
  }, []);

  const handleSaveFromCalculator = () => {
    setInventoryRefreshKey((prev) => prev + 1);
    showAlert({
      title: strings.calculator.saveSuccess,
      message: strings.calculator.saveSuccessDesc,
      type: 'success',
      buttons: [
        {
          text: strings.calculator.goToInventory,
          onPress: () => setActiveTab('inventory'),
        },
        { text: strings.calculator.stayHere, style: 'cancel' },
      ],
    });
  };

  const inactiveTabColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'calculator' && (
          <CalculatorScreen onSaveItemSuccess={handleSaveFromCalculator} />
        )}
        {activeTab === 'inventory' && (
          <InventoryScreen
            key={inventoryRefreshKey}
            onOpenProModal={() => setProModalVisible(true)}
          />
        )}
        {activeTab === 'stats' && (
          <StatsScreen
            key={`stats-${inventoryRefreshKey}`}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onOpenProModal={() => setProModalVisible(true)}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            onDataRestored={() => setInventoryRefreshKey((prev) => prev + 1)}
            onOpenProModal={() => setProModalVisible(true)}
            onOpenTutorial={() => setOnboardingVisible(true)}
          />
        )}
      </View>

      {/* AdMob Banner for Free Users (Hidden when Pro) */}
      <AdBanner onUpgradePress={() => setProModalVisible(true)} />

      {/* Bottom Tab Bar with exact bottom safe area inset */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('calculator')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'calculator' ? 'calculator' : 'calculator-outline'}
            size={22}
            color={activeTab === 'calculator' ? colors.primary : inactiveTabColor}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'calculator' ? colors.primary : inactiveTabColor },
              activeTab === 'calculator' && styles.tabLabelActive,
            ]}
          >
            {strings.tabs.calculator}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('inventory')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'inventory' ? 'pricetags' : 'pricetags-outline'}
            size={22}
            color={activeTab === 'inventory' ? colors.primary : inactiveTabColor}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'inventory' ? colors.primary : inactiveTabColor },
              activeTab === 'inventory' && styles.tabLabelActive,
            ]}
          >
            {strings.tabs.inventory}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('stats')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'stats' ? 'bar-chart' : 'bar-chart-outline'}
            size={22}
            color={activeTab === 'stats' ? colors.primary : inactiveTabColor}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'stats' ? colors.primary : inactiveTabColor },
              activeTab === 'stats' && styles.tabLabelActive,
            ]}
          >
            {strings.tabs.stats}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'help-circle' : 'help-circle-outline'}
            size={22}
            color={activeTab === 'settings' ? colors.primary : inactiveTabColor}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'settings' ? colors.primary : inactiveTabColor },
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            {strings.tabs.settings}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pro Modal */}
      <ProModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
        onProUnlocked={() => {
          setInventoryRefreshKey((prev) => prev + 1);
        }}
      />

      {/* Interactive Onboarding Tutorial */}
      <OnboardingModal
        visible={onboardingVisible}
        onClose={() => setOnboardingVisible(false)}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <MainApp />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
