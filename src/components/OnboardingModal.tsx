import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { setSeenOnboarding } from '../services/onboarding';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    icon: 'calculator-outline',
    badge: 'CALCOLATORE ACCURATO',
    badgeColor: '#10B981',
    title: 'Commissioni al Centesimo',
    description:
      'Seleziona il mercatino (Vinted, eBay, Wallapop, Subito, Depop) e scorpora all\'istante percentuali, costi fissi e protezione acquirente per conoscere il tuo vero Guadagno Netto.',
  },
  {
    icon: 'shirt-outline',
    badge: 'GESTIONE INVENTARIO',
    badgeColor: '#6366F1',
    title: 'Catalogo Capi con Foto',
    description:
      'Scatta una foto al capo direttamente in app o selezionala dalla galleria. Monitora lo stato delle tue inserzioni (Bozza, In Vendita, Venduto) e il capitale fermo in merce.',
  },
  {
    icon: 'bar-chart-outline',
    badge: 'ANALYTICS & REPORT EXCEL',
    badgeColor: '#F59E0B',
    title: 'Statistiche & Export Fiscale',
    description:
      'Tieni traccia delle tue entrate mese per mese. Genera ed esporta in un tap il foglio di calcolo Excel/CSV completo per la tua contabilità personale o su Google Fogli.',
  },
  {
    icon: 'trophy-outline',
    badge: 'RESELLER CLUB & PRIVACY',
    badgeColor: '#8B5CF6',
    title: 'Punti XP e 100% Privacy',
    description:
      'Guadagna punti esperienza (XP) per ogni capo aggiunto e vendita registrata per scalare i livelli da Principiante a Top Seller. Zero server, 100% dei dati protetti sul tuo telefono!',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

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

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* Top Bar with Skip */}
            <View style={styles.topBar}>
              <View style={styles.dotsRow}>
                {SLIDES.map((_, idx) => (
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
                            : '#CBD5E1',
                        width: idx === currentIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>

              {!isLastSlide && (
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                  <Text style={[styles.skipText, { color: colors.textMuted }]}>Salta</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Slide Body */}
            <View style={styles.slideBody}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: currentSlide.badgeColor + '20', borderColor: currentSlide.badgeColor + '40' },
                ]}
              >
                <Ionicons
                  name={currentSlide.icon as any}
                  size={46}
                  color={currentSlide.badgeColor}
                />
              </View>

              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: currentSlide.badgeColor + '18', borderColor: currentSlide.badgeColor },
                ]}
              >
                <Text style={[styles.badgeText, { color: currentSlide.badgeColor }]}>
                  {currentSlide.badge}
                </Text>
              </View>

              <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>
                {currentSlide.title}
              </Text>

              <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>
                {currentSlide.description}
              </Text>
            </View>

            {/* Footer Buttons */}
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
                  {isLastSlide ? 'Inizia a Vendere 🚀' : 'Continua'}
                </Text>
                {!isLastSlide && (
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  safeArea: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  slideBody: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  slideDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
