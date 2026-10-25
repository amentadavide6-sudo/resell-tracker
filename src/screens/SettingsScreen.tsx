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
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const handleContactSupport = async () => {
    const supportEmail = 'assistenza.reselltracker@gmail.com';
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
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>IMPOSTAZIONI & ASSISTENZA</Text>
          <Text style={styles.headerTitle}>Centro Aiuto</Text>
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

        {/* Support Card */}
        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <View style={styles.supportIconWrap}>
              <Ionicons name="chatbubbles" size={24} color="#6366F1" />
            </View>
            <View style={styles.supportTitleWrap}>
              <Text style={styles.supportTitle}>Hai bisogno di aiuto?</Text>
              <Text style={styles.supportSubtitle}>
                Hai dubbi sui calcoli o suggerimenti su nuove funzioni?
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.supportBtn}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            <Text style={styles.supportBtnText}>Scrivi all'Assistenza</Text>
          </TouchableOpacity>

          <Text style={styles.supportEmailText}>
            Email: <Text style={styles.supportEmailBold}>assistenza.reselltracker@gmail.com</Text>
          </Text>
        </View>

        {/* Backup & Restore Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="cloud-done-outline" size={22} color="#059669" />
            <Text style={styles.cardTitle}>Salvataggio & Backup Dati</Text>
          </View>
          <Text style={styles.cardDescription}>
            I tuoi dati sono conservati sul telefono. Esporta regolarmente una copia di sicurezza per salvarla su Google Drive, WhatsApp o inviartela via email.
          </Text>

          <View style={styles.backupButtonsRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExport}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color="#059669" />
              <Text style={styles.exportBtnText}>
                {isExporting ? 'Esportazione...' : 'Esporta Backup'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.importBtn}
              onPress={handleImport}
              disabled={isImporting}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color="#475569" />
              <Text style={styles.importBtnText}>
                {isImporting ? 'Ripristino...' : 'Ripristina'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs Accordion */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>DOMANDE FREQUENTI (FAQ)</Text>
        </View>

        <View style={styles.faqsContainer}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedFaqIndex === index;
            return (
              <View key={index} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* App Info & Privacy */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ResellTracker v1.0.0</Text>
          <Text style={styles.infoSub}>
            Progettata per venditori indipendenti su Vinted, eBay, Wallapop e Subito.
          </Text>
          <View style={styles.privacyBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#059669" />
            <Text style={styles.privacyBadgeText}>100% Riservata • Zero Server • Offline First</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
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
    color: '#64748B',
    letterSpacing: 0.8,
  },
  faqsContainer: {
    gap: 8,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  faqAnswerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  faqAnswerText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  infoSub: {
    fontSize: 11,
    color: '#94A3B8',
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
