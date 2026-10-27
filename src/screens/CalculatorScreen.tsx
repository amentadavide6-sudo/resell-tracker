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
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { PlatformSelector } from '../components/PlatformSelector';
import { CustomInput } from '../components/CustomInput';
import { FeeBreakdownCard } from '../components/FeeBreakdownCard';
import { PLATFORMS } from '../constants/platforms';
import { SHIPPING_PRESETS } from '../constants/shipping';
import { calculateResellProfit } from '../services/feeCalculator';
import {
  getCustomPlatformSettings,
  saveCustomPlatformSettings,
} from '../services/customPlatformManager';
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
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const [platformId, setPlatformId] = useState<PlatformId>('vinted');
  const [sellingPrice, setSellingPrice] = useState<string>('25');
  const [purchaseCost, setPurchaseCost] = useState<string>('5');
  const [sellerShippingCost, setSellerShippingCost] = useState<string>('0');
  const [packagingCost, setPackagingCost] = useState<string>('0.50');

  // Custom platform saved settings
  const savedCustom = useMemo(() => getCustomPlatformSettings(), []);
  const [customName, setCustomName] = useState<string>(savedCustom.name);
  const [customPercent, setCustomPercent] = useState<string>(savedCustom.sellerFeePercent.toString());
  const [customFixed, setCustomFixed] = useState<string>(savedCustom.sellerFixedFee.toString());

  const handleSaveCustomSettings = () => {
    saveCustomPlatformSettings({
      name: customName.trim() || 'Personalizzato',
      sellerFeePercent: parseFloat(customPercent.replace(',', '.')) || 0,
      sellerFixedFee: parseFloat(customFixed.replace(',', '.')) || 0,
    });
    Alert.alert(
      'Piattaforma Salvata! 💾',
      `I parametri di "${customName.trim() || 'Personalizzato'}" (${customPercent}% + ${customFixed}€) sono stati memorizzati per tutti i tuoi calcoli futuri.`
    );
  };

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
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Top Header: Left-aligned only, top-right completely empty to avoid Expo Go / camera overlaps */}
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{strings.calculator.headerSubtitle}</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{strings.calculator.headerTitle}</Text>
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

          {/* Custom Platform Extra Inputs & Saved Manager */}
          {platformId === 'custom' && (
            <View style={[styles.customCard, isDark && { backgroundColor: '#1E1B4B', borderColor: '#312E81' }]}>
              <View style={styles.customCardHeader}>
                <Ionicons name="options-outline" size={18} color="#6366F1" />
                <Text style={[styles.customTitle, isDark && { color: '#C7D2FE' }]}>PARAMETRI PIATTAFORMA PERSONALIZZATA</Text>
              </View>

              <CustomInput
                label="Nome Piattaforma / Canale"
                subtitle="Es. Vestiaire Collective, Mercatino Locale, Etsy"
                value={customName}
                onChangeValue={setCustomName}
                placeholder="Nome piattaforma..."
                isCurrency={false}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <CustomInput
                    label="Commissione %"
                    value={customPercent}
                    onChangeValue={setCustomPercent}
                    placeholder="5.0"
                    prefix="%"
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

              <TouchableOpacity
                style={styles.saveCustomBtn}
                onPress={handleSaveCustomSettings}
                activeOpacity={0.7}
              >
                <Ionicons name="save-outline" size={15} color="#FFFFFF" />
                <Text style={styles.saveCustomBtnText}>Salva Parametri Predefiniti</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Visual Profit Card */}
          <View style={styles.section}>
            <FeeBreakdownCard result={result} platform={selectedPlatform} />
          </View>

          {/* Inputs Section */}
          <View style={styles.inputsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>DATI TRANSAZIONE</Text>
              <TouchableOpacity
                onPress={handleReset}
                style={[styles.resetLink, isDark && { backgroundColor: '#1E293B' }]}
                activeOpacity={0.6}
              >
                <Ionicons name="refresh" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.resetLinkText, { color: colors.primary }]}>Azzera Campi</Text>
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

            {/* Quick Shipping Presets */}
            <View style={styles.shippingPresetsSection}>
              <Text style={[styles.shippingPresetsLabel, { color: colors.textSecondary }]}>
                PRESET SPEDIZIONI RAPIDI
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shippingPresetsScroll}
              >
                {SHIPPING_PRESETS.map((preset) => {
                  const isSelected =
                    parseFloat(sellerShippingCost.replace(',', '.')) === preset.cost;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.shippingPresetChip,
                        { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                        isSelected && {
                          backgroundColor: isDark ? '#312E81' : '#EEF2FF',
                          borderColor: '#6366F1',
                        },
                      ]}
                      onPress={() => setSellerShippingCost(preset.cost === 0 ? '0' : preset.cost.toFixed(2))}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.shippingPresetChipText,
                          { color: isDark ? '#94A3B8' : '#475569' },
                          isSelected && { color: '#6366F1', fontWeight: '800' },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Action Button: Save to Inventory */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveToInventory}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>{strings.calculator.saveToInventory}</Text>
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
    paddingBottom: 220,
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
  customCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  customTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  saveCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 8,
  },
  saveCustomBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  shippingPresetsSection: {
    marginTop: 6,
    marginBottom: 10,
  },
  shippingPresetsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  shippingPresetsScroll: {
    gap: 6,
  },
  shippingPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  shippingPresetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
