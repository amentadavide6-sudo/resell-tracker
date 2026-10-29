import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PlatformSelector } from './PlatformSelector';
import { CustomInput } from './CustomInput';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { SHIPPING_PRESETS } from '../constants/shipping';
import { insertInventoryItem, getTotalInventoryCount } from '../services/db';
import { addXP, XP_REWARDS } from '../services/gamification';
import { getProPassInfo, FREE_TIER_ITEM_LIMIT } from '../services/proManager';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { useAlert } from '../context/AlertContext';
import { getAllAvailablePlatforms } from '../services/customPlatformManager';
import { InventoryItem, ItemStatus, PlatformConfig, PlatformId, PlatformFeeOverrides } from '../types';
import { PLATFORMS } from '../constants/platforms';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onItemAdded: () => void;
  initialValues?: {
    title?: string;
    sellingPrice?: number;
    purchaseCost?: number;
    platformId?: PlatformId;
    customSellerFeePercent?: number;
    customSellerFixedFee?: number;
  };
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onItemAdded,
  initialValues,
}) => {
  const { colors, isDark } = useTheme();
  const { strings, language } = useTranslation();
  const { showAlert } = useAlert();
  const scrollViewRef = useRef<any>(null);
  const titleInputRef = useRef<any>(null);
  const [title, setTitle] = useState(initialValues?.title || '');
  const [titleError, setTitleError] = useState<boolean>(false);
  const [showMissingTitleModal, setShowMissingTitleModal] = useState<boolean>(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([
    initialValues?.platformId || 'vinted',
  ]);
  const [activeFeeTab, setActiveFeeTab] = useState<PlatformId>(
    initialValues?.platformId || 'vinted'
  );
  const [customPlatformFees, setCustomPlatformFees] = useState<
    Record<string, { percent: string; fixed: string }>
  >({});

  const [quantity, setQuantity] = useState<number>(1);
  const [sellingPrice, setSellingPrice] = useState(
    initialValues?.sellingPrice ? initialValues.sellingPrice.toString() : '20'
  );
  const [purchaseCost, setPurchaseCost] = useState(
    initialValues?.purchaseCost ? initialValues.purchaseCost.toString() : '5'
  );
  const [sellerShippingCost, setSellerShippingCost] = useState('0');
  const [packagingCost, setPackagingCost] = useState('0.50');
  const [status, setStatus] = useState<ItemStatus>('listed');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const allAvailablePlatforms: PlatformConfig[] = useMemo(
    () => getAllAvailablePlatforms(),
    [visible]
  );

  useEffect(() => {
    if (visible) {
      setTitle(initialValues?.title || '');
      setTitleError(false);
      setShowMissingTitleModal(false);
      const initPlatform = initialValues?.platformId || 'vinted';
      setSelectedPlatforms([initPlatform]);
      setActiveFeeTab(initPlatform);
      setQuantity(1);
      setSellingPrice(
        initialValues?.sellingPrice !== undefined ? initialValues.sellingPrice.toString() : '20'
      );
      setPurchaseCost(
        initialValues?.purchaseCost !== undefined ? initialValues.purchaseCost.toString() : '5'
      );
      setSellerShippingCost('0');
      setPackagingCost('0.50');
      setStatus('listed');
      setPhotoUri(null);

      if (initialValues?.customSellerFeePercent !== undefined && initialValues?.platformId) {
        setCustomPlatformFees({
          [initialValues.platformId]: {
            percent: initialValues.customSellerFeePercent.toString(),
            fixed: (initialValues.customSellerFixedFee ?? 0).toString(),
          },
        });
      } else {
        setCustomPlatformFees({});
      }
    }
  }, [visible, initialValues]);

  const proPassInfo = useMemo(() => getProPassInfo(), [visible]);
  const currentTotalItems = useMemo(() => (visible ? getTotalInventoryCount() : 0), [visible]);
  const isAddingBeyondFreeLimitDuringPass =
    proPassInfo.isActive && !proPassInfo.isPermanentPro && currentTotalItems >= FREE_TIER_ITEM_LIMIT;

  const primaryPlatform = selectedPlatforms[0] || 'vinted';

  const handleTogglePlatform = (id: PlatformId) => {
    setSelectedPlatforms((prev) => {
      let updated: PlatformId[];
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one platform selected
        updated = prev.filter((p) => p !== id);
      } else {
        updated = [...prev, id];
      }
      if (!updated.includes(activeFeeTab)) {
        setActiveFeeTab(updated[0] || 'vinted');
      }
      return updated;
    });
  };

  const handleUpdatePlatformFee = (pId: string, field: 'percent' | 'fixed', val: string) => {
    const p = allAvailablePlatforms.find((item) => item.id === pId) || PLATFORMS[0];
    const current = customPlatformFees[pId] || {
      percent: p.sellerFeePercent.toString(),
      fixed: p.sellerFixedFee.toString(),
    };
    setCustomPlatformFees((prev) => ({
      ...prev,
      [pId]: {
        ...current,
        [field]: val,
      },
    }));
  };

  const handleResetPlatformFee = (pId: string) => {
    setCustomPlatformFees((prev) => {
      const next = { ...prev };
      delete next[pId];
      return next;
    });
  };

  // Live calculation of unit profit before saving (reflecting custom fees of primary platform)
  const primaryCustomFee = customPlatformFees[primaryPlatform];
  const liveResult = useMemo(() => {
    return calculateResellProfit({
      sellingPrice: parseFloat(sellingPrice.replace(',', '.')) || 0,
      purchaseCost: parseFloat(purchaseCost.replace(',', '.')) || 0,
      sellerShippingCost: parseFloat(sellerShippingCost.replace(',', '.')) || 0,
      packagingCost: parseFloat(packagingCost.replace(',', '.')) || 0,
      platformId: primaryPlatform,
      customSellerFeePercent: primaryCustomFee ? parseFloat(primaryCustomFee.percent.replace(',', '.')) : undefined,
      customSellerFixedFee: primaryCustomFee ? parseFloat(primaryCustomFee.fixed.replace(',', '.')) : undefined,
    });
  }, [sellingPrice, purchaseCost, sellerShippingCost, packagingCost, primaryPlatform, primaryCustomFee]);

  const totalPurchaseInvested = useMemo(() => {
    const cost = parseFloat(purchaseCost.replace(',', '.')) || 0;
    return cost * quantity;
  }, [purchaseCost, quantity]);

  const totalPotentialProfit = useMemo(() => {
    return liveResult.netProfit * quantity;
  }, [liveResult.netProfit, quantity]);

  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert({
            title: strings.addItemModal.permissionDenied,
            message: strings.addItemModal.cameraPermissionMsg,
            type: 'warning',
          });
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert({
            title: strings.addItemModal.permissionDenied,
            message: strings.addItemModal.galleryPermissionMsg,
            type: 'warning',
          });
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
      showAlert({
        title: strings.common.error,
        message: 'Impossibile caricare la foto.',
        type: 'error',
      });
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError(true);
      setShowMissingTitleModal(true);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setTitleError(false);
    setShowMissingTitleModal(false);

    const priceNum = parseFloat(sellingPrice.replace(',', '.')) || 0;
    const costNum = parseFloat(purchaseCost.replace(',', '.')) || 0;
    const shippingNum = parseFloat(sellerShippingCost.replace(',', '.')) || 0;
    const pkgNum = parseFloat(packagingCost.replace(',', '.')) || 0;

    // Collect custom fees for platforms that differ from standard defaults
    const customFeesToSave: PlatformFeeOverrides = {};
    selectedPlatforms.forEach((pId) => {
      const pConfig = allAvailablePlatforms.find((p) => p.id === pId) || PLATFORMS[0];
      const fee = customPlatformFees[pId];
      if (fee) {
        const pct = parseFloat(fee.percent.replace(',', '.')) || 0;
        const fix = parseFloat(fee.fixed.replace(',', '.')) || 0;
        if (
          Math.abs(pct - pConfig.sellerFeePercent) > 0.001 ||
          Math.abs(fix - pConfig.sellerFixedFee) > 0.001
        ) {
          customFeesToSave[pId] = { percent: pct, fixed: fix };
        }
      }
    });

    const newItem: Omit<InventoryItem, 'id'> = {
      title: title.trim(),
      platformId: primaryPlatform,
      platforms: selectedPlatforms,
      customFees: Object.keys(customFeesToSave).length > 0 ? customFeesToSave : undefined,
      quantity: Math.max(1, quantity),
      purchaseCost: costNum,
      targetSellingPrice: priceNum,
      sellerShippingCost: shippingNum,
      packagingCost: pkgNum,
      status,
      photoUri,
      createdAt: new Date().toISOString(),
    };

    try {
      insertInventoryItem(newItem);
      const xpRes = addXP(XP_REWARDS.ITEM_ADDED, `Aggiunto: ${newItem.title}`);
      if (xpRes.leveledUp) {
        showAlert({
          title: strings.gamification.levelUpTitle,
          message: `${strings.gamification.youAreHere}: ${xpRes.newLevel.levelNumber} - ${xpRes.newLevel.badge} ${xpRes.newLevel.title}!\n\n🎁 ${xpRes.proPassAwardedHours}h ${strings.gamification.proBoost}!`,
          type: 'success',
        });
      }
      onItemAdded();
      handleResetForm();
      onClose();
    } catch (error) {
      console.error(error);
      showAlert({
        title: strings.common.error,
        message: 'Impossibile salvare l\'articolo nel database.',
        type: 'error',
      });
    }
  };

  const handleDismissMissingTitleModal = () => {
    setShowMissingTitleModal(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 150);
  };

  const handleResetForm = () => {
    setTitle('');
    setTitleError(false);
    setShowMissingTitleModal(false);
    setSelectedPlatforms(['vinted']);
    setActiveFeeTab('vinted');
    setCustomPlatformFees({});
    setQuantity(1);
    setSellingPrice('20');
    setPurchaseCost('5');
    setSellerShippingCost('0');
    setPackagingCost('0.50');
    setPhotoUri(null);
    setStatus('listed');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{strings.addItemModal.modalTitle}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveTopBtn}>
            <Text style={styles.saveTopBtnText}>{strings.addItemModal.saveTopBtn}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Picker */}
          <View style={styles.photoSection}>
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setPhotoUri(null)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPickersRow}>
                <TouchableOpacity
                  style={styles.photoPickerBox}
                  onPress={() => handlePickImage(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={26} color="#6366F1" />
                  <Text style={styles.photoPickerText}>{strings.addItemModal.takePhoto}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoPickerBox}
                  onPress={() => handlePickImage(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images" size={26} color="#6366F1" />
                  <Text style={styles.photoPickerText}>{strings.addItemModal.fromGallery}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Title Input */}
          <View style={[styles.inputCard, titleError && styles.inputCardError]}>
            <CustomInput
              inputRef={titleInputRef}
              label={strings.addItemModal.itemTitleLabel}
              subtitle={strings.addItemModal.itemTitleSubtitle}
              value={title}
              onChangeValue={(text) => {
                setTitle(text);
                if (titleError && text.trim().length > 0) {
                  setTitleError(false);
                }
              }}
              placeholder={strings.addItemModal.itemTitlePlaceholder}
              isCurrency={false}
            />
            {titleError && (
              <View style={styles.inlineErrorRow}>
                <Ionicons name="alert-circle" size={15} color="#EF4444" />
                <Text style={styles.inlineErrorText}>{strings.addItemModal.missingTitleError}</Text>
              </View>
            )}
          </View>

          {/* Multi-Platform Selector */}
          <PlatformSelector
            multiSelect
            selectedIds={selectedPlatforms}
            onToggle={handleTogglePlatform}
            title={strings.addItemModal.activePlatformsTitle}
            platforms={allAvailablePlatforms}
            onDeleteCustom={(deletedId) => {
              setSelectedPlatforms((prev) => {
                const filtered = prev.filter((id) => id !== deletedId);
                return filtered.length > 0 ? filtered : ['vinted'];
              });
            }}
          />

          {/* Platform Specific Fees Box */}
          <View style={[styles.platformFeeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.platformFeeHeader}>
              <View style={styles.platformFeeTitleRow}>
                <Ionicons name="pricetag" size={16} color="#6366F1" />
                <Text style={[styles.platformFeeTitle, { color: colors.textPrimary }]}>
                  {strings.addItemModal.platformFeesTitle}
                </Text>
              </View>
              <Text style={[styles.platformFeeSubtitle, { color: colors.textSecondary }]}>
                {strings.addItemModal.platformFeesSubtitle}
              </Text>
            </View>

            {/* Platform tabs if multiple or single */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.feeTabsScroll}>
              {selectedPlatforms.map((pId) => {
                const pConfig = allAvailablePlatforms.find((p) => p.id === pId) || PLATFORMS[0];
                const isActive = activeFeeTab === pId;
                const isCustomized = !!customPlatformFees[pId];
                return (
                  <TouchableOpacity
                    key={pId}
                    style={[
                      styles.feeTabPill,
                      { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: 'transparent' },
                      isActive && {
                        backgroundColor: isDark ? '#312E81' : '#EEF2FF',
                        borderColor: '#6366F1',
                      },
                    ]}
                    onPress={() => setActiveFeeTab(pId)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.feeTabDot, { backgroundColor: pConfig.badgeBg }]} />
                    <Text
                      style={[
                        styles.feeTabText,
                        { color: colors.textSecondary },
                        isActive && { color: '#6366F1', fontWeight: '700' },
                      ]}
                    >
                      {pConfig.name}
                    </Text>
                    {isCustomized && (
                      <View style={styles.feeModDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Fee Tab Inputs */}
            {(() => {
              const activePlatformConfig = allAvailablePlatforms.find((p) => p.id === activeFeeTab) || PLATFORMS[0];
              const curCustom = customPlatformFees[activeFeeTab];
              const curPercent = curCustom !== undefined ? curCustom.percent : activePlatformConfig.sellerFeePercent.toString();
              const curFixed = curCustom !== undefined ? curCustom.fixed : activePlatformConfig.sellerFixedFee.toString();
              const isModified = curCustom !== undefined;

              return (
                <View style={styles.activeFeeInputsContainer}>
                  <View style={styles.row}>
                    <View style={styles.col}>
                      <CustomInput
                        label={`% Commissione (${activePlatformConfig.name})`}
                        value={curPercent}
                        onChangeValue={(v) => handleUpdatePlatformFee(activeFeeTab, 'percent', v)}
                        placeholder={activePlatformConfig.sellerFeePercent.toString()}
                        prefix="%"
                        isCurrency={false}
                      />
                    </View>
                    <View style={styles.col}>
                      <CustomInput
                        label={`€ Fissa (${activePlatformConfig.name})`}
                        value={curFixed}
                        onChangeValue={(v) => handleUpdatePlatformFee(activeFeeTab, 'fixed', v)}
                        placeholder={activePlatformConfig.sellerFixedFee.toString()}
                        isCurrency={true}
                      />
                    </View>
                  </View>

                  {isModified && (
                    <View style={styles.feeModNoticeRow}>
                      <View style={styles.feeModBadge}>
                        <Ionicons name="sparkles" size={12} color="#D97706" />
                        <Text style={styles.feeModBadgeText}>{strings.addItemModal.customRateBadge}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleResetPlatformFee(activeFeeTab)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.resetPlatformFeeText}>{strings.addItemModal.resetPlatformFee}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>

          {/* Quantity & Stock Stepper */}
          <View style={styles.quantitySection}>
            <View style={styles.quantityHeaderRow}>
              <View>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{strings.addItemModal.quantityTitle}</Text>
                <Text style={[styles.quantitySubtitle, { color: colors.textSecondary }]}>
                  {quantity > 1
                    ? strings.addItemModal.stockCopies.replace('{n}', quantity.toString())
                    : strings.addItemModal.singlePiece}
                </Text>
              </View>
            </View>

            <View style={[styles.stepperContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? colors.textSecondary : colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.stepperValueContainer}>
                <Text style={[styles.stepperValueText, { color: colors.textPrimary }]}>{quantity}</Text>
                <Text style={[styles.stepperUnitText, { color: colors.textSecondary }]}>
                  {quantity === 1 ? 'pz' : 'pz'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => q + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick preset chips for quantity */}
            <View style={styles.quickQtyRow}>
              {[1, 2, 5, 10, 20].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.quickQtyChip,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                    quantity === num && { backgroundColor: '#6366F1' },
                  ]}
                  onPress={() => setQuantity(num)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickQtyChipText,
                      { color: isDark ? '#94A3B8' : '#475569' },
                      quantity === num && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {num}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Selector */}
          <View style={styles.statusSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{strings.addItemModal.initialStatusTitle}</Text>
            <View style={[styles.statusTabs, { backgroundColor: isDark ? '#111827' : '#E2E8F0' }]}>
              <TouchableOpacity
                style={[styles.statusTab, status === 'listed' && { backgroundColor: colors.card }]}
                onPress={() => setStatus('listed')}
              >
                <Text style={[styles.statusTabText, status === 'listed' && { color: colors.textPrimary, fontWeight: '700' }]}>
                  {strings.addItemModal.statusListed}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusTab, status === 'draft' && { backgroundColor: colors.card }]}
                onPress={() => setStatus('draft')}
              >
                <Text style={[styles.statusTabText, status === 'draft' && { color: colors.textPrimary, fontWeight: '700' }]}>
                  {strings.addItemModal.statusDraft}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Financial Inputs */}
          <View style={styles.financialSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{strings.addItemModal.costsAndPricesTitle}</Text>

            <CustomInput
              label={strings.addItemModal.sellingPriceUnitLabel}
              subtitle={quantity > 1 ? `Prezzo al pezzo per ciascuno dei ${quantity} capi` : undefined}
              value={sellingPrice}
              onChangeValue={setSellingPrice}
              quickAddAmounts={[5, 10, 20]}
            />

            <CustomInput
              label={strings.addItemModal.purchaseCostUnitLabel}
              subtitle={quantity > 1 ? `Costo pagato per singolo pezzo (Totale stock: ${formatEuro(totalPurchaseInvested)})` : undefined}
              value={purchaseCost}
              onChangeValue={setPurchaseCost}
              quickAddAmounts={[1, 5, 10]}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <CustomInput
                  label={strings.addItemModal.shippingLabel}
                  subtitle={strings.addItemModal.shippingSubtitle}
                  value={sellerShippingCost}
                  onChangeValue={setSellerShippingCost}
                />
              </View>
              <View style={styles.col}>
                <CustomInput
                  label={strings.addItemModal.packagingLabel}
                  subtitle={strings.addItemModal.packagingSubtitle}
                  value={packagingCost}
                  onChangeValue={setPackagingCost}
                />
              </View>
            </View>

            {/* Quick Shipping Presets (Only displayed for Italian) */}
            {language === 'it' && (
              <View style={styles.shippingPresetsSection}>
                <Text style={[styles.shippingPresetsLabel, { color: colors.textSecondary }]}>
                  {strings.addItemModal.shippingPresetsLabel}
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
            )}
          </View>

          {/* Live Preview Profit Card */}
          <View
            style={[
              styles.previewProfitCard,
              {
                backgroundColor: liveResult.netProfit > 0 ? (isDark ? '#064E3B22' : '#ECFDF5') : (isDark ? '#7F1D1D22' : '#FEF2F2'),
                borderColor: liveResult.netProfit > 0 ? '#10B981' : '#EF4444',
              },
            ]}
          >
            <View style={styles.previewProfitRow}>
              <Text style={[styles.previewProfitLabel, { color: colors.textPrimary }]}>
                {quantity > 1 ? strings.addItemModal.profitPerPiece : strings.addItemModal.estimatedNetProfit}
              </Text>
              <Text
                style={[
                  styles.previewProfitAmount,
                  { color: liveResult.netProfit > 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {formatEuro(liveResult.netProfit)}
              </Text>
            </View>

            {quantity > 1 && (
              <View style={[styles.totalStockProfitRow, { borderTopColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <Text style={[styles.totalStockProfitLabel, { color: colors.textSecondary }]}>
                  {strings.addItemModal.totalStockProfit.replace('{n}', quantity.toString())}
                </Text>
                <Text
                  style={[
                    styles.totalStockProfitAmount,
                    { color: totalPotentialProfit > 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {formatEuro(totalPotentialProfit)}
                </Text>
              </View>
            )}

            <Text style={styles.previewProfitSub}>
              {strings.calculator.margin}: {liveResult.marginPercent}% | {strings.calculator.roi}: {liveResult.roiPercent}%
            </Text>
          </View>

          {/* Pro Pass Warning Notice if adding beyond free limit */}
          {isAddingBeyondFreeLimitDuringPass && (
            <View style={[styles.proPassNoticeBox, { backgroundColor: isDark ? '#451A03' : '#FFFBEB', borderColor: '#F59E0B' }]}>
              <View style={styles.proPassNoticeRow}>
                <Ionicons name="flash" size={16} color="#D97706" />
                <Text style={[styles.proPassNoticeTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                  Stai usando il tuo Pro Pass ({proPassInfo.remainingFormatted} rimasti)
                </Text>
              </View>
              <Text style={[styles.proPassNoticeText, { color: isDark ? '#FEF3C7' : '#B45309' }]}>
                Questo articolo (il tuo {currentTotalItems + 1}° capo) rimarrà al sicuro nel telefono, ma verrà congelato se il pass scadrà prima di attivare il piano Pro.
              </Text>
            </View>
          )}

          {/* Bottom Save Action */}
          <TouchableOpacity style={styles.bottomSaveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.bottomSaveBtnText}>
              {quantity > 1
                ? strings.addItemModal.saveStockBtn.replace('{n}', quantity.toString())
                : strings.addItemModal.saveSingleBtn}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Missing Title Alert Modal Popup */}
        {showMissingTitleModal && (
          <View style={styles.alertOverlay}>
            <TouchableOpacity
              style={styles.alertBackdrop}
              activeOpacity={1}
              onPress={handleDismissMissingTitleModal}
            >
              <TouchableOpacity
                style={[
                  styles.alertDialog,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={[styles.alertIconWrap, { backgroundColor: isDark ? '#3E2723' : '#FEF3C7' }]}>
                  <Ionicons name="warning" size={32} color="#F59E0B" />
                </View>
                <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                  {strings.addItemModal.missingTitlePopupTitle}
                </Text>
                <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                  {strings.addItemModal.missingTitlePopupMessage}
                </Text>
                <TouchableOpacity
                  style={styles.alertBtn}
                  onPress={handleDismissMissingTitleModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.alertBtnText}>
                    {strings.addItemModal.missingTitlePopupBtn}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  saveTopBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveTopBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 220,
  },
  photoSection: {
    padding: 16,
    alignItems: 'center',
  },
  photoPickersRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  photoPickerBox: {
    flex: 1,
    height: 90,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoPickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  photoContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCard: {
    paddingHorizontal: 16,
  },
  quantitySection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  quantityHeaderRow: {
    marginBottom: 8,
  },
  quantitySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperValueContainer: {
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 22,
    fontWeight: '900',
  },
  stepperUnitText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quickQtyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickQtyChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickQtyChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusSection: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  statusTabs: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  financialSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  previewProfitCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  previewProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewProfitLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewProfitAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  totalStockProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  totalStockProfitLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalStockProfitAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  previewProfitSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  bottomSaveBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  bottomSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shippingPresetsSection: {
    marginTop: 8,
    marginBottom: 6,
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
  proPassNoticeBox: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  proPassNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  proPassNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  proPassNoticeText: {
    fontSize: 11,
    lineHeight: 15,
  },
  inputCardError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  inlineErrorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  platformFeeCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  platformFeeHeader: {
    marginBottom: 10,
  },
  platformFeeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformFeeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  platformFeeSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  feeTabsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  feeTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  feeTabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feeTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feeModDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  activeFeeInputsContainer: {
    marginTop: 2,
  },
  feeModNoticeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  feeModBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  feeModBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  resetPlatformFeeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 20,
  },
  alertBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  alertIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
