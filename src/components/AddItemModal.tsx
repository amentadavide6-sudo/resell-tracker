import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PlatformSelector } from './PlatformSelector';
import { CustomInput } from './CustomInput';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { SHIPPING_PRESETS } from '../constants/shipping';
import { insertInventoryItem } from '../services/db';
import { addXP, XP_REWARDS } from '../services/gamification';
import { useTheme } from '../context/ThemeContext';
import { InventoryItem, ItemStatus, PlatformId } from '../types';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onItemAdded: () => void;
  initialValues?: {
    title?: string;
    sellingPrice?: number;
    purchaseCost?: number;
    platformId?: PlatformId;
  };
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onItemAdded,
  initialValues,
}) => {
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState(initialValues?.title || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([
    initialValues?.platformId || 'vinted',
  ]);
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

  const primaryPlatform = selectedPlatforms[0] || 'vinted';

  const handleTogglePlatform = (id: PlatformId) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one platform selected
        return prev.filter((p) => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Live calculation of unit profit before saving
  const liveResult = useMemo(() => {
    return calculateResellProfit({
      sellingPrice: parseFloat(sellingPrice.replace(',', '.')) || 0,
      purchaseCost: parseFloat(purchaseCost.replace(',', '.')) || 0,
      sellerShippingCost: parseFloat(sellerShippingCost.replace(',', '.')) || 0,
      packagingCost: parseFloat(packagingCost.replace(',', '.')) || 0,
      platformId: primaryPlatform,
    });
  }, [sellingPrice, purchaseCost, sellerShippingCost, packagingCost, primaryPlatform]);

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
          Alert.alert('Permesso negato', 'Serve il permesso fotocamera per scattare una foto al capo.');
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
          Alert.alert('Permesso negato', 'Serve il permesso galleria per selezionare una foto.');
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
      Alert.alert('Errore', 'Impossibile caricare la foto.');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Titolo mancante', "Inserisci un nome o una descrizione breve dell'articolo.");
      return;
    }

    const priceNum = parseFloat(sellingPrice.replace(',', '.')) || 0;
    const costNum = parseFloat(purchaseCost.replace(',', '.')) || 0;
    const shippingNum = parseFloat(sellerShippingCost.replace(',', '.')) || 0;
    const pkgNum = parseFloat(packagingCost.replace(',', '.')) || 0;

    const newItem: Omit<InventoryItem, 'id'> = {
      title: title.trim(),
      platformId: primaryPlatform,
      platforms: selectedPlatforms,
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
        Alert.alert(
          '🎉 LIVELLO SUPERATO!',
          `Congratulazioni! Sei salito al livello ${xpRes.newLevel.levelNumber}: ${xpRes.newLevel.badge} ${xpRes.newLevel.title}!`
        );
      }
      onItemAdded();
      handleResetForm();
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Errore', 'Impossibile salvare l\'articolo nel database.');
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setSelectedPlatforms(['vinted']);
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nuovo Articolo</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveTopBtn}>
            <Text style={styles.saveTopBtnText}>Salva</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
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
                  <Text style={styles.photoPickerText}>Scatta Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoPickerBox}
                  onPress={() => handlePickImage(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images" size={26} color="#6366F1" />
                  <Text style={styles.photoPickerText}>Dalla Galleria</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Title Input */}
          <View style={styles.inputCard}>
            <CustomInput
              label="Nome o Descrizione Articolo"
              subtitle="Es. Giacca Vintage Levi's, Sneakers Nike, Gioco PS4"
              value={title}
              onChangeValue={setTitle}
              placeholder="Inserisci titolo..."
              isCurrency={false}
            />
          </View>

          {/* Multi-Platform Selector */}
          <PlatformSelector
            multiSelect
            selectedIds={selectedPlatforms}
            onToggle={handleTogglePlatform}
            title="PIATTAFORME ATTIVE (MULTI-SELEZIONE)"
          />

          {/* Quantity & Stock Stepper */}
          <View style={styles.quantitySection}>
            <View style={styles.quantityHeaderRow}>
              <View>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>QUANTITÀ / STOCK DISPONIBILE</Text>
                <Text style={[styles.quantitySubtitle, { color: colors.textSecondary }]}>
                  {quantity > 1 ? `Stock di ${quantity} copie identiche dello stesso capo` : 'Capo singolo (1 pezzo)'}
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
                  {quantity === 1 ? 'pezzo' : 'pezzi'}
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
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>STATO INIZIALE</Text>
            <View style={[styles.statusTabs, { backgroundColor: isDark ? '#111827' : '#E2E8F0' }]}>
              <TouchableOpacity
                style={[styles.statusTab, status === 'listed' && { backgroundColor: colors.card }]}
                onPress={() => setStatus('listed')}
              >
                <Text style={[styles.statusTabText, status === 'listed' && { color: colors.textPrimary, fontWeight: '700' }]}>
                  In Vendita
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusTab, status === 'draft' && { backgroundColor: colors.card }]}
                onPress={() => setStatus('draft')}
              >
                <Text style={[styles.statusTabText, status === 'draft' && { color: colors.textPrimary, fontWeight: '700' }]}>
                  Bozza
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Financial Inputs */}
          <View style={styles.financialSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>COSTI & PREZZI UNITARI</Text>

            <CustomInput
              label="Prezzo di Vendita Unitario (€)"
              subtitle={quantity > 1 ? `Prezzo al pezzo per ciascuno dei ${quantity} capi` : undefined}
              value={sellingPrice}
              onChangeValue={setSellingPrice}
              quickAddAmounts={[5, 10, 20]}
            />

            <CustomInput
              label="Costo d'Acquisto Unitario (€)"
              subtitle={quantity > 1 ? `Costo pagato per singolo pezzo (Totale stock: ${formatEuro(totalPurchaseInvested)})` : undefined}
              value={purchaseCost}
              onChangeValue={setPurchaseCost}
              quickAddAmounts={[1, 5, 10]}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <CustomInput
                  label="Spedizione tua (€)"
                  subtitle="Se a tuo carico"
                  value={sellerShippingCost}
                  onChangeValue={setSellerShippingCost}
                />
              </View>
              <View style={styles.col}>
                <CustomInput
                  label="Imballo (€)"
                  subtitle="Busta, scatola"
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
                {quantity > 1 ? 'Guadagno al Pezzo:' : 'Stima Guadagno Netto:'}
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
                  Guadagno Totale Stock ({quantity} pz):
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
              Margine: {liveResult.marginPercent}% | ROI: {liveResult.roiPercent}%
            </Text>
          </View>

          {/* Bottom Save Action */}
          <TouchableOpacity style={styles.bottomSaveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.bottomSaveBtnText}>
              {quantity > 1
                ? `Conferma e Salva Stock (${quantity} pz)`
                : "Conferma e Salva nell'Inventario"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
});
