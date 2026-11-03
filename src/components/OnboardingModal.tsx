import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { useCurrency } from '../context/CurrencyContext';
import { setSeenOnboarding } from '../services/onboarding';
import { FiscalSettingsSheet } from './FiscalSettingsSheet';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fiscalSheetVisible, setFiscalSheetVisible] = useState(false);

  const totalSteps = 5;
  const isLastSlide = currentIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLastSlide) {
      setSeenOnboarding(true);
      onClose();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setSeenOnboarding(true);
    onClose();
  };

  const renderSpotlightContent = () => {
    switch (currentIndex) {
      case 0:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>PIATTAFORME & GEOLOCALIZZAZIONE</Text>
            </View>
            <View style={styles.mockPlatformBar}>
              <View style={[styles.mockPlatformChip, styles.mockPlatformChipActive]}>
                <View style={[styles.mockDot, { backgroundColor: '#00A896' }]} />
                <Text style={styles.mockChipTextActive}>Vinted</Text>
                <View style={styles.mockBadgeActive}>
                  <Text style={styles.mockBadgeTextActive}>0%</Text>
                </View>
              </View>
              <View style={styles.mockPlatformChip}>
                <View style={[styles.mockDot, { backgroundColor: '#E53238' }]} />
                <Text style={[styles.mockChipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>eBay</Text>
              </View>
              <View style={styles.mockPlatformChip}>
                <View style={[styles.mockDot, { backgroundColor: '#8E1632' }]} />
                <Text style={[styles.mockChipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Poshmark</Text>
              </View>
              <View style={[styles.mockPlatformChip, { borderColor: '#818CF8' }]}>
                <Ionicons name="add" size={13} color="#6366F1" />
                <Text style={[styles.mockChipText, { color: '#6366F1', fontWeight: '700' }]}>+ Nuova</Text>
              </View>
            </View>
            <View style={styles.spotlightCalloutBox}>
              <Ionicons name="globe-outline" size={13} color="#6366F1" />
              <Text style={styles.spotlightCalloutText} numberOfLines={1}>
                Ordinamento automatico per paese e canali personalizzati!
              </Text>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>PROFITTO NETTO & MULTIVALUTA</Text>
            </View>
            <View style={[styles.mockSplitCard, { backgroundColor: isDark ? '#064E3B22' : '#ECFDF5', borderColor: '#10B981' }]}>
              <View style={styles.mockProfitRow}>
                <View>
                  <Text style={[styles.mockProfitLabel, { color: isDark ? '#A7F3D0' : '#047857' }]}>GUADAGNO NETTO</Text>
                  <Text style={[styles.mockProfitAmount, { color: isDark ? '#34D399' : '#059669' }]}>
                    +{formatCurrency(19.50)}
                  </Text>
                </View>
                <View style={styles.mockRoiBadge}>
                  <Text style={styles.mockRoiText}>ROI +390%</Text>
                </View>
              </View>
              <View style={styles.mockSplitBarTrack}>
                <View style={[styles.mockSplitSegment, { flex: 78, backgroundColor: '#10B981' }]} />
                <View style={[styles.mockSplitSegment, { flex: 16, backgroundColor: '#3B82F6' }]} />
                <View style={[styles.mockSplitSegment, { flex: 6, backgroundColor: '#F59E0B' }]} />
              </View>
              <View style={styles.mockSplitLegendRow}>
                <Text style={styles.mockLegendItem}>🟢 Netto (78%)</Text>
                <Text style={styles.mockLegendItem}>🔵 Acquisto (16%)</Text>
                <Text style={styles.mockLegendItem}>🟡 Fee (6%)</Text>
              </View>
            </View>
            <View style={styles.spotlightCalloutBox}>
              <Ionicons name="cash-outline" size={13} color="#10B981" />
              <Text style={styles.spotlightCalloutText} numberOfLines={1}>
                Supporto multivaluta automatico: € Euro, $ Dollaro, £ Sterlina.
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>INVENTARIO, STOCK & CROSS-LISTING</Text>
            </View>
            <View style={[styles.mockInventoryCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View style={styles.mockItemThumb}>
                <Ionicons name="shirt" size={22} color="#6366F1" />
              </View>
              <View style={styles.mockItemMeta}>
                <View style={styles.mockBadgeRow}>
                  <View style={styles.mockItemStatusPill}>
                    <Text style={styles.mockItemStatusText}>In Vendita</Text>
                  </View>
                  <View style={styles.mockQtyPill}>
                    <Text style={styles.mockQtyText}>Stock: 3 pz</Text>
                  </View>
                </View>
                <Text style={[styles.mockItemTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
                  Giacca Vintage Denim
                </Text>
                <View style={styles.mockItemPlatformsRow}>
                  <Text style={styles.mockPlatformTag}>Vinted</Text>
                  <Text style={styles.mockPlatformTag}>Wallapop</Text>
                  <Text style={styles.mockPlatformTag}>eBay</Text>
                </View>
              </View>
            </View>
            <View style={styles.spotlightCalloutBox}>
              <Ionicons name="shield-checkmark" size={13} color="#10B981" />
              <Text style={styles.spotlightCalloutText} numberOfLines={1}>
                Delist Assistant per evitare vendite duplicate su altre piattaforme!
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>MONITORAGGIO FISCALE ADATTIVO</Text>
            </View>
            <View style={[styles.mockDacCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View style={styles.mockDacHeaderRow}>
                <Text style={[styles.mockDacTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Soglie Fiscali (DAC7 / 1099-K / HMRC)
                </Text>
                <View style={styles.mockDacSafePill}>
                  <Text style={styles.mockDacSafeText}>🟢 Conforme</Text>
                </View>
              </View>
              <Text style={[styles.mockDacDesc, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
                12 / 30 vendite • {formatCurrency(480)} (Nessuna segnalazione fiscale)
              </Text>
              <View style={styles.mockFiscalBarTrack}>
                <View style={[styles.mockFiscalBarFill, { width: '40%' }]} />
              </View>
            </View>
            {/* Configure Fiscal Settings button */}
            <TouchableOpacity
              style={styles.fiscalConfigBtn}
              onPress={() => setFiscalSheetVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
              <Text style={styles.fiscalConfigBtnText}>
                {strings.fiscalSheet?.configureFiscalBtn ?? 'Configure Fiscal Settings & Currency'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
      default:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>RESELLER CLUB, STORY & BACKUP</Text>
            </View>
            <View style={[styles.mockPerksCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View style={styles.mockPerkBadgeRow}>
                <Text style={styles.mockXpBadge}>👑 Livello 4 • Onyx Prestige</Text>
                <Text style={styles.mockXpBonus}>+200 XP ⚡</Text>
              </View>
              <View style={styles.mockPerksMiniGrid}>
                <View style={[styles.mockMiniPill, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                  <Ionicons name="share-social" size={13} color="#6366F1" />
                  <Text style={[styles.mockMiniPillText, { color: '#6366F1' }]}>Story Instagram/TikTok</Text>
                </View>
                <View style={[styles.mockMiniPill, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                  <Ionicons name="cloud-upload" size={13} color="#10B981" />
                  <Text style={[styles.mockMiniPillText, { color: '#10B981' }]}>Backup Google Drive</Text>
                </View>
              </View>
            </View>
            <View style={styles.spotlightCalloutBox}>
              <Ionicons name="sparkles" size={13} color="#F59E0B" />
              <Text style={styles.spotlightCalloutText} numberOfLines={1}>
                Sblocca Temi VIP esclusivi e condividi i tuoi migliori affari!
              </Text>
            </View>
          </View>
        );
    }
  };

  const getStepTitle = () => {
    switch (currentIndex) {
      case 0:
        return strings.tour.step1Title;
      case 1:
        return strings.tour.step2Title;
      case 2:
        return strings.tour.step3Title;
      case 3:
        return strings.tour.step4Title;
      case 4:
      default:
        return strings.tour.step5Title;
    }
  };

  const getStepDesc = () => {
    switch (currentIndex) {
      case 0:
        return strings.tour.step1Desc;
      case 1:
        return strings.tour.step2Desc;
      case 2:
        return strings.tour.step3Desc;
      case 3:
        return strings.tour.step4Desc;
      case 4:
      default:
        return strings.tour.step5Desc;
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent onRequestClose={handleSkip}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* Header with Step Counter and Skip */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepIndicatorPill}>
                <Text style={styles.stepIndicatorText}>
                  {strings.tour.stepIndicator
                    .replace('{current}', (currentIndex + 1).toString())
                    .replace('{total}', totalSteps.toString())}
                </Text>
              </View>

              {!isLastSlide ? (
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
                  <Text style={[styles.skipText, { color: colors.textMuted }]}>{strings.tour.skip}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.skipPlaceholder} />
              )}
            </View>

            {/* Fixed Spotlight Preview Container */}
            <View style={styles.spotlightContainer}>
              {renderSpotlightContent()}
            </View>

            {/* Fixed Text Content Container (Does not jump or change card height) */}
            <View style={styles.textContentContainer}>
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {getStepTitle()}
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]} numberOfLines={4}>
                {getStepDesc()}
              </Text>
            </View>

            {/* Pinned Bottom Footer with Progress Dots & Buttons */}
            <View style={styles.footerContainer}>
              <View style={styles.dotsRow}>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          idx === currentIndex
                            ? colors.primary
                            : isDark
                            ? '#334155'
                            : '#E2E8F0',
                        width: idx === currentIndex ? 24 : 7,
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.footerRow}>
                {currentIndex > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.backBtn,
                      {
                        borderColor: colors.cardBorder,
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      },
                    ]}
                    onPress={() => setCurrentIndex((prev) => prev - 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.backBtnPlaceholder} />
                )}

                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    { backgroundColor: colors.primary },
                    isLastSlide && { backgroundColor: '#10B981' },
                  ]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextBtnText}>
                    {isLastSlide ? strings.tour.finish : strings.tour.next}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </SafeAreaView>
        </View>
      </Modal>
      <FiscalSettingsSheet
        visible={fiscalSheetVisible}
        onClose={() => setFiscalSheetVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  safeArea: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    height: 520, // FIXED HEIGHT: guarantees no jumping between slides
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
  },
  stepIndicatorPill: {
    backgroundColor: '#6366F118',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipPlaceholder: {
    width: 60,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  spotlightContainer: {
    height: 180, // FIXED HEIGHT: Preview stays completely stable
    justifyContent: 'center',
    marginVertical: 4,
  },
  spotlightFeatureBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    padding: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  spotlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  spotlightPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  spotlightHeaderTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 0.8,
  },
  mockPlatformBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  mockPlatformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
  },
  mockPlatformChipActive: {
    borderColor: '#00A896',
    backgroundColor: '#00A89622',
  },
  mockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mockChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  mockChipTextActive: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A896',
  },
  mockBadgeActive: {
    backgroundColor: '#00A896',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mockBadgeTextActive: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  spotlightCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  spotlightCalloutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C7D2FE',
    flex: 1,
  },
  mockSplitCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  mockProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mockProfitLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  mockProfitAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  mockRoiBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockRoiText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mockSplitBarTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 4,
  },
  mockSplitSegment: {
    height: '100%',
  },
  mockSplitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mockLegendItem: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  mockInventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  mockItemThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockItemMeta: {
    flex: 1,
  },
  mockBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  mockItemStatusPill: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mockItemStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  mockQtyPill: {
    backgroundColor: '#6366F120',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mockQtyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6366F1',
  },
  mockItemTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  mockItemPlatformsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  mockPlatformTag: {
    fontSize: 8,
    fontWeight: '700',
    color: '#818CF8',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  mockDacCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  mockDacHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mockDacTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  mockDacSafePill: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockDacSafeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  mockDacDesc: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 6,
  },
  mockFiscalBarTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    overflow: 'hidden',
  },
  mockFiscalBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2.5,
  },
  mockPerksCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  mockPerkBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  mockXpBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  mockXpBonus: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F59E0B',
  },
  mockPerksMiniGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  mockMiniPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mockMiniPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textContentContainer: {
    height: 140, // FIXED HEIGHT: Text area never resizes
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  footerContainer: {
    height: 70, // FIXED HEIGHT: Bottom controls stay completely pinned
    justifyContent: 'flex-end',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  nextBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fiscalConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  fiscalConfigBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
