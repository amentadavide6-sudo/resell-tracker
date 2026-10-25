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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PlatformSelector } from '../components/PlatformSelector';
import { CustomInput } from '../components/CustomInput';
import { FeeBreakdownCard } from '../components/FeeBreakdownCard';
import { PLATFORMS } from '../constants/platforms';
import { calculateResellProfit } from '../services/feeCalculator';
import { CalculationInput, PlatformId } from '../types';

interface CalculatorScreenProps {
  onSaveItemSuccess?: (itemData: {
    title: string;
    sellingPrice: number;
    purchaseCost: number;
    platformId: PlatformId;
  }) => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({ onSaveItemSuccess }) => {
  const insets = useSafeAreaInsets();
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

  const handleSaveToInventory = () => {
    if (onSaveItemSuccess) {
      onSaveItemSuccess({
        title: `Articolo ${selectedPlatform.name}`,
        sellingPrice: result.sellingPrice,
        purchaseCost: result.purchaseCost,
        platformId,
      });
    } else {
      Alert.alert(
        'Salvataggio Articolo',
        `Articolo (${result.sellingPrice} € su ${selectedPlatform.name}) con profitto netto di ${result.netProfit.toFixed(2)} € pronto per l'Inventario!`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header: Left-aligned only, top-right completely empty to avoid Expo Go / camera overlaps */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerSubtitle}>CALCOLATORE MARGINI</Text>
            <Text style={styles.headerTitle}>ResellTracker</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                <View style={styles.col}>
                  <CustomInput
                    label="Commissione %"
                    value={customPercent}
                    onChangeValue={setCustomPercent}
                    placeholder="5.0"
                  />
                </View>
                <View style={styles.col}>
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>DATI TRANSAZIONE</Text>
              <TouchableOpacity
                onPress={handleReset}
                style={styles.resetLink}
                activeOpacity={0.6}
              >
                <Ionicons name="refresh" size={13} color="#6366F1" style={{ marginRight: 4 }} />
                <Text style={styles.resetLinkText}>Azzera Campi</Text>
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Prezzo di Vendita Previsto"
              subtitle="Quanto pagherà chi compra l'oggetto"
              value={sellingPrice}
              onChangeValue={setSellingPrice}
              quickAddAmounts={[5, 10, 20]}
            />

            <CustomInput
              label="Costo di Acquisto (Spesa iniziale)"
              subtitle="Quanto hai pagato (0€ se trovato o regalo)"
              value={purchaseCost}
              onChangeValue={setPurchaseCost}
              quickAddAmounts={[1, 5, 10]}
            />

            {/* Two-column layout with isolated columns */}
            <View style={styles.row}>
              <View style={styles.col}>
                <CustomInput
                  label="Spedizione tua"
                  subtitle="Se a tuo carico"
                  value={sellerShippingCost}
                  onChangeValue={setSellerShippingCost}
                />
              </View>
              <View style={styles.col}>
                <CustomInput
                  label="Imballo / Box"
                  subtitle="Busta, etichetta"
                  value={packagingCost}
                  onChangeValue={setPackagingCost}
                />
              </View>
            </View>
          </View>

          {/* Action Button: Save to Inventory */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveToInventory}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Salva in Inventario</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
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
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitles: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: 16,
  },
  inputsSection: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  resetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  resetLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
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
  col: {
    flex: 1,
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
