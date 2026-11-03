import React from 'react';
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
import {
  FiscalSettingMode,
  CurrencyPreference,
  setFiscalMode,
  getSavedFiscalMode,
} from '../services/fiscalManager';

interface FiscalOption {
  mode: FiscalSettingMode;
  currency: CurrencyPreference;
  flag: string;
  labelKey: keyof FiscalOptionsLabels;
  descKey: keyof FiscalOptionsLabels;
  color: string;
}

interface FiscalOptionsLabels {
  euLabel: string;
  euDesc: string;
  usLabel: string;
  usDesc: string;
  ukLabel: string;
  ukDesc: string;
  noneLabel: string;
  noneDesc: string;
}

const OPTIONS: FiscalOption[] = [
  {
    mode: 'eu_dac7',
    currency: 'EUR',
    flag: '🇪🇺',
    labelKey: 'euLabel',
    descKey: 'euDesc',
    color: '#3B82F6',
  },
  {
    mode: 'us_1099k',
    currency: 'USD',
    flag: '🇺🇸',
    labelKey: 'usLabel',
    descKey: 'usDesc',
    color: '#10B981',
  },
  {
    mode: 'uk_hmrc',
    currency: 'GBP',
    flag: '🇬🇧',
    labelKey: 'ukLabel',
    descKey: 'ukDesc',
    color: '#8B5CF6',
  },
  {
    mode: 'none',
    currency: 'EUR',
    flag: '🌍',
    labelKey: 'noneLabel',
    descKey: 'noneDesc',
    color: '#94A3B8',
  },
];

interface FiscalSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const FiscalSettingsSheet: React.FC<FiscalSettingsSheetProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const { setCurrencyPreference } = useCurrency();

  const currentMode = getSavedFiscalMode();

  const fiscalLabels: FiscalOptionsLabels = {
    euLabel: strings.settings.fiscalEu,
    euDesc: strings.fiscalSheet?.euDesc ?? 'EU DAC7 Directive • € Euro',
    usLabel: strings.settings.fiscalUs,
    usDesc: strings.fiscalSheet?.usDesc ?? 'IRS Form 1099-K • $ USD',
    ukLabel: strings.settings.fiscalUk,
    ukDesc: strings.fiscalSheet?.ukDesc ?? 'HMRC Trading Allowance • £ GBP',
    noneLabel: strings.settings.fiscalNone,
    noneDesc: strings.fiscalSheet?.noneDesc ?? 'No fiscal monitoring',
  };

  const handleSelect = (option: FiscalOption) => {
    setFiscalMode(option.mode);
    // For 'none', keep current currency (auto); otherwise set the matching currency
    if (option.mode !== 'none') {
      setCurrencyPreference(option.currency);
    } else {
      setCurrencyPreference('auto');
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  {strings.fiscalSheet?.title ?? 'Fiscal Settings'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  {strings.fiscalSheet?.subtitle ?? 'Select your area to set tax rules & currency'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {OPTIONS.map((option) => {
                const isSelected = currentMode === option.mode;
                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected
                          ? option.color + '18'
                          : isDark
                          ? '#1E293B'
                          : '#F8FAFC',
                        borderColor: isSelected ? option.color : colors.cardBorder,
                      },
                    ]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.optionFlag}>{option.flag}</Text>
                    <View style={styles.optionMeta}>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? option.color : colors.textPrimary,
                          },
                        ]}
                      >
                        {fiscalLabels[option.labelKey]}
                      </Text>
                      <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                        {fiscalLabels[option.descKey]}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={option.color}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer note */}
            <View
              style={[
                styles.footerNote,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={12} color="#6366F1" />
              <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
                {strings.fiscalSheet?.footerNote ??
                  '100% offline · You can change this anytime in Settings'}
              </Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    maxWidth: 240,
  },
  closeBtn: {
    padding: 4,
  },
  optionsContainer: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionFlag: {
    fontSize: 24,
  },
  optionMeta: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  footerNoteText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
