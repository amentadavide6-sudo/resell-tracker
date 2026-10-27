import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  purchaseProProduct,
  restoreProPurchases,
  PurchasePlanId,
  PLAN_CONFIGS,
} from '../services/purchaseService';
import { useTheme } from '../context/ThemeContext';

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
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PurchasePlanId>('lifetime');

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const success = await purchaseProProduct(selectedPlan);
      if (success) {
        Alert.alert(
          '🎉 Benvenuto in ResellTracker Pro!',
          selectedPlan === 'lifetime'
            ? 'Hai sbloccato con successo l\'accesso Pro a vita senza limiti né canoni!'
            : 'Il tuo abbonamento mensile Pro è ora attivo.',
          [
            {
              text: 'Inizia subito',
              onPress: () => {
                onProUnlocked();
                onClose();
              },
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const restored = await restoreProPurchases();
      if (restored) {
        Alert.alert(
          'Acquisto Ripristinato',
          'Il tuo acquisto Pro è stato verificato e ripristinato con successo.'
        );
        onProUnlocked();
        onClose();
      } else {
        Alert.alert(
          'Nessun Acquisto Trovato',
          'Non sono stati trovati acquisti precedenti associati a questo account Google.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const lifetimeConfig = PLAN_CONFIGS.lifetime;
  const monthlyConfig = PLAN_CONFIGS.monthly;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Top Close button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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
              <Text style={styles.proBadgeText}>OFFERTA LANCIO FONDATORI</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>ResellTracker Pro</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Il toolkit completo per vendere con profitto su Vinted, eBay, Wallapop e Subito.
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
                  <Text style={styles.highlightBadgeText}>{lifetimeConfig.badge}</Text>
                </View>
                <Ionicons
                  name={selectedPlan === 'lifetime' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedPlan === 'lifetime' ? '#6366F1' : colors.textMuted}
                />
              </View>

              <View style={styles.planMainRow}>
                <View>
                  <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                    {lifetimeConfig.title}
                  </Text>
                  <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
                    {lifetimeConfig.description}
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
                  <Text style={styles.planPeriodText}>{lifetimeConfig.billingPeriod}</Text>
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
                    {monthlyConfig.badge}
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
                    {monthlyConfig.title}
                  </Text>
                  <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
                    {monthlyConfig.description}
                  </Text>
                </View>

                <View style={styles.planPriceCol}>
                  <Text style={[styles.planPriceAmount, { color: colors.textPrimary }]}>
                    {monthlyConfig.price}
                  </Text>
                  <Text style={styles.planPeriodText}>{monthlyConfig.billingPeriod}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Features Comparison Checklist */}
          <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.featuresHeader, { color: colors.textPrimary }]}>
              Cosa include ResellTracker Pro:
            </Text>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                <Ionicons name="infinite" size={18} color="#6366F1" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  Inventario Capi Illimitato
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Sblocca gli slot infiniti. La versione Free è limitata a 15 capi massimi salvati.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                <Ionicons name="document-text" size={18} color="#10B981" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  Esportazione Registro Excel & CSV Illimitata
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Genera con 1 tap il foglio di calcolo completo con tutti i profitti, tasse e margini per Excel e Fogli Google.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#F59E0B" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  Zero Pubblicità (100% Ad-Free)
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Rimozione immediata di qualsiasi banner promozionale e interfaccia ultra rapida.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
                <Ionicons name="trophy" size={18} color="#F59E0B" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  2x XP Booster Permanente ⚡
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Punti doppi per ogni articolo registrato o venduto, per raggiungere il badge Top Seller in metà tempo!
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
            <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.buyBtnText}>
              {selectedPlan === 'lifetime'
                ? `Sblocca Accesso a Vita a ${lifetimeConfig.price}`
                : `Attiva Abbonamento a ${monthlyConfig.price} / mese`}
            </Text>
          </TouchableOpacity>

          {/* Restore link */}
          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={loading}>
            <Text style={styles.restoreBtnText}>Hai già acquistato Pro? Ripristina acquisti</Text>
          </TouchableOpacity>

          <Text style={styles.legalNotice}>
            Transazione protetta e gestita direttamente da Google Play.
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
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  plansContainer: {
    gap: 12,
    marginVertical: 14,
  },
  planCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  planCardSelected: {
    borderColor: '#6366F1',
    borderWidth: 2,
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  planBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  highlightBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highlightBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  planMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  planSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    maxWidth: 200,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  strikethroughRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  strikethroughPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discountTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  discountTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  planPriceAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  planPeriodText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  featuresCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    marginVertical: 10,
  },
  featuresHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  buyBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  restoreBtnText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  legalNotice: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
