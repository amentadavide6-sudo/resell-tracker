import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { useAlert } from '../context/AlertContext';
import { PlatformSelector } from '../components/PlatformSelector';
import { CustomInput } from '../components/CustomInput';
import { FeeBreakdownCard } from '../components/FeeBreakdownCard';
import { AddItemModal } from '../components/AddItemModal';
import { PLATFORMS } from '../constants/platforms';
import { SHIPPING_PRESETS } from '../constants/shipping';
import { calculateResellProfit } from '../services/feeCalculator';
import {
  getAllAvailablePlatforms,
  getAllCustomPlatforms,
  addCustomPlatform,
  deleteCustomPlatform,
} from '../services/customPlatformManager';
import { CalculationInput, PlatformConfig, PlatformId } from '../types';

interface CalculatorScreenProps {
  onSaveItemSuccess?: () => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({ onSaveItemSuccess }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { strings, language } = useTranslation();
  const { showAlert } = useAlert();

  const [availablePlatforms, setAvailablePlatforms] = useState<PlatformConfig[]>(() =>
    getAllAvailablePlatforms()
  );
  const [platformId, setPlatformId] = useState<PlatformId>('vinted');
  const [sellingPrice, setSellingPrice] = useState<string>('25');
  const [purchaseCost, setPurchaseCost] = useState<string>('5');
  const [sellerShippingCost, setSellerShippingCost] = useState<string>('0');
  const [packagingCost, setPackagingCost] = useState<string>('0.50');

  // Fee override state (editable for any chosen platform)
  const [feePercent, setFeePercent] = useState<string>('0');
  const [feeFixed, setFeeFixed] = useState<string>('0');

  // Custom platform form state
  const [customName, setCustomName] = useState<string>('');
  const [customPercent, setCustomPercent] = useState<string>('5');
  const [customFixed, setCustomFixed] = useState<string>('0');

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const refreshPlatforms = useCallback(() => {
    const list = getAllAvailablePlatforms();
    setAvailablePlatforms(list);
  }, []);

  const handleSelectPlatform = useCallback(
    (id: PlatformId) => {
      setPlatformId(id);
      if (id !== 'custom') {
        const target = availablePlatforms.find((p) => p.id === id) || PLATFORMS[0];
        setFeePercent(target.sellerFeePercent.toString());
        setFeeFixed(target.sellerFixedFee.toString());
      }
    },
    [availablePlatforms]
  );

  const customPlatformsList = useMemo(() => {
    return getAllCustomPlatforms();
  }, [availablePlatforms]);

  const handleAddCustomPlatform = () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      showAlert({
        title: strings.common.attention,
        message: strings.calculator.customNamePlaceholder,
        type: 'warning',
      });
      return;
    }

    const feePct = parseFloat(customPercent.replace(',', '.')) || 0;
    const fixFee = parseFloat(customFixed.replace(',', '.')) || 0;

    const created = addCustomPlatform(trimmed, feePct, fixFee);
    refreshPlatforms();
    handleSelectPlatform(created.id);
    setCustomName('');
    setCustomPercent('5');
    setCustomFixed('0');

    showAlert({
      title: strings.common.success,
      message: `"${trimmed}" (${feePct}% + ${fixFee.toFixed(2)}€) ${strings.calculator.customPlatformsListTitle.toLowerCase()}`,
      type: 'success',
    });
  };

  const handleDeleteCustomPlatform = (id: string, name: string) => {
    showAlert({
      title: strings.inventory.deleteConfirmTitle,
      message: `${strings.inventory.deleteConfirmDesc} "${name}"?`,
      type: 'warning',
      buttons: [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: () => {
            deleteCustomPlatform(id);
            refreshPlatforms();
            if (platformId === id) {
              handleSelectPlatform('vinted');
            }
          },
        },
      ],
    });
  };

  const selectedPlatform = useMemo(() => {
    return availablePlatforms.find((p) => p.id === platformId) || PLATFORMS[0];
  }, [availablePlatforms, platformId]);

  const isFeeModified = useMemo(() => {
    if (platformId === 'custom') return false;
    const currentPct = parseFloat(feePercent.replace(',', '.')) || 0;
    const currentFix = parseFloat(feeFixed.replace(',', '.')) || 0;
    const defaultPct = selectedPlatform.sellerFeePercent;
    const defaultFix = selectedPlatform.sellerFixedFee;
    return Math.abs(currentPct - defaultPct) > 0.001 || Math.abs(currentFix - defaultFix) > 0.001;
  }, [platformId, feePercent, feeFixed, selectedPlatform]);

  const calculationInput: CalculationInput = useMemo(() => {
    const customSellerFeePercent =
      platformId === 'custom'
        ? parseFloat(customPercent.replace(',', '.')) || 0
        : parseFloat(feePercent.replace(',', '.')) || 0;

    const customSellerFixedFee =
      platformId === 'custom'
        ? parseFloat(customFixed.replace(',', '.')) || 0
        : parseFloat(feeFixed.replace(',', '.')) || 0;

    return {
      sellingPrice: parseFloat(sellingPrice.replace(',', '.')) || 0,
      purchaseCost: parseFloat(purchaseCost.replace(',', '.')) || 0,
      sellerShippingCost: parseFloat(sellerShippingCost.replace(',', '.')) || 0,
      packagingCost: parseFloat(packagingCost.replace(',', '.')) || 0,
      platformId,
      customSellerFeePercent,
      customSellerFixedFee,
    };
  }, [
    sellingPrice,
    purchaseCost,
    sellerShippingCost,
    packagingCost,
    platformId,
    feePercent,
    feeFixed,
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
    if (platformId !== 'custom') {
      setFeePercent(selectedPlatform.sellerFeePercent.toString());
      setFeeFixed(selectedPlatform.sellerFixedFee.toString());
    }
  };

  const handleSaveToInventory = () => {
    setIsAddModalOpen(true);
  };

  const getPresetLabel = (presetId: string, defaultLabel: string) => {
    switch (presetId) {
      case 'free':
        return strings.calculator.shippingPresetFree;
      case 'inpost':
        return strings.calculator.shippingPresetInpost;
      case 'poste':
        return strings.calculator.shippingPresetPoste;
      case 'courier':
        return strings.calculator.shippingPresetCourier;
      default:
        return defaultLabel;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Top Header */}
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
          {/* Horizontal Platform Selector with Custom Platforms */}
          <PlatformSelector
            selectedId={platformId}
            onSelect={handleSelectPlatform}
            platforms={availablePlatforms}
            title={strings.calculator.selectPlatform}
            onDeleteCustom={(deletedId) => {
              refreshPlatforms();
              if (platformId === deletedId) {
                handleSelectPlatform('vinted');
              }
            }}
          />

          {/* On-the-fly Platform Fee Adjustment Card (for standard or saved platforms) */}
          {platformId !== 'custom' && (
            <View
              style={[
                styles.feeOverrideCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isFeeModified ? '#F59E0B' : (isDark ? '#334155' : '#E2E8F0'),
                },
              ]}
            >
              <View style={styles.feeOverrideHeader}>
                <View style={styles.feeOverrideTitleRow}>
                  <Ionicons
                    name={isFeeModified ? 'flash' : 'pricetag-outline'}
                    size={15}
                    color={isFeeModified ? '#F59E0B' : colors.primary}
                  />
                  <Text style={[styles.feeOverrideTitle, { color: colors.textPrimary }]}>
                    {strings.calculator.platformFeeTitle} ({selectedPlatform.name})
                  </Text>
                  {isFeeModified && (
                    <View style={styles.feeModifiedBadge}>
                      <Text style={styles.feeModifiedBadgeText}>
                        {strings.calculator.feeModifiedBadge}
                      </Text>
                    </View>
                  )}
                </View>

                {isFeeModified && (
                  <TouchableOpacity
                    onPress={() => {
                      setFeePercent(selectedPlatform.sellerFeePercent.toString());
                      setFeeFixed(selectedPlatform.sellerFixedFee.toString());
                    }}
                    style={[
                      styles.resetFeeBtn,
                      { backgroundColor: isDark ? '#312E81' : '#EEF2FF' },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={11} color={colors.primary} style={{ marginRight: 3 }} />
                    <Text style={[styles.resetFeeBtnText, { color: colors.primary }]}>
                      {strings.calculator.resetFeeToDefault}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.feeOverrideSubtitle, { color: colors.textSecondary }]}>
                {isFeeModified
                  ? strings.calculator.feeModifiedDesc
                      .replace('{defaultPct}', selectedPlatform.sellerFeePercent.toString())
                      .replace('{defaultFix}', selectedPlatform.sellerFixedFee.toFixed(2))
                  : strings.calculator.platformFeeSubtitle}
              </Text>

              <View style={styles.row}>
                <View style={styles.col}>
                  <CustomInput
                    label={strings.calculator.customFeePercent}
                    value={feePercent}
                    onChangeValue={setFeePercent}
                    placeholder={selectedPlatform.sellerFeePercent.toString()}
                    prefix="%"
                  />
                </View>
                <View style={styles.col}>
                  <CustomInput
                    label={strings.calculator.customFixedFee}
                    value={feeFixed}
                    onChangeValue={setFeeFixed}
                    placeholder={selectedPlatform.sellerFixedFee.toString()}
                  />
                </View>
              </View>
            </View>
          )}

          {/* If Custom "+ Personalizzata" is selected: show Add Platform Form */}
          {platformId === 'custom' && (
            <View style={[styles.customCard, isDark && { backgroundColor: '#1E1B4B', borderColor: '#312E81' }]}>
              <View style={styles.customCardHeader}>
                <Ionicons name="options-outline" size={18} color="#6366F1" />
                <Text style={[styles.customTitle, isDark && { color: '#C7D2FE' }]}>
                  {strings.calculator.customPlatformTitle}
                </Text>
              </View>

              <CustomInput
                label={strings.calculator.customNameLabel}
                subtitle="Es. Vestiaire Collective, Mercatino, Etsy, Subito a mano"
                value={customName}
                onChangeValue={setCustomName}
                placeholder={strings.calculator.customNamePlaceholder}
                isCurrency={false}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <CustomInput
                    label={strings.calculator.customFeePercent}
                    value={customPercent}
                    onChangeValue={setCustomPercent}
                    placeholder="5.0"
                    prefix="%"
                  />
                </View>
                <View style={styles.col}>
                  <CustomInput
                    label={strings.calculator.customFixedFee}
                    value={customFixed}
                    onChangeValue={setCustomFixed}
                    placeholder="0.50"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveCustomBtn}
                onPress={handleAddCustomPlatform}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.saveCustomBtnText}>{strings.calculator.addPlatformBtn}</Text>
              </TouchableOpacity>

              {/* List of existing custom platforms with delete buttons */}
              {customPlatformsList.length > 0 && (
                <View style={styles.savedCustomListContainer}>
                  <Text style={[styles.savedCustomListTitle, isDark && { color: '#A5B4FC' }]}>
                    {strings.calculator.customPlatformsListTitle}
                  </Text>
                  {customPlatformsList.map((cp) => (
                    <View
                      key={cp.id}
                      style={[
                        styles.savedCustomRow,
                        isDark && { backgroundColor: '#312E81', borderColor: '#4338CA' },
                      ]}
                    >
                      <View style={styles.savedCustomInfo}>
                        <View style={[styles.savedCustomDot, { backgroundColor: cp.color }]} />
                        <Text style={[styles.savedCustomName, isDark && { color: '#FFFFFF' }]}>
                          {cp.name}
                        </Text>
                        <Text style={[styles.savedCustomFee, isDark && { color: '#C7D2FE' }]}>
                          ({cp.sellerFeePercent}% + {cp.sellerFixedFee.toFixed(2)}€)
                        </Text>
                      </View>
                      <View style={styles.savedCustomActions}>
                        <TouchableOpacity
                          style={styles.selectCustomBtn}
                          onPress={() => handleSelectPlatform(cp.id)}
                        >
                          <Text style={styles.selectCustomBtnText}>{strings.common.confirm}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteCustomBtn}
                          onPress={() => handleDeleteCustomPlatform(cp.id, cp.name)}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Visual Profit Card */}
          <View style={styles.section}>
            <FeeBreakdownCard result={result} platform={selectedPlatform} />
          </View>

          {/* Inputs Section */}
          <View style={styles.inputsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                {strings.calculator.transactionData}
              </Text>
              <TouchableOpacity
                onPress={handleReset}
                style={[styles.resetLink, isDark && { backgroundColor: '#1E293B' }]}
                activeOpacity={0.6}
              >
                <Ionicons name="refresh" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.resetLinkText, { color: colors.primary }]}>
                  {strings.calculator.resetFields}
                </Text>
              </TouchableOpacity>
            </View>

            <CustomInput
              label={strings.calculator.sellingPriceLabel}
              subtitle={strings.calculator.sellingPriceSubtitle}
              value={sellingPrice}
              onChangeValue={setSellingPrice}
              quickAddAmounts={[5, 10, 20]}
            />

            <CustomInput
              label={strings.calculator.purchaseCostLabel}
              subtitle={strings.calculator.purchaseCostSubtitle}
              value={purchaseCost}
              onChangeValue={setPurchaseCost}
              quickAddAmounts={[1, 5, 10]}
            />

            {/* Two-column layout for shipping and packaging */}
            <View style={styles.row}>
              <View style={styles.col}>
                <CustomInput
                  label={strings.calculator.shippingLabel}
                  subtitle={strings.calculator.shippingSubtitle}
                  value={sellerShippingCost}
                  onChangeValue={setSellerShippingCost}
                />
              </View>
              <View style={styles.col}>
                <CustomInput
                  label={strings.calculator.packagingLabel}
                  subtitle={strings.calculator.packagingSubtitle}
                  value={packagingCost}
                  onChangeValue={setPackagingCost}
                />
              </View>
            </View>

            {/* Quick Shipping Presets (Only displayed for Italian) */}
            {language === 'it' && (
              <View style={styles.shippingPresetsSection}>
                <Text style={[styles.shippingPresetsLabel, { color: colors.textSecondary }]}>
                  {strings.calculator.presetsTitle}
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
                          {getPresetLabel(preset.id, preset.label)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
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

      {/* Add Item Modal directly launched from Calculator */}
      <AddItemModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={() => {
          setIsAddModalOpen(false);
          onSaveItemSuccess?.();
        }}
        initialValues={{
          sellingPrice: result.sellingPrice,
          purchaseCost: result.purchaseCost,
          platformId,
        }}
      />
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
  feeOverrideCard: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  feeOverrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeOverrideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  feeOverrideTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  feeModifiedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  feeModifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  resetFeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  resetFeeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feeOverrideSubtitle: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 15,
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
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  saveCustomBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savedCustomListContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
    paddingTop: 10,
  },
  savedCustomListTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  savedCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savedCustomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  savedCustomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  savedCustomName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  savedCustomFee: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  savedCustomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectCustomBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectCustomBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteCustomBtn: {
    padding: 4,
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
