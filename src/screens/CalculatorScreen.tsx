import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlatformSelector } from '../components/PlatformSelector';
import { CustomInput } from '../components/CustomInput';
import { FeeBreakdownCard } from '../components/FeeBreakdownCard';
import { PLATFORMS } from '../constants/platforms';
import { calculateResellProfit } from '../services/feeCalculator';
import { CalculationInput, PlatformId } from '../types';

export const CalculatorScreen: React.FC = () => {
  const [platformId, setPlatformId] = useState<PlatformId>('vinted');
  const [sellingPrice, setSellingPrice] = useState<string>('25');
  const [purchaseCost, setPurchaseCost] = useState<string>('5');
  const [sellerShippingCost, setSellerShippingCost] = useState<string>('0');
  const [packagingCost, setPackagingCost] = useState<string>('0.50');

  // Custom platform fields
  const [customPercent, setCustomPercent] = useState<string>('5');
  const [customFixed, setCustomFixed] = useState<string>('0.50');

  const selectedPlatform = useMemo(() => {
    return PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
  }, [platformId]);

  const calculationInput: CalculationInput = useMemo(() => {
    return {
      sellingPrice: parseFloat(sellingPrice.replace(',', '.')) || 0,
      purchaseCost: parseFloat(purchaseCost.replace(',', '.')) || 0,
      sellerShippingCost: parseFloat(sellerShippingCost.replace(',', '.')) || 0,
      packagingCost: parseFloat(packagingCost.replace(',', '.')) || 0,
      platformId,
      customSellerFeePercent:
        platformId === 'custom'
          ? parseFloat(customPercent.replace(',', '.')) || 0
          : undefined,
      customSellerFixedFee:
        platformId === 'custom'
          ? parseFloat(customFixed.replace(',', '.')) || 0
          : undefined,
    };
  }, [
    sellingPrice,
    purchaseCost,
    sellerShippingCost,
    packagingCost,
    platformId,
    customPercent,
    customFixed,
  ]);

  const result = useMemo(() => {
    return calculateResellProfit(calculationInput);
  }, [calculationInput]);

  const handleReset = () => {
    setSellingPrice('0');
    setPurchaseCost('0');
    setSellerShippingCost('0');
    setPackagingCost('0');
  };

  const handleSaveToInventoryPlaceholder = () => {
    Alert.alert(
      'Salvataggio Articolo',
      `Articolo calcolato con profitto di ${result.netProfit.toFixed(2)}€ pronto per essere memorizzato nell'Inventario (disponibile con lo Sprint 2)!`,
      [{ text: 'Ottimo!' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Title Bar */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>CALCOLATORE MARGINI</Text>
              <Text style={styles.headerTitle}>ResellTracker</Text>
            </View>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.resetBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.resetBtnText}>Azzera</Text>
            </TouchableOpacity>
          </View>

          {/* Platform Selector */}
          <PlatformSelector
            selectedId={platformId}
            onSelect={(id) => setPlatformId(id)}
          />

          {/* Custom Platform Extra Inputs */}
          {platformId === 'custom' && (
            <View style={styles.customCard}>
              <Text style={styles.customTitle}>PARAMETRI COMMISSIONE PERSONALIZZATA</Text>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <CustomInput
                    label="Commissione %"
                    value={customPercent}
                    onChangeValue={setCustomPercent}
                    placeholder="5.0"
                  />
                </View>
                <View style={styles.flex1}>
                  <CustomInput
                    label="Costo Fisso €"
                    value={customFixed}
                    onChangeValue={setCustomFixed}
                    placeholder="0.50"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Visual Profit Card */}
          <View style={styles.section}>
            <FeeBreakdownCard result={result} platform={selectedPlatform} />
          </View>

          {/* Inputs Section */}
          <View style={styles.inputsSection}>
            <Text style={styles.sectionHeading}>DATI TRANSAZIONE</Text>

            <CustomInput
              label="Prezzo di Vendita Previsto"
              subtitle="Quanto pagherà l'acquirente per l'oggetto"
              value={sellingPrice}
              onChangeValue={setSellingPrice}
              quickAddAmounts={[5, 10, 20]}
            />

            <CustomInput
              label="Costo di Acquisto (Spesa iniziale)"
              subtitle="Quanto hai pagato per acquistarlo (0€ se trovato/regalo)"
              value={purchaseCost}
              onChangeValue={setPurchaseCost}
              quickAddAmounts={[1, 5, 10]}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <CustomInput
                  label="Spedizione a tuo carico"
                  subtitle="Se inclusa nel prezzo"
                  value={sellerShippingCost}
                  onChangeValue={setSellerShippingCost}
                />
              </View>
              <View style={styles.flex1}>
                <CustomInput
                  label="Imballo / Scatola"
                  subtitle="Busta, etichetta..."
                  value={packagingCost}
                  onChangeValue={setPackagingCost}
                />
              </View>
            </View>
          </View>

          {/* Action Button: Save to Inventory */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveToInventoryPlaceholder}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>+ Salva in Inventario</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  section: {
    paddingHorizontal: 16,
  },
  inputsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  customCard: {
    marginHorizontal: 16,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  customTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
