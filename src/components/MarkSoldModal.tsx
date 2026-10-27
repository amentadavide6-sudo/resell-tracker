import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { InventoryItem, PlatformId } from '../types';
import { CustomInput } from './CustomInput';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { PLATFORMS } from '../constants/platforms';
import { markItemAsSold, recordPartialSale } from '../services/db';
import { addXP, XP_REWARDS } from '../services/gamification';
import { isProUser } from '../services/proManager';

interface MarkSoldModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: (updatedItem: InventoryItem) => void;
}

export const MarkSoldModal: React.FC<MarkSoldModalProps> = ({
  visible,
  item,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const [actualPrice, setActualPrice] = useState<string>('');
  const [soldPlatform, setSoldPlatform] = useState<PlatformId>('vinted');
  const [soldQuantity, setSoldQuantity] = useState<number>(1);
  const isPro = isProUser();

  const totalAvailableQty = item?.quantity && item.quantity > 0 ? item.quantity : 1;
  const activePlatforms = useMemo(() => {
    if (!item) return [];
    if (item.platforms && item.platforms.length > 0) return item.platforms;
    return [item.platformId];
  }, [item]);

  useEffect(() => {
    if (item) {
      setActualPrice(item.targetSellingPrice > 0 ? item.targetSellingPrice.toString() : '');
      setSoldPlatform(item.platformId || 'vinted');
      setSoldQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  const currentPlatformConfig = PLATFORMS.find((p) => p.id === soldPlatform) || PLATFORMS[0];
  const numericUnitPrice = parseFloat(actualPrice.replace(',', '.')) || 0;

  // Real-time calculated fees and net profit per single unit
  const unitBreakdown = calculateResellProfit({
    sellingPrice: numericUnitPrice,
    purchaseCost: item.purchaseCost,
    sellerShippingCost: item.sellerShippingCost,
    packagingCost: item.packagingCost,
    platformId: soldPlatform,
  });

  const totalNetProfit = unitBreakdown.netProfit * soldQuantity;
  const totalRevenue = numericUnitPrice * soldQuantity;

  const handleConfirm = () => {
    if (!item.id) return;
    const finalUnitPrice = numericUnitPrice > 0 ? numericUnitPrice : item.targetSellingPrice;
    const isPartialSale = totalAvailableQty > 1 && soldQuantity < totalAvailableQty;

    try {
      if (isPartialSale) {
        // Split logic: update remaining on listed item and insert new sold item
        recordPartialSale(item, soldQuantity, finalUnitPrice, soldPlatform);
      } else {
        // Full sale
        markItemAsSold(item.id, finalUnitPrice, soldPlatform);
      }

      // 2. Award XP
      const xpResult = addXP(XP_REWARDS.ITEM_SOLD, `Vendita (${soldQuantity}x): ${item.title}`);

      // 3. Delist Assistant Alert if multi-platform
      const otherPlatforms = activePlatforms.filter((p) => p !== soldPlatform);
      if (otherPlatforms.length > 0) {
        const otherNames = otherPlatforms
          .map((id) => PLATFORMS.find((p) => p.id === id)?.name || id)
          .join(', ');

        Alert.alert(
          '🎉 Vendita Registrata con Successo!',
          `Hai guadagnato +${xpResult.earnedXP} XP nel Reseller Club!\n\n⚠️ Promemoria Delist Assistant:\nRicordati di eliminare o disattivare subito l'annuncio da:\n👉 ${otherNames}\nper evitare doppie vendite accidentali e reclami.`
        );
      } else if (xpResult.leveledUp) {
        Alert.alert(
          '🎉 LIVELLO SUPERATO!',
          `Congratulazioni! Sei salito al livello ${xpResult.newLevel.levelNumber}: ${xpResult.newLevel.badge} ${xpResult.newLevel.title}!\n\n+${xpResult.earnedXP} XP guadagnati!`
        );
      }

      onSuccess({
        ...item,
        status: isPartialSale ? 'listed' : 'sold',
        quantity: isPartialSale ? totalAvailableQty - soldQuantity : soldQuantity,
        actualSellingPrice: finalUnitPrice,
        platformId: soldPlatform,
        soldAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      console.error('Error marking as sold:', err);
      Alert.alert('Errore', 'Impossibile salvare la vendita.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <View style={[styles.soldBadge, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.soldBadgeText}>REGISTRA VENDITA</Text>
              </View>
              <Text
                style={[styles.itemTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Item Mini Card */}
            <View style={[styles.itemPreviewRow, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.cardBorder }]}>
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.thumbImage} />
              ) : (
                <View style={[styles.thumbPlaceholder, { backgroundColor: currentPlatformConfig.color + '20' }]}>
                  <Ionicons name="shirt-outline" size={24} color={currentPlatformConfig.color} />
                </View>
              )}

              <View style={styles.itemMeta}>
                <View style={styles.badgeRow}>
                  <View style={[styles.platformBadge, { backgroundColor: isDark ? '#0F172A' : currentPlatformConfig.badgeBg }]}>
                    <Text style={[styles.platformName, { color: currentPlatformConfig.color }]}>
                      {currentPlatformConfig.name}
                    </Text>
                  </View>
                  {totalAvailableQty > 1 && (
                    <View style={[styles.qtyBadge, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                      <Text style={[styles.qtyBadgeText, { color: '#6366F1' }]}>
                        Stock: {totalAvailableQty} pz
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.priceTag, { color: colors.textSecondary }]}>
                  Prezzo listino unitario: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{formatEuro(item.targetSellingPrice)}</Text>
                </Text>
                <Text style={[styles.priceTag, { color: colors.textMuted }]}>
                  Costo acquisto unitario: {formatEuro(item.purchaseCost)}
                </Text>
              </View>
            </View>

            {/* Platform Selection if cross-listed on multiple platforms */}
            {activePlatforms.length > 1 && (
              <View style={styles.sectionBox}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DOVE HAI VENDUTO L'ARTICOLO?</Text>
                <View style={styles.platformOptionsRow}>
                  {activePlatforms.map((pid) => {
                    const pConfig = PLATFORMS.find((p) => p.id === pid) || PLATFORMS[0];
                    const isSelected = soldPlatform === pid;
                    return (
                      <TouchableOpacity
                        key={pid}
                        style={[
                          styles.platformOptionChip,
                          { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.cardBorder },
                          isSelected && { borderColor: pConfig.color, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                        ]}
                        onPress={() => setSoldPlatform(pid)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.dot, { backgroundColor: pConfig.color }]} />
                        <Text style={[styles.platformOptionText, { color: isSelected ? pConfig.color : colors.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                          {pConfig.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quantity Selector if item has multiple pieces */}
            {totalAvailableQty > 1 && (
              <View style={styles.sectionBox}>
                <View style={styles.qtyHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUANTE UNITÀ HAI VENDUTO?</Text>
                  <Text style={[styles.qtySubText, { color: colors.textMuted }]}>
                    Disponibili: {totalAvailableQty} pz
                  </Text>
                </View>

                <View style={[styles.stepperContainer, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, soldQuantity <= 1 && styles.stepperBtnDisabled]}
                    onPress={() => setSoldQuantity((q) => Math.max(1, q - 1))}
                    disabled={soldQuantity <= 1}
                  >
                    <Ionicons name="remove" size={18} color={soldQuantity <= 1 ? colors.textMuted : colors.textPrimary} />
                  </TouchableOpacity>

                  <View style={styles.stepperCenter}>
                    <Text style={[styles.stepperNumber, { color: colors.textPrimary }]}>{soldQuantity}</Text>
                    <Text style={[styles.stepperUnit, { color: colors.textMuted }]}>su {totalAvailableQty} pezzi</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.stepperBtn, soldQuantity >= totalAvailableQty && styles.stepperBtnDisabled]}
                    onPress={() => setSoldQuantity((q) => Math.min(totalAvailableQty, q + 1))}
                    disabled={soldQuantity >= totalAvailableQty}
                  >
                    <Ionicons name="add" size={18} color={soldQuantity >= totalAvailableQty ? colors.textMuted : colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Quick actions for quantity */}
                <View style={styles.quickQtyRow}>
                  <TouchableOpacity
                    style={[styles.quickQtyBtn, soldQuantity === 1 && { backgroundColor: '#6366F1' }]}
                    onPress={() => setSoldQuantity(1)}
                  >
                    <Text style={[styles.quickQtyBtnText, soldQuantity === 1 && { color: '#FFFFFF', fontWeight: '700' }]}>1x</Text>
                  </TouchableOpacity>
                  {totalAvailableQty > 2 && (
                    <TouchableOpacity
                      style={[styles.quickQtyBtn, soldQuantity === 2 && { backgroundColor: '#6366F1' }]}
                      onPress={() => setSoldQuantity(2)}
                    >
                      <Text style={[styles.quickQtyBtnText, soldQuantity === 2 && { color: '#FFFFFF', fontWeight: '700' }]}>2x</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.quickQtyBtn, soldQuantity === totalAvailableQty && { backgroundColor: '#6366F1' }]}
                    onPress={() => setSoldQuantity(totalAvailableQty)}
                  >
                    <Text style={[styles.quickQtyBtnText, soldQuantity === totalAvailableQty && { color: '#FFFFFF', fontWeight: '700' }]}>
                      Tutti ({totalAvailableQty}x)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Input final price */}
            <View style={styles.inputSection}>
              <CustomInput
                label={totalAvailableQty > 1 ? "Prezzo Finale di Vendita Unitario (€)" : "Prezzo di Vendita Finale Effettivo (€)"}
                subtitle="Se hai fatto uno sconto o accettato un'offerta, modificalo qui"
                value={actualPrice}
                onChangeValue={setActualPrice}
                quickAddAmounts={[5, 10, 20]}
                placeholder={item.targetSellingPrice.toString()}
              />
            </View>

            {/* Live Profit Preview Box */}
            <View style={[styles.profitBox, isDark ? { backgroundColor: '#064E3B22', borderColor: '#059669' } : { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <View style={styles.profitRow}>
                <View>
                  <Text style={[styles.profitLabel, { color: isDark ? '#A7F3D0' : '#047857' }]}>
                    {soldQuantity > 1 ? `GUADAGNO TOTALE (${soldQuantity} PEZZI)` : 'GUADAGNO NETTO REALE'}
                  </Text>
                  <Text style={[styles.profitSub, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                    Incasso lordo: {formatEuro(totalRevenue)} | Fee: -{formatEuro(unitBreakdown.totalSellerFees * soldQuantity)}
                  </Text>
                </View>
                <Text style={[styles.profitValue, { color: totalNetProfit >= 0 ? (isDark ? '#34D399' : '#059669') : '#EF4444' }]}>
                  {formatEuro(totalNetProfit)}
                </Text>
              </View>

              <View style={styles.xpPill}>
                <Text style={styles.xpPillText}>
                  ⭐ +{isPro ? '200' : '100'} XP Reseller per questa vendita {isPro ? '⚡' : ''}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>
                {soldQuantity < totalAvailableQty ? `Vendi ${soldQuantity} pz (Split)` : 'Conferma Vendita'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  soldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  soldBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  bodyScroll: {
    marginVertical: 4,
  },
  itemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  thumbImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemMeta: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  platformBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '700',
  },
  qtyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priceTag: {
    fontSize: 12,
    marginTop: 1,
  },
  sectionBox: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  platformOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformOptionText: {
    fontSize: 13,
  },
  qtyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  qtySubText: {
    fontSize: 12,
    fontWeight: '600',
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
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperCenter: {
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  stepperUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickQtyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickQtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  quickQtyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  inputSection: {
    marginBottom: 14,
  },
  profitBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profitLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  profitSub: {
    fontSize: 11,
    marginTop: 2,
  },
  profitValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  xpPill: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  xpPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
