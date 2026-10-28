import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  purchaseProProduct,
  restoreProPurchases,
  PurchasePlanId,
  PLAN_CONFIGS,
} from '../services/purchaseService';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useTranslation } from '../i18n';

interface ProModalProps {
  visible: boolean;
  onClose: () => void;
  onProUnlocked: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({
  visible,
  onClose,
  onProUnlocked,
}) => {
  const { colors, isDark } = useTheme();
  const { strings, t } = useTranslation();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PurchasePlanId>('lifetime');

  const lifetimeConfig = PLAN_CONFIGS.lifetime;
  const monthlyConfig = PLAN_CONFIGS.monthly;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const success = await purchaseProProduct(selectedPlan);
      if (success) {
        showAlert({
          title: strings.proModal.welcomeTitle,
          message:
            selectedPlan === 'lifetime'
              ? strings.proModal.welcomeLifetimeMsg
              : strings.proModal.welcomeMonthlyMsg,
          type: 'success',
          buttons: [
            {
              text: strings.proModal.welcomeAction,
              onPress: () => {
                onProUnlocked();
                onClose();
              },
            },
          ],
        });
      }
    } catch (err: any) {
      showAlert({
        title: strings.common.error,
        message: err?.message || 'Si è verificato un errore durante la transazione con Google Play.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const restored = await restoreProPurchases();
      if (restored) {
        showAlert({
          title: strings.proModal.restoreSuccessTitle,
          message: strings.proModal.restoreSuccessMsg,
          type: 'success',
          buttons: [
            {
              text: 'OK',
              onPress: () => {
                onProUnlocked();
                onClose();
              },
            },
          ],
        });
      } else {
        showAlert({
          title: strings.proModal.restoreNotFoundTitle,
          message: strings.proModal.restoreNotFoundMsg,
          type: 'info',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Top Close button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Hero */}
          <View style={styles.heroSection}>
            <View style={styles.proBadge}>
              <Ionicons name="sparkles" size={15} color="#D97706" />
              <Text style={styles.proBadgeText}>{strings.proModal.badgeOffer}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              {strings.proModal.heroTitle}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              {strings.proModal.heroSubtitle}
            </Text>
          </View>

          {/* Plan Selection Cards */}
          <View style={styles.plansContainer}>
            {/* 1. Lifetime Card (Recommended) */}
            <TouchableOpacity
              style={[
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                selectedPlan === 'lifetime' && styles.planCardSelected,
                selectedPlan === 'lifetime' && (isDark ? { backgroundColor: '#1E1B4B' } : { backgroundColor: '#EEF2FF' }),
              ]}
              onPress={() => setSelectedPlan('lifetime')}
              activeOpacity={0.85}
            >
              <View style={styles.planBadgeRow}>
                <View style={styles.highlightBadge}>
                  <Text style={styles.highlightBadgeText}>{strings.proModal.lifetimeBadge}</Text>
                </View>
                <Ionicons
                  name={selectedPlan === 'lifetime' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedPlan === 'lifetime' ? '#6366F1' : colors.textMuted}
                />
              </View>

              <View style={styles.planMainRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                    {strings.proModal.lifetimeTitle}
                  </Text>
                  <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
                    {strings.proModal.lifetimeDesc}
                  </Text>
                </View>

                <View style={styles.planPriceCol}>
                  <View style={styles.strikethroughRow}>
                    <Text style={styles.strikethroughPrice}>{lifetimeConfig.originalPrice}</Text>
                    <View style={styles.discountTag}>
                      <Text style={styles.discountTagText}>{lifetimeConfig.savingsPercent}</Text>
                    </View>
                  </View>
                  <Text style={[styles.planPriceAmount, { color: colors.textPrimary }]}>
                    {lifetimeConfig.price}
                  </Text>
                  <Text style={styles.planPeriodText}>{strings.proModal.lifetimePeriod}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* 2. Monthly Card */}
            <TouchableOpacity
              style={[
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                selectedPlan === 'monthly' && styles.planCardSelected,
                selectedPlan === 'monthly' && (isDark ? { backgroundColor: '#1E1B4B' } : { backgroundColor: '#EEF2FF' }),
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.85}
            >
              <View style={styles.planBadgeRow}>
                <View style={[styles.highlightBadge, { backgroundColor: isDark ? '#374151' : '#F1F5F9' }]}>
                  <Text style={[styles.highlightBadgeText, { color: colors.textSecondary }]}>
                    {strings.proModal.monthlyBadge}
                  </Text>
                </View>
                <Ionicons
                  name={selectedPlan === 'monthly' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedPlan === 'monthly' ? '#6366F1' : colors.textMuted}
                />
              </View>

              <View style={styles.planMainRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                    {strings.proModal.monthlyTitle}
                  </Text>
                  <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
                    {strings.proModal.monthlyDesc}
                  </Text>
                </View>

                <View style={styles.planPriceCol}>
                  <Text style={[styles.planPriceAmount, { color: colors.textPrimary }]}>
                    {monthlyConfig.price}
                  </Text>
                  <Text style={styles.planPeriodText}>{strings.proModal.monthlyPeriod}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Features Comparison Checklist */}
          <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.featuresHeader, { color: colors.textPrimary }]}>
              {strings.proModal.featuresHeader}
            </Text>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                <Ionicons name="infinite" size={18} color="#6366F1" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  {strings.proModal.feature1Title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {strings.proModal.feature1Desc}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                <Ionicons name="document-text" size={18} color="#10B981" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  {strings.proModal.feature2Title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {strings.proModal.feature2Desc}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#F59E0B" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  {strings.proModal.feature3Title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {strings.proModal.feature3Desc}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
                <Ionicons name="trophy" size={18} color="#F59E0B" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  {strings.proModal.feature4Title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {strings.proModal.feature4Desc}
                </Text>
              </View>
            </View>
          </View>

          {/* Action CTA */}
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.buyBtnText}>
                  {selectedPlan === 'lifetime'
                    ? t('proModal.buyLifetimeBtn', { price: lifetimeConfig.price })
                    : t('proModal.buyMonthlyBtn', { price: monthlyConfig.price })}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Restore link */}
          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={loading} activeOpacity={0.7}>
            <Text style={styles.restoreBtnText}>{strings.proModal.restoreBtn}</Text>
          </TouchableOpacity>

          <Text style={styles.legalNotice}>
            {strings.proModal.legalNotice}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  closeBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 290,
  },
  plansContainer: {
    gap: 12,
    marginVertical: 16,
  },
  planCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  planCardSelected: {
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  planBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  highlightBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.6,
  },
  planMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  planSubtitle: {
    fontSize: 12,
    maxWidth: 180,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  strikethroughRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  strikethroughPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountTag: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  discountTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planPriceAmount: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  planPeriodText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  featuresCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  featuresHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  buyBtn: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#6366F1',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  restoreBtnText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  legalNotice: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
