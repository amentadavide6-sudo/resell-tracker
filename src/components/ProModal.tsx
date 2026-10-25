import React from 'react';
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
import { setProUser } from '../services/proManager';
import { purchaseProProduct, restoreProPurchases } from '../services/purchaseService';
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
  const [loading, setLoading] = React.useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const success = await purchaseProProduct();
      if (success) {
        Alert.alert(
          '🎉 Benvenuto in ResellTracker Pro!',
          'Hai sbloccato con successo tutte le funzionalità avanzate senza limiti.',
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
        Alert.alert('Acquisto Ripristinato', 'Il tuo acquisto Pro è stato verificato e ripristinato con successo.');
        onProUnlocked();
        onClose();
      } else {
        Alert.alert('Nessun Acquisto Trovato', 'Non sono stati trovati acquisti precedenti associati a questo account Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.card }]}>
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
              <Ionicons name="sparkles" size={16} color="#F59E0B" />
              <Text style={styles.proBadgeText}>ACCESSO A VITA</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>ResellTracker Pro</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Porta il tuo business dell'usato a un livello professionale, senza canoni mensili.
            </Text>
          </View>

          {/* Pricing Card */}
          <View style={styles.priceCard}>
            <View style={styles.priceTagRow}>
              <Text style={styles.priceAmount}>3,49 €</Text>
              <View style={styles.oneTimeTag}>
                <Text style={styles.oneTimeTagText}>UNA TANTUM</Text>
              </View>
            </View>
            <Text style={styles.priceNote}>Paghi una sola volta, tuo per sempre. Nessun abbonamento ricorrente.</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                <Ionicons name="infinite" size={20} color="#6366F1" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Inventario Capi Illimitato</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  La versione Free è limitata a 15 capi contemporanei. Con Pro carichi tutti i capi che vuoi.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                <Ionicons name="document-text" size={20} color="#10B981" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Esportazione Fiscale Excel & CSV</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Scarica in qualsiasi momento il registro contabile completo delle tue vendite apribile su Excel.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Zero Pubblicità (Ad-Free)</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Rimozione istantanea e definitiva di qualsiasi banner o interruzione pubblicitaria.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>2x XP Booster & Livello Rapido ⚡</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Guadagni doppi punti XP per ogni vendita o articolo per scalare rapidamente fino al titolo di Top Seller!
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: isDark ? '#3B0764' : '#F3E8FF' }]}>
                <Ionicons name="flash" size={20} color="#A855F7" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Supporto Prioritario & Nuovi Mercatini</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Accesso prioritario per richiedere l'integrazione di nuove piattaforme e assistenza rapida.
                </Text>
              </View>
            </View>
          </View>

          {/* Action CTA */}
          <TouchableOpacity style={styles.buyBtn} onPress={handlePurchase} activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.buyBtnText}>Sblocca ResellTracker Pro a 3,49 €</Text>
          </TouchableOpacity>

          {/* Restore link */}
          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
            <Text style={styles.restoreBtnText}>Hai già acquistato Pro? Ripristina acquisto</Text>
          </TouchableOpacity>

          <Text style={styles.legalNotice}>
            Transazione protetta e gestita direttamente da Google Play Billing.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
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
    marginVertical: 12,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
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
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  priceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 14,
  },
  priceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  oneTimeTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  oneTimeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  featuresList: {
    gap: 14,
    marginVertical: 10,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  buyBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
    marginTop: 6,
  },
});
