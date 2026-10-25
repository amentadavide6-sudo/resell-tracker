import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
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
          <SafeAreaView style={styles.placeholderContainer}>
            <Ionicons name="bar-chart-outline" size={54} color="#10B981" />
            <Text style={styles.placeholderTitle}>Dashboard & Statistiche</Text>
            <Text style={styles.placeholderSubtitle}>
              In arrivo nello Sprint 3: grafici di profitto mensile, ROI aggregato ed esportazione del registro in CSV/Excel.
            </Text>
          </SafeAreaView>
        )}
        {activeTab === 'settings' && (
          <SafeAreaView style={styles.placeholderContainer}>
            <Ionicons name="sparkles-outline" size={54} color="#F59E0B" />
            <Text style={styles.placeholderTitle}>Versione Pro & Impostazioni</Text>
            <Text style={styles.placeholderSubtitle}>
              In arrivo nello Sprint 4: Google Play Billing (sblocco Pro a vita), gestione valute e backup dei dati su file.
            </Text>
          </SafeAreaView>
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
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? '#6366F1' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            Impostazioni
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
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
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
