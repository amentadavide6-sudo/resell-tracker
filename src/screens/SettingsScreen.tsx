import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { exportBackup, importBackup } from '../services/backup';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Come calcola le commissioni Vinted?',
    answer:
      'Su Vinted la vendita per il venditore è completamente gratuita (0% di commissioni trattenute). La protezione acquisti (0,70 € fissi + 5% del valore) viene pagata interamente dal compratore al momento del pagamento. Tu incassi il 100% del prezzo fissato.',
  },
  {
    question: 'Quali commissioni trattiene eBay?',
    answer:
      'Per i venditori privati in Italia, eBay applica solitamente una commissione sul valore finale dell\'11,5% più 0,35 € fissi per ordine. L\'app calcola ed evidenzia in rosso queste trattenute mostrandoti il vero guadagno che ti arriverà sul conto.',
  },
  {
    question: 'Chi paga le spese di spedizione?',
    answer:
      'Sulle piattaforme di compravendita come Vinted, Wallapop e Subito (TuttoSubito), le etichette di spedizione sono generate e pagate dal compratore. Se invece offri la spedizione gratuita o vendi con corriere privato, inserisci la spesa nel campo "Spedizione tua" per sottrarla dal profitto.',
  },
  {
    question: 'Dove vengono salvati i miei dati e le foto dei capi?',
    answer:
      'ResellTracker opera con architettura Local-First: tutti i tuoi capi, i prezzi, le foto e lo storico vendite risiedono esclusivamente all\'interno della memoria sicura del tuo smartphone (database SQLite). Nessun dato viene caricato su server esterni o venduto a terzi.',
  },
  {
    question: 'Come posso trasferire i miei dati su un nuovo telefono?',
    answer:
      'Prima di cambiare telefono o disinstallare l\'app, tocca il pulsante "Esporta Backup" qui sotto e salva il file sul tuo Google Drive personale o inviatelo per email. Sul nuovo telefono basterà premere "Ripristina da Backup" per ritrovare tutto in 2 secondi.',
  },
];

export const SettingsScreen: React.FC<{
  onDataRestored?: () => void;
  onOpenProModal?: () => void;
}> = ({ onDataRestored, onOpenProModal }) => {
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const handleContactSupport = async () => {
    const supportEmail = 'reselltrackersupport@gmail.com';
    const subject = encodeURIComponent('Supporto ResellTracker v1.0');
    const body = encodeURIComponent(
      'Ciao Team di Assistenza,\n\nTi contatto in merito all\'app ResellTracker per richiedere:\n\n'
    );
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Email di Supporto',
          `Puoi scriverci direttamente a:\n\n${supportEmail}`,
          [{ text: 'Copia Email' }]
        );
      }
    } catch {
      Alert.alert('Email di Supporto', `Puoi scriverci a:\n\n${supportEmail}`);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const res = await exportBackup();
    setIsExporting(false);
    if (!res.success && res.message !== 'Nessun file selezionato.') {
      Alert.alert('Backup', res.message);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Ripristina Archivio',
      'Vuoi selezionare un file di backup (.json) per ripristinare i tuoi articoli nell\'inventario?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Seleziona File',
          onPress: async () => {
            setIsImporting(true);
            const res = await importBackup();
            setIsImporting(false);
            Alert.alert('Ripristino', res.message);
            if (res.success && onDataRestored) {
              onDataRestored();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>IMPOSTAZIONI & ASSISTENZA</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Centro Aiuto</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro Card */}
        {onOpenProModal && (
          <TouchableOpacity
            style={styles.proUpgradeCard}
            onPress={onOpenProModal}
            activeOpacity={0.85}
          >
            <View style={styles.proHeaderRow}>
              <View style={styles.proTitleGroup}>
                <Ionicons name="sparkles" size={18} color="#F59E0B" />
                <Text style={styles.proTitle}>Passa a ResellTracker Pro</Text>
              </View>
              <View style={styles.proPriceTag}>
                <Text style={styles.proPriceText}>3,49 €</Text>
              </View>
            </View>
            <Text style={styles.proDesc}>
              Sblocca inventario illimitato, rimuovi la pubblicità e accedi al supporto prioritario con un unico acquisto a vita.
            </Text>
          </TouchableOpacity>
        )}

        {/* Theme Selector Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Tema & Aspetto</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Scegli il tema dell'interfaccia o sincronizzalo con le impostazioni del tuo telefono.
          </Text>

          <View style={[styles.themePillsRow, { backgroundColor: isDark ? '#111827' : '#F1F5F9' }]}>
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const isSelected = themeMode === mode;
              const label = mode === 'light' ? 'Chiaro' : mode === 'dark' ? 'Scuro' : 'Sistema';
              const iconName = mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'phone-portrait';
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themePill,
                    isSelected && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={iconName}
                    size={15}
                    color={isSelected ? colors.primary : colors.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: isSelected ? colors.textPrimary : colors.textMuted },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Support Card */}
        <View style={[styles.supportCard, isDark && { backgroundColor: '#1E1B4B', borderColor: '#312E81' }]}>
          <View style={styles.supportHeader}>
            <View style={[styles.supportIconWrap, isDark && { backgroundColor: '#312E81' }]}>
              <Ionicons name="chatbubbles" size={24} color={isDark ? '#A5B4FC' : '#6366F1'} />
            </View>
            <View style={styles.supportTitleWrap}>
              <Text style={[styles.supportTitle, isDark && { color: '#E0E7FF' }]}>Hai bisogno di aiuto?</Text>
              <Text style={[styles.supportSubtitle, isDark && { color: '#C7D2FE' }]}>
                Hai dubbi sui calcoli o suggerimenti su nuove funzioni?
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.supportBtn, isDark && { backgroundColor: '#6366F1' }]}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            <Text style={styles.supportBtnText}>Scrivi all'Assistenza</Text>
          </TouchableOpacity>

          <Text style={[styles.supportEmailText, isDark && { color: '#A5B4FC' }]}>
            Email: <Text style={styles.supportEmailBold}>reselltrackersupport@gmail.com</Text>
          </Text>
        </View>

        {/* Backup & Restore Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="cloud-done-outline" size={22} color="#059669" />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Salvataggio & Backup Dati</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            I tuoi dati sono conservati sul telefono. Esporta regolarmente una copia di sicurezza per salvarla su Google Drive, WhatsApp o inviartela via email.
          </Text>

          <View style={styles.backupButtonsRow}>
            <TouchableOpacity
              style={[styles.exportBtn, isDark && { backgroundColor: '#064E3B', borderColor: '#059669' }]}
              onPress={handleExport}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={isDark ? '#34D399' : '#059669'} />
              <Text style={[styles.exportBtnText, isDark && { color: '#34D399' }]}>
                {isExporting ? 'Esportazione...' : 'Esporta Backup'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.importBtn, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
              onPress={handleImport}
              disabled={isImporting}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color={isDark ? '#9CA3AF' : '#475569'} />
              <Text style={[styles.importBtnText, isDark && { color: '#E5E7EB' }]}>
                {isImporting ? 'Ripristino...' : 'Ripristina'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs Accordion */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>DOMANDE FREQUENTI (FAQ)</Text>
        </View>

        <View style={styles.faqsContainer}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedFaqIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.faqCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestionText, { color: colors.textPrimary }]}>
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.faqAnswerContainer, { borderTopColor: colors.cardBorder }]}>
                    <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* App Info & Privacy */}
        <View style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>ResellTracker v1.0.0</Text>
          <Text style={[styles.infoSub, { color: colors.textMuted }]}>
            Progettata per venditori indipendenti su Vinted, eBay, Wallapop e Subito.
          </Text>
          <View style={[styles.privacyBadge, isDark && { backgroundColor: '#064E3B', borderColor: '#047857' }]}>
            <Ionicons name="shield-checkmark" size={16} color={isDark ? '#34D399' : '#059669'} />
            <Text style={[styles.privacyBadgeText, isDark && { color: '#D1FAE5' }]}>
              100% Riservata • Zero Server • Offline First
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 14,
  },
  proUpgradeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  proHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  proTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proPriceTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proPriceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  themePillsRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  supportCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  supportHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  supportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitleWrap: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#312E81',
  },
  supportSubtitle: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 2,
    lineHeight: 16,
  },
  supportBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  supportEmailText: {
    fontSize: 11,
    color: '#6366F1',
    textAlign: 'center',
    marginTop: 8,
  },
  supportEmailBold: {
    fontWeight: '700',
  },
  backupButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  importBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 10,
  },
  importBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  faqsContainer: {
    gap: 8,
  },
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  faqAnswerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  faqAnswerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoSub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
});
