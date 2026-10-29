import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { InventoryItem } from '../types';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { getPlatformById } from '../services/customPlatformManager';

interface SocialProofModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
}

export const SocialProofModal: React.FC<SocialProofModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { strings, t } = useTranslation();

  if (!item) return null;

  const platform = getPlatformById(item.platformId);
  const salePrice = item.actualSellingPrice || item.targetSellingPrice;
  const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;

  const calc = calculateResellProfit({
    sellingPrice: salePrice,
    purchaseCost: item.purchaseCost,
    sellerShippingCost: item.sellerShippingCost,
    packagingCost: item.packagingCost,
    platformId: item.platformId,
  });

  const totalProfit = calc.netProfit * qty;
  const profitSign = totalProfit >= 0 ? '+' : '';

  // Visual split bar percentages (same fluid logic as FeeBreakdownCard)
  const totalBar = Math.max(salePrice, calc.totalCosts, 1);
  const costPct = Math.min(100, Math.round((item.purchaseCost / totalBar) * 100));
  const feePct = Math.min(100, Math.round((calc.totalSellerFees / totalBar) * 100));
  const profitPct = Math.max(0, 100 - costPct - feePct);

  const handleShareStory = async () => {
    try {
      const header = t('socialProof.shareMessageHeader', { platform: platform.name.toUpperCase() });
      const message = `${header}\n\n👕 ${item.title}\n🛒 ${strings.socialProof.purchase}: ${formatEuro(item.purchaseCost)}${qty > 1 ? ` (${qty} ${strings.common.pieces})` : ''}\n💰 ${strings.socialProof.sale}: ${formatEuro(salePrice)}\n🚀 ${strings.socialProof.netProfitEarned}: ${profitSign}${formatEuro(totalProfit)} (ROI +${Math.round(calc.roiPercent)}% • Margine ${calc.marginPercent}%)\n\n⚡ ${strings.socialProof.brandTagline}`;

      await Share.share({
        title: t('socialProof.shareTitle', { profit: `${profitSign}${formatEuro(totalProfit)}` }),
        message,
      });
    } catch (err) {
      console.error('Error sharing story:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.contentContainer}>
          {/* Top Close Bar */}
          <View style={styles.topCloseRow}>
            <TouchableOpacity onPress={onClose} style={styles.closeRoundBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* THE SOCIAL PROOF CARD - Fluid App Design */}
          <View
            style={[
              styles.storyCard,
              {
                backgroundColor: isDark ? '#161F30' : '#FFFFFF',
                borderColor: isDark ? '#283548' : '#E2E8F0',
              },
            ]}
          >
            {/* Card Top Pill Badge */}
            <View style={styles.cardHeaderBadgeRow}>
              <View style={[styles.clubBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                <Ionicons name="sparkles" size={13} color="#D97706" />
                <Text style={styles.clubBadgeText}>{strings.socialProof.dealClosed}</Text>
              </View>

              <View style={[styles.platformPill, { backgroundColor: isDark ? '#1E293B' : platform.badgeBg }]}>
                <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
                <Text style={[styles.platformPillText, { color: platform.color }]}>
                  {platform.name}
                </Text>
              </View>
            </View>

            {/* Photo Preview or Minimalist Fluid Placeholder */}
            <View
              style={[
                styles.imageWrapper,
                { backgroundColor: isDark ? '#0B0F19' : '#F1F5F9' },
              ]}
            >
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.itemImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="shirt-outline" size={48} color={platform.color} />
                </View>
              )}

              {qty > 1 && (
                <View style={[styles.stockPillFloat, { backgroundColor: isDark ? 'rgba(11, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.9)' }]}>
                  <Text style={[styles.stockPillText, { color: colors.primary }]}>Stock: {qty} {strings.common.pieces}</Text>
                </View>
              )}
            </View>

            {/* Item Title */}
            <Text
              style={[styles.itemTitle, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {/* Glowing Big Profit Hero Box (Aligned with FeeBreakdownCard style) */}
            <View
              style={[
                styles.profitHeroBox,
                {
                  backgroundColor: totalProfit >= 0
                    ? (isDark ? '#06281E' : '#ECFDF5')
                    : (isDark ? '#2A0E0E' : '#FEF2F2'),
                  borderColor: totalProfit >= 0
                    ? (isDark ? '#059669' : '#A7F3D0')
                    : (isDark ? '#DC2626' : '#FECACA'),
                },
              ]}
            >
              <Text
                style={[
                  styles.profitHeroLabel,
                  { color: totalProfit >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {strings.socialProof.netProfitEarned}
              </Text>
              <Text
                style={[
                  styles.profitHeroAmount,
                  { color: totalProfit >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {profitSign}{formatEuro(totalProfit)}
              </Text>

              <View style={styles.metricsPillRow}>
                <View
                  style={[
                    styles.metricPill,
                    { backgroundColor: totalProfit >= 0 ? (isDark ? '#064E3B' : '#D1FAE5') : (isDark ? '#7F1D1D' : '#FEE2E2') },
                  ]}
                >
                  <Text
                    style={[
                      styles.metricPillText,
                      { color: totalProfit >= 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    ROI +{Math.round(calc.roiPercent)}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricPill,
                    { backgroundColor: totalProfit >= 0 ? (isDark ? '#064E3B' : '#D1FAE5') : (isDark ? '#7F1D1D' : '#FEE2E2') },
                  ]}
                >
                  <Text
                    style={[
                      styles.metricPillText,
                      { color: totalProfit >= 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {strings.calculator.margin} {calc.marginPercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Fluid Visual Split Bar */}
            <View style={styles.barSection}>
              <View style={[styles.barTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                {costPct > 0 && (
                  <View style={[styles.barSegment, { width: `${costPct}%`, backgroundColor: '#F59E0B' }]} />
                )}
                {feePct > 0 && (
                  <View style={[styles.barSegment, { width: `${feePct}%`, backgroundColor: '#EF4444' }]} />
                )}
                {profitPct > 0 && (
                  <View style={[styles.barSegment, { width: `${profitPct}%`, backgroundColor: '#10B981' }]} />
                )}
              </View>

              <View style={styles.barLegendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>{strings.socialProof.purchase} {costPct}%</Text>
                </View>
                {feePct > 0 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={[styles.legendText, { color: colors.textMuted }]}>Fee {feePct}%</Text>
                  </View>
                )}
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Net {profitPct}%</Text>
                </View>
              </View>
            </View>

            {/* Financial Journey Chips (Acquisto -> Vendita) */}
            <View
              style={[
                styles.journeyRow,
                {
                  backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.journeyCol}>
                <Text style={[styles.journeyLabel, { color: colors.textMuted }]}>{strings.socialProof.purchase}</Text>
                <Text style={[styles.journeyValue, { color: colors.textPrimary }]}>{formatEuro(item.purchaseCost)}</Text>
              </View>
              <View style={styles.journeyArrow}>
                <Ionicons name="arrow-forward" size={15} color={colors.textMuted} />
              </View>
              <View style={styles.journeyCol}>
                <Text style={[styles.journeyLabel, { color: colors.textMuted }]}>{strings.socialProof.sale}</Text>
                <Text style={[styles.journeyValue, { color: colors.textPrimary }]}>{formatEuro(salePrice)}</Text>
              </View>
              <View style={[styles.journeyDivider, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
              <View style={styles.journeyCol}>
                <Text style={[styles.journeyLabel, { color: colors.textMuted }]}>{strings.socialProof.feesAndCosts}</Text>
                <Text style={[styles.journeyValue, { color: '#F59E0B' }]}>
                  {formatEuro(calc.totalSellerFees + (item.sellerShippingCost || 0) + (item.packagingCost || 0))}
                </Text>
              </View>
            </View>

            {/* Fluid Branding Footer */}
            <View style={[styles.cardBrandingFooter, { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <View style={styles.brandGroup}>
                <View style={[styles.brandIconWrap, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                  <Ionicons name="trending-up" size={13} color="#6366F1" />
                </View>
                <Text style={[styles.brandName, { color: colors.textPrimary }]}>ResellTracker</Text>
              </View>
              <Text style={[styles.brandTagline, { color: colors.textMuted }]}>{strings.socialProof.brandTagline}</Text>
            </View>
          </View>

          {/* Action Button: Sleek, Fluid, Modern */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareStory}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>{strings.socialProof.shareButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  topCloseRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  closeRoundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCard: {
    width: '100%',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clubBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  platformPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockPillFloat: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  profitHeroBox: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  profitHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  profitHeroAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  barSection: {
    marginBottom: 12,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barSegment: {
    height: '100%',
  },
  barLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  journeyCol: {
    flex: 1,
    alignItems: 'center',
  },
  journeyArrow: {
    paddingHorizontal: 2,
  },
  journeyDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  journeyLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  journeyValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  cardBrandingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 12,
    fontWeight: '800',
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '500',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
