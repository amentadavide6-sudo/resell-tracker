import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { useAlert } from '../context/AlertContext';
import { formatEuro } from '../services/feeCalculator';
import { TrophyStatus } from '../services/achievements';
import { LevelInfo } from '../services/gamification';
import { InventoryItem } from '../types';

interface StoryCardModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'trophy' | 'level' | 'deal';
  trophy?: TrophyStatus | null;
  levelInfo?: LevelInfo | null;
  itemDeal?: {
    item: InventoryItem;
    netProfit: number;
    roiPercent: number;
  } | null;
  overallStats?: {
    totalProfit: number;
    totalSold: number;
    avgMargin: number;
  } | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StoryCardModal: React.FC<StoryCardModalProps> = ({
  visible,
  onClose,
  mode,
  trophy,
  levelInfo,
  itemDeal,
  overallStats,
}) => {
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const { showAlert } = useAlert();
  const cardRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  if (!visible) return null;

  const handleShareStory = async () => {
    try {
      setIsSharing(true);
      if (!cardRef.current) {
        setIsSharing(false);
        return;
      }

      // Capture at ultra-crisp 1080x1920 resolution for Instagram/TikTok stories
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
        width: 1080,
        height: 1920,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Condividi Storia ResellTracker',
          UTI: 'public.png',
        });
      } else {
        showAlert({
          title: 'Condivisione non disponibile',
          message: 'La condivisione file non è supportata su questo dispositivo.',
          type: 'warning',
        });
      }
    } catch (err) {
      console.error('Error generating story card:', err);
      showAlert({
        title: 'Errore',
        message: 'Impossibile generare la grafica per la storia.',
        type: 'error',
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleGroup}>
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Anteprima Storia Instagram
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Ecco la grafica in formato 9:16 pronta per essere condivisa nelle tue storie per mostrare i tuoi successi:
            </Text>

            {/* THE INSTAGRAM STORY CANVAS (Captured by view-shot) */}
            <View style={styles.canvasWrapper}>
              <View
                ref={cardRef}
                collapsable={false}
                style={styles.storyCardCanvas}
              >
                {/* Background decorative glows */}
                <View style={styles.glowTopRight} />
                <View style={styles.glowBottomLeft} />

                {/* Top Brand Header */}
                <View style={styles.brandRow}>
                  <View style={styles.brandLogoWrap}>
                    <Ionicons name="stats-chart" size={16} color="#6366F1" />
                    <Text style={styles.brandName}>ResellTracker</Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                    <Text style={styles.verifiedText}>Verified Reseller</Text>
                  </View>
                </View>

                {/* Center Content based on mode */}
                {mode === 'trophy' && trophy && (
                  <View style={styles.contentCenter}>
                    <View style={[styles.trophyIconLargeWrap, { borderColor: trophy.badgeColor }]}>
                      <Ionicons name={trophy.icon as any} size={48} color={trophy.badgeColor} />
                    </View>
                    <View style={[styles.tagPill, { backgroundColor: '#312E81' }]}>
                      <Ionicons name="sparkles" size={12} color="#A5B4FC" />
                      <Text style={styles.tagPillText}>NUOVO TROFEO SBLOCCATO</Text>
                    </View>
                    <Text style={styles.mainTitle}>{trophy.title}</Text>
                    <Text style={styles.mainDesc}>{trophy.description}</Text>
                    <View style={styles.xpBadgeLarge}>
                      <Text style={styles.xpBadgeLargeText}>+{trophy.xpReward} XP Guadagnati</Text>
                    </View>
                  </View>
                )}

                {mode === 'level' && levelInfo && (
                  <View style={styles.contentCenter}>
                    <View style={[styles.trophyIconLargeWrap, { borderColor: levelInfo.badgeColor }]}>
                      <Text style={styles.emojiBadgeLarge}>{levelInfo.badge}</Text>
                    </View>
                    <View style={[styles.tagPill, { backgroundColor: '#431407' }]}>
                      <Ionicons name="flame" size={12} color="#F97316" />
                      <Text style={[styles.tagPillText, { color: '#FED7AA' }]}>LIVELLO RESELLER RAGGIUNTO</Text>
                    </View>
                    <Text style={styles.mainTitle}>Livello {levelInfo.levelNumber}</Text>
                    <Text style={[styles.rankTitle, { color: levelInfo.badgeColor }]}>{levelInfo.title}</Text>
                    <Text style={styles.mainDesc}>Rango conquistato tracciando acquisti e vendite con precisione.</Text>
                  </View>
                )}

                {mode === 'deal' && itemDeal && (
                  <View style={styles.contentCenter}>
                    <View style={[styles.trophyIconLargeWrap, { borderColor: '#10B981' }]}>
                      <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
                    </View>
                    <View style={[styles.tagPill, { backgroundColor: '#064E3B' }]}>
                      <Ionicons name="trending-up" size={12} color="#34D399" />
                      <Text style={[styles.tagPillText, { color: '#A7F3D0' }]}>AFFARE CONCLUSO</Text>
                    </View>
                    <Text style={styles.dealItemTitle} numberOfLines={2}>
                      {itemDeal.item.title}
                    </Text>
                    <Text style={styles.dealProfitAmount}>
                      +{formatEuro(itemDeal.netProfit)}
                    </Text>
                    <Text style={styles.dealProfitSub}>
                      Guadagno Netto Pulito (ROI +{Math.round(itemDeal.roiPercent)}%)
                    </Text>
                  </View>
                )}

                {/* Lifetime Business Overview Stats Box */}
                {overallStats && (
                  <View style={styles.statsCardBox}>
                    <View style={styles.statCol}>
                      <Text style={styles.statVal}>{formatEuro(overallStats.totalProfit)}</Text>
                      <Text style={styles.statLab}>Profitto Netto</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                      <Text style={styles.statVal}>{overallStats.totalSold}</Text>
                      <Text style={styles.statLab}>Capi Venduti</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                      <Text style={styles.statVal}>{overallStats.avgMargin}%</Text>
                      <Text style={styles.statLab}>Margine Medio</Text>
                    </View>
                  </View>
                )}

                {/* Bottom Story Footer (Viral Marketing for ResellTracker) */}
                <View style={styles.storyFooter}>
                  <View style={styles.footerLine} />
                  <View style={styles.footerRow}>
                    <View>
                      <Text style={styles.footerTitle}>Tracciato con precisione su</Text>
                      <Text style={styles.footerBrand}>ResellTracker App</Text>
                    </View>
                    <View style={styles.playBadge}>
                      <Ionicons name="logo-google-playstore" size={13} color="#FFFFFF" />
                      <Text style={styles.playBadgeText}>Google Play</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareStory}
              disabled={isSharing}
              activeOpacity={0.8}
            >
              {isSharing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Condividi Storia su Instagram 🚀</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                {strings.common.cancel}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 10,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 14,
  },
  canvasWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#334155',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  storyCardCanvas: {
    width: Math.min(SCREEN_WIDTH - 64, 320),
    height: Math.min((SCREEN_WIDTH - 64) * (16 / 9), 560),
    backgroundColor: '#090D16',
    borderRadius: 18,
    padding: 18,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  glowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#6366F1',
    opacity: 0.18,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#008E9B',
    opacity: 0.15,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLogoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  contentCenter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  trophyIconLargeWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emojiBadgeLarge: {
    fontSize: 40,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagPillText: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  mainDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  xpBadgeLarge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 4,
  },
  xpBadgeLargeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  dealItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  dealProfitAmount: {
    color: '#10B981',
    fontSize: 34,
    fontWeight: '900',
  },
  dealProfitSub: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statsCardBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161F30',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statLab: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  storyFooter: {
    marginTop: 8,
  },
  footerLine: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTitle: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
  },
  footerBrand: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  playBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  shareBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1306C', // Instagram pink/magenta
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
