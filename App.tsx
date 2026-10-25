import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { insertInventoryItem } from './src/services/db';
import { PlatformId } from './src/types';

type Tab = 'calculator' | 'inventory' | 'stats' | 'settings';

function MainApp() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState<number>(0);

  const handleSaveFromCalculator = (itemData: {
    title: string;
    sellingPrice: number;
    purchaseCost: number;
    platformId: PlatformId;
  }) => {
    try {
      insertInventoryItem({
        title: itemData.title,
        platformId: itemData.platformId,
        purchaseCost: itemData.purchaseCost,
        targetSellingPrice: itemData.sellingPrice,
        sellerShippingCost: 0,
        packagingCost: 0.5,
        status: 'listed',
        createdAt: new Date().toISOString(),
      });
      setInventoryRefreshKey((prev) => prev + 1);
      Alert.alert(
        'Articolo Salvato!',
        `"${itemData.title}" è stato aggiunto al tuo inventario locale.`,
        [
          {
            text: 'Vai all\'Inventario',
            onPress: () => setActiveTab('inventory'),
          },
          { text: 'Rimani qui', style: 'cancel' },
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Errore', 'Impossibile salvare l\'articolo nell\'inventario.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'calculator' && (
          <CalculatorScreen onSaveItemSuccess={handleSaveFromCalculator} />
        )}
        {activeTab === 'inventory' && <InventoryScreen key={inventoryRefreshKey} />}
        {activeTab === 'stats' && (
          <StatsScreen
            key={`stats-${inventoryRefreshKey}`}
            onNavigateToInventory={() => setActiveTab('inventory')}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen onDataRestored={() => setInventoryRefreshKey((prev) => prev + 1)} />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('calculator')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'calculator' ? 'calculator' : 'calculator-outline'}
            size={22}
            color={activeTab === 'calculator' ? '#6366F1' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'calculator' && styles.tabLabelActive,
            ]}
          >
            Calcola
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
            color={activeTab === 'inventory' ? '#6366F1' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'inventory' && styles.tabLabelActive,
            ]}
          >
            Inventario
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
            color={activeTab === 'stats' ? '#6366F1' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'stats' && styles.tabLabelActive,
            ]}
          >
            Statistiche
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
            color={activeTab === 'settings' ? '#6366F1' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            Aiuto & Info
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
});
