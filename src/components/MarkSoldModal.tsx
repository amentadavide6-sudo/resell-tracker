import React, { useState, useEffect } from 'react';
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
import { InventoryItem } from '../types';
import { CustomInput } from './CustomInput';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { PLATFORMS } from '../constants/platforms';
import { markItemAsSold } from '../services/db';
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
  const isPro = isProUser();

  useEffect(() => {
    if (item) {
      setActualPrice(item.targetSellingPrice > 0 ? item.targetSellingPrice.toString() : '');
    }
  }, [item]);

  if (!item) return null;

  const platform = PLATFORMS.find((p) => p.id === item.platformId) || PLATFORMS[0];
  const numericPrice = parseFloat(actualPrice.replace(',', '.')) || 0;

  // Real-time calculated fees and net profit
  const breakdown = calculateResellProfit({
    sellingPrice: numericPrice,
    purchaseCost: item.purchaseCost,
    sellerShippingCost: item.sellerShippingCost,
    packagingCost: item.packagingCost,
    platformId: item.platformId,
  });

  const handleConfirm = () => {
    if (!item.id) return;
    const finalPrice = numericPrice > 0 ? numericPrice : item.targetSellingPrice;

    try {
      // 1. Update SQLite
      markItemAsSold(item.id, finalPrice);

      // 2. Award XP
      const xpResult = addXP(XP_REWARDS.ITEM_SOLD, `Vendita: ${item.title}`);

      // 3. Inform user
      const xpText = `+${xpResult.earnedXP} XP guadagnati! ${isPro ? '(Boost 2x Pro attivo ⚡)' : ''}`;
      if (xpResult.leveledUp) {
        Alert.alert(
          '🎉 LIVELLO SUPERATO!',
          `Congratulazioni! Sei salito al livello ${xpResult.newLevel.levelNumber}: ${xpResult.newLevel.badge} ${xpResult.newLevel.title}!\n\n${xpText}`
        );
      }

      onSuccess({
        ...item,
        status: 'sold',
        actualSellingPrice: finalPrice,
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
                <View style={[styles.thumbPlaceholder, { backgroundColor: platform.color + '20' }]}>
                  <Ionicons name="shirt-outline" size={24} color={platform.color} />
                </View>
              )}

              <View style={styles.itemMeta}>
                <View style={styles.platformBadge}>
                  <Text style={[styles.platformName, { color: platform.color }]}>
                    {platform.name}
                  </Text>
                </View>
                <Text style={[styles.priceTag, { color: colors.textSecondary }]}>
                  Prezzo listino originario: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{formatEuro(item.targetSellingPrice)}</Text>
                </Text>
                <Text style={[styles.priceTag, { color: colors.textMuted }]}>
                  Costo acquisto: {formatEuro(item.purchaseCost)}
                </Text>
              </View>
            </View>

            {/* Input final price */}
            <View style={styles.inputSection}>
              <CustomInput
                label="Prezzo di Vendita Finale Effettivo"
                subtitle="Se hai fatto uno sconto o accettato un'offerta, modificalo qui"
                value={actualPrice}
                onChangeValue={setActualPrice}
                quickAddAmounts={[5, 10, 20]}
                placeholder={item.targetSellingPrice.toString()}
              />
            </View>

            {/* Live Profit Preview Box */}
            <View style={[styles.profitBox, isDark ? { backgroundColor: '#064E3B', borderColor: '#059669' } : { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <View style={styles.profitRow}>
                <View>
                  <Text style={[styles.profitLabel, { color: isDark ? '#A7F3D0' : '#047857' }]}>GUADAGNO NETTO REALE</Text>
                  <Text style={[styles.profitSub, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                    Trattenute fee: -{formatEuro(breakdown.totalSellerFees)}
                  </Text>
                </View>
                <Text style={[styles.profitValue, { color: breakdown.netProfit >= 0 ? (isDark ? '#34D399' : '#059669') : '#EF4444' }]}>
                  {formatEuro(breakdown.netProfit)}
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
              <Text style={styles.confirmBtnText}>Conferma Vendita</Text>
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
    maxHeight: '85%',
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
  platformBadge: {
    marginBottom: 2,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceTag: {
    fontSize: 12,
    marginTop: 1,
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
