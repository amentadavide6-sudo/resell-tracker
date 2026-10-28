import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useTranslation, LanguageMode } from '../i18n';
import { useAlert } from '../context/AlertContext';
import { exportBackup, importBackup } from '../services/backup';
import { addXP, XP_REWARDS } from '../services/gamification';
import {
  areNotificationsEnabled,
  setNotificationsEnabled,
  scheduleSmartNotifications,
  sendTestNotification,
} from '../services/notifications';

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
  onOpenTutorial?: () => void;
}> = ({ onDataRestored, onOpenProModal, onOpenTutorial }) => {
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { strings, languageMode, setLanguageMode } = useTranslation();
  const { showAlert } = useAlert();
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState<boolean>(() => areNotificationsEnabled());

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsActive(val);
    setNotificationsEnabled(val);
    await scheduleSmartNotifications();
  };

  const handleSendTestNotification = async () => {
    const sent = await sendTestNotification();
    if (sent) {
      showAlert({
        title: 'Notifica Inviata! 🔔',
        message: 'Controlla la tendina delle notifiche del telefono tra 2 secondi.',
        type: 'success',
      });
    } else {
      showAlert({
        title: 'Permesso Notifiche',
        message: 'Abilita i permessi di notifica nelle impostazioni di Android per ricevere avvisi strategici.',
        type: 'warning',
      });
    }
  };

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
        showAlert({
          title: 'Email di Supporto',
          message: `Puoi scriverci direttamente a:\n\n${supportEmail}`,
          type: 'info',
        });
      }
    } catch {
      showAlert({
        title: 'Email di Supporto',
        message: `Puoi scriverci a:\n\n${supportEmail}`,
        type: 'info',
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const res = await exportBackup();
    setIsExporting(false);
    if (res.success) {
      addXP(XP_REWARDS.BACKUP_SAVED, 'Backup archivio');
      showAlert({
        title: 'Backup Salvato! 💾',
        message: res.message,
        type: 'success',
      });
    } else if (res.message !== 'Nessun file selezionato.') {
      showAlert({
        title: 'Backup',
        message: res.message,
        type: 'warning',
      });
    }
  };

  const handleImport = async () => {
    showAlert({
      title: 'Ripristina Archivio',
      message: 'Vuoi selezionare un file di backup (.json) per ripristinare i tuoi articoli nell\'inventario?',
      type: 'info',
      buttons: [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Seleziona File',
          onPress: async () => {
            setIsImporting(true);
            const res = await importBackup();
            setIsImporting(false);
            showAlert({
              title: 'Ripristino',
              message: res.message,
              type: res.success ? 'success' : 'error',
            });
            if (res.success && onDataRestored) {
              onDataRestored();
            }
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{strings.settings.headerSubtitle}</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{strings.settings.headerTitle}</Text>
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
                <Text style={styles.proTitle}>{strings.settings.proCardTitle}</Text>
              </View>
              <View style={styles.proPriceTag}>
                <Text style={styles.proPriceText}>3,49 €</Text>
              </View>
            </View>
            <Text style={styles.proDesc}>
              {strings.settings.proCardDesc}
            </Text>
          </TouchableOpacity>
        )}

        {/* Language Selector Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{strings.settings.languageTitle}</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            {strings.settings.languageDesc}
          </Text>

          <View style={styles.langGrid}>
            {[
              { id: 'system', label: strings.settings.langSystem, flag: '🌐' },
              { id: 'it', label: strings.settings.langIt, flag: '🇮🇹' },
              { id: 'en', label: strings.settings.langEn, flag: '🇬🇧' },
              { id: 'fr', label: strings.settings.langFr, flag: '🇫🇷' },
              { id: 'es', label: strings.settings.langEs, flag: '🇪🇸' },
              { id: 'de', label: strings.settings.langDe, flag: '🇩🇪' },
            ].map((item) => {
              const isSelected = languageMode === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: isDark ? '#111827' : '#F1F5F9',
                      borderColor: isSelected ? colors.primary : (isDark ? '#1F2937' : '#E2E8F0'),
                    },
                    isSelected && {
                      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setLanguageMode(item.id as LanguageMode)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.langText,
                      { color: isSelected ? colors.primary : colors.textPrimary },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Theme Selector Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{strings.settings.themeTitle}</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            {strings.settings.themeDesc}
          </Text>

          <View style={[styles.themePillsRow, { backgroundColor: isDark ? '#111827' : '#F1F5F9' }]}>
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const isSelected = themeMode === mode;
              const label = mode === 'light' ? strings.settings.themeLight : mode === 'dark' ? strings.settings.themeDark : strings.settings.themeSystem;
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

        {/* Smart Notifications Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Ionicons name="notifications-outline" size={20} color="#6366F1" />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{strings.settings.notificationsTitle}</Text>
            </View>
            <Switch
              value={notificationsActive}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#94A3B8', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            {strings.settings.notificationsDesc}
          </Text>

          {notificationsActive && (
            <TouchableOpacity
              style={[styles.testNotificationBtn, { borderColor: isDark ? '#312E81' : '#EEF2FF', backgroundColor: isDark ? '#1E1B4B' : '#F8FAFC' }]}
              onPress={handleSendTestNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane-outline" size={15} color="#6366F1" />
              <Text style={styles.testNotificationBtnText}>{strings.settings.sendTestNotif}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Support Card */}
        <View style={[styles.supportCard, isDark && { backgroundColor: '#1E1B4B', borderColor: '#312E81' }]}>
          <View style={styles.supportHeader}>
            <View style={[styles.supportIconWrap, isDark && { backgroundColor: '#312E81' }]}>
              <Ionicons name="chatbubbles" size={24} color={isDark ? '#A5B4FC' : '#6366F1'} />
            </View>
            <View style={styles.supportTitleWrap}>
              <Text style={[styles.supportTitle, isDark && { color: '#E0E7FF' }]}>{strings.settings.needHelpTitle}</Text>
              <Text style={[styles.supportSubtitle, isDark && { color: '#C7D2FE' }]}>
                {strings.settings.needHelpSub}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.supportBtn, isDark && { backgroundColor: '#6366F1' }]}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            <Text style={styles.supportBtnText}>{strings.settings.contactSupportBtn}</Text>
          </TouchableOpacity>

          <Text style={[styles.supportEmailText, isDark && { color: '#A5B4FC' }]}>
            Email: <Text style={styles.supportEmailBold}>reselltrackersupport@gmail.com</Text>
          </Text>
        </View>

        {/* Tutorial & Walkthrough Card */}
        {onOpenTutorial && (
          <TouchableOpacity
            style={[styles.card, styles.tutorialCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={onOpenTutorial}
            activeOpacity={0.8}
          >
            <View style={styles.tutorialRow}>
              <View style={[styles.tutorialIconWrap, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                <Ionicons name="sparkles" size={20} color="#6366F1" />
              </View>
              <View style={styles.tutorialTextGroup}>
                <Text style={[styles.tutorialTitle, { color: colors.textPrimary }]}>
                  {strings.settings.tutorialCardTitle}
                </Text>
                <Text style={[styles.tutorialSubtitle, { color: colors.textSecondary }]}>
                  {strings.settings.tutorialCardSub}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* Backup & Restore Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="cloud-done-outline" size={22} color="#059669" />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{strings.settings.backupTitle}</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            {strings.settings.backupDesc}
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
                {isExporting ? '...' : strings.settings.exportBackup}
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
                {isImporting ? '...' : strings.settings.importBackup}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs Accordion */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>{strings.settings.faqHeading}</Text>
        </View>

        <View style={styles.faqsContainer}>
          {(strings.settings.faqs || FAQS).map((faq, index) => {
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
          <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
            Disclaimer: ResellTracker è uno strumento indipendente. Vinted, eBay, Wallapop, Subito e Depop sono marchi registrati dei rispettivi proprietari e non sono affiliati a questa applicazione.
          </Text>
          <View style={[styles.privacyBadge, isDark && { backgroundColor: '#064E3B', borderColor: '#047857' }]}>
            <Ionicons name="shield-checkmark" size={16} color={isDark ? '#34D399' : '#059669'} />
            <Text style={[styles.privacyBadgeText, isDark && { color: '#D1FAE5' }]}>
              100% Riservata • Zero Server • Offline First
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.privacyLinkButton, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            onPress={() => Linking.openURL('https://amentadavide6-sudo.github.io/resell-tracker/')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-outline" size={14} color={colors.primary} />
            <Text style={[styles.privacyLinkText, { color: colors.primary }]}>
              Informativa sulla Privacy online
            </Text>
            <Ionicons name="open-outline" size={12} color={colors.primary} />
          </TouchableOpacity>
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
  tutorialCard: {
    padding: 14,
  },
  tutorialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tutorialIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialTextGroup: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tutorialSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
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
    flexDirection: 'column',
    gap: 10,
  },
  exportBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  importBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  importBtnText: {
    fontSize: 14,
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
  disclaimerText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
    opacity: 0.8,
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
  privacyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  privacyLinkText: {
    fontSize: 11,
    fontWeight: '600',
  },
  testNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  testNotificationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  langGrid: {
    gap: 8,
    marginTop: 6,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  langFlag: {
    fontSize: 18,
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
