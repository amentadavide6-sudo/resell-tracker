import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { setSeenOnboarding } from '../services/onboarding';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalSteps = 4;
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
              <Text style={styles.spotlightHeaderTag}>SELETTORE PIATTAFORME ATTIVO</Text>
            </View>
            {/* Mock Platform Selector */}
            <View style={styles.mockPlatformBar}>
              <View style={[styles.mockPlatformChip, styles.mockPlatformChipActive]}>
                <View style={[styles.mockDot, { backgroundColor: '#00A896' }]} />
                <Text style={styles.mockChipTextActive}>Vinted</Text>
                <View style={styles.mockBadgeActive}>
                  <Text style={styles.mockBadgeTextActive}>0% fee</Text>
                </View>
              </View>
              <View style={styles.mockPlatformChip}>
                <View style={[styles.mockDot, { backgroundColor: '#E53238' }]} />
                <Text style={[styles.mockChipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>eBay</Text>
              </View>
              <View style={styles.mockPlatformChip}>
                <View style={[styles.mockDot, { backgroundColor: '#13C1AC' }]} />
                <Text style={[styles.mockChipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Wallapop</Text>
              </View>
              <View style={[styles.mockPlatformChip, { borderColor: '#818CF8' }]}>
                <Ionicons name="add" size={14} color="#6366F1" />
                <Text style={[styles.mockChipText, { color: '#6366F1', fontWeight: '700' }]}>+ Nuova</Text>
              </View>
            </View>
            <View style={styles.spotlightCalloutBox}>
              <Ionicons name="flash" size={14} color="#F59E0B" />
              <Text style={styles.spotlightCalloutText}>
                Supporta anche canali personalizzati illimitati!
              </Text>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>PROFITTO NETTO & SPLIT DEI COSTI</Text>
            </View>
            {/* Mock Split Card */}
            <View style={[styles.mockSplitCard, { backgroundColor: isDark ? '#064E3B22' : '#ECFDF5', borderColor: '#10B981' }]}>
              <View style={styles.mockProfitRow}>
                <View>
                  <Text style={[styles.mockProfitLabel, { color: isDark ? '#A7F3D0' : '#047857' }]}>GUADAGNO NETTO</Text>
                  <Text style={[styles.mockProfitAmount, { color: isDark ? '#34D399' : '#059669' }]}>+19,50 €</Text>
                </View>
                <View style={styles.mockRoiBadge}>
                  <Text style={styles.mockRoiText}>ROI +390%</Text>
                </View>
              </View>
              {/* Split Bar */}
              <View style={styles.mockSplitBarTrack}>
                <View style={[styles.mockSplitSegment, { flex: 78, backgroundColor: '#10B981' }]} />
                <View style={[styles.mockSplitSegment, { flex: 16, backgroundColor: '#3B82F6' }]} />
                <View style={[styles.mockSplitSegment, { flex: 6, backgroundColor: '#F59E0B' }]} />
              </View>
              <View style={styles.mockSplitLegendRow}>
                <Text style={styles.mockLegendItem}>🟢 Guadagno (78%)</Text>
                <Text style={styles.mockLegendItem}>🔵 Acquisto (16%)</Text>
                <Text style={styles.mockLegendItem}>🟡 Fee (6%)</Text>
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>INVENTARIO & MULTI-PIATTAFORMA</Text>
            </View>
            {/* Mock Item Card */}
            <View style={[styles.mockInventoryCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View style={styles.mockItemThumb}>
                <Ionicons name="shirt" size={24} color="#6366F1" />
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
                <Text style={[styles.mockItemTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
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
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.spotlightCalloutText}>
                Delist Assistant integrato per evitare vendite duplicate!
              </Text>
            </View>
          </View>
        );

      case 3:
      default:
        return (
          <View style={styles.spotlightFeatureBox}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightPulseDot} />
              <Text style={styles.spotlightHeaderTag}>FISCO EUROPEO DAC7 & RESELLER CLUB</Text>
            </View>
            {/* Mock DAC7 & Gamification Card */}
            <View style={[styles.mockDacCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View style={styles.mockDacHeaderRow}>
                <Text style={[styles.mockDacTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Monitoraggio DAC7 (2026)
                </Text>
                <View style={styles.mockDacSafePill}>
                  <Text style={styles.mockDacSafeText}>🟢 Conforme</Text>
                </View>
              </View>
              <Text style={[styles.mockDacDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                12 / 30 vendite • 480 € / 2.000 € (Nessuna segnalazione al Fisco)
              </Text>
              <View style={styles.mockXpRow}>
                <Text style={styles.mockXpBadge}>⭐ Livello 3: Reseller Confermato</Text>
                <Text style={styles.mockXpBonus}>+200 XP a vendita ⚡</Text>
              </View>
            </View>
            <View style={styles.spotlightCalloutBox}>
              <Ionicons name="lock-closed" size={14} color="#6366F1" />
              <Text style={styles.spotlightCalloutText}>
                100% Offline e Privato. I tuoi dati fiscali non lasciano mai il telefono!
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
      default:
        return strings.tour.step4Title;
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
      default:
        return strings.tour.step4Desc;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Dimmed Background Spotlight Focus Area */}
            <View style={styles.spotlightWrapper}>
              {renderSpotlightContent()}
            </View>

            {/* Interactive Explanatory Bottom Card */}
            <View style={[styles.interactiveCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {/* Header with Step Counter and Skip */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.stepIndicatorPill}>
                  <Text style={styles.stepIndicatorText}>
                    {strings.tour.stepIndicator
                      .replace('{current}', (currentIndex + 1).toString())
                      .replace('{total}', totalSteps.toString())}
                  </Text>
                </View>

                {!isLastSlide && (
                  <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
                    <Text style={[styles.skipText, { color: colors.textMuted }]}>{strings.tour.skip}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Step Title & Description */}
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{getStepTitle()}</Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{getStepDesc()}</Text>

              {/* Dots Progress */}
              <View style={styles.dotsRow}>
                {[0, 1, 2, 3].map((idx) => (
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
                        width: idx === currentIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.footerRow}>
                {currentIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.backBtn, { borderColor: colors.cardBorder }]}
                    onPress={() => setCurrentIndex((prev) => prev - 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
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
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
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
    maxWidth: 440,
  },
  scrollContent: {
    paddingVertical: 20,
    justifyContent: 'center',
  },
  spotlightWrapper: {
    marginBottom: 16,
  },
  spotlightFeatureBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#6366F1',
    padding: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  spotlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
    letterSpacing: 1.1,
  },
  mockPlatformBar: {
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
  },
  mockPlatformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mockPlatformChipActive: {
    borderColor: '#00A896',
    backgroundColor: '#0F172A',
  },
  mockDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  mockChipTextActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00A896',
  },
  mockChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mockBadgeActive: {
    backgroundColor: '#00A89625',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mockBadgeTextActive: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00A896',
  },
  spotlightCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  spotlightCalloutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
    flex: 1,
  },
  mockSplitCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  mockProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mockProfitLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mockProfitAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  mockRoiBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mockRoiText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mockSplitBarTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 6,
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
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    alignItems: 'center',
  },
  mockItemThumb: {
    width: 44,
    height: 44,
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
    marginBottom: 3,
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
    fontSize: 13,
    fontWeight: '800',
  },
  mockItemPlatformsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  mockPlatformTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#818CF8',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  mockDacCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  mockDacHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mockDacTitle: {
    fontSize: 13,
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
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  mockXpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  interactiveCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  skipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 18,
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
  nextBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
