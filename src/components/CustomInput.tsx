import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomInputProps {
  label: string;
  value: string;
  onChangeValue: (text: string) => void;
  placeholder?: string;
  subtitle?: string;
  iconName?: string;
  quickAddAmounts?: number[];
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  onChangeValue,
  placeholder = '0.00',
  subtitle,
  quickAddAmounts = [],
}) => {
  const { colors, isDark } = useTheme();

  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(value.replace(',', '.')) || 0;
    const updated = Math.max(0, current + amount);
    onChangeValue(updated.toString());
  };

  return (
    <View style={styles.container}>
      {/* Label and subtitle stacked vertically to avoid horizontal column collisions */}
      <View style={styles.labelContainer}>
        <Text
          style={[styles.label, { color: colors.textPrimary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>€</Text>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={(txt) => {
            const sanitized = txt.replace(/[^0-9.,]/g, '');
            onChangeValue(sanitized);
          }}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectTextOnFocus
        />
        {value !== '' && (
          <TouchableOpacity
            onPress={() => onChangeValue('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.clearBtn, isDark && { backgroundColor: '#374151' }]}
          >
            <Text style={[styles.clearBtnText, isDark && { color: '#9CA3AF' }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {quickAddAmounts.length > 0 && (
        <View style={styles.quickAddRow}>
          {quickAddAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => handleQuickAdd(amt)}
              style={[
                styles.quickAddChip,
                isDark && { backgroundColor: '#1E293B', borderColor: '#334155' },
              ]}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.quickAddText,
                  isDark && { color: '#94A3B8' },
                ]}
              >
                +{amt}€
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  labelContainer: {
    marginBottom: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  currencySymbol: {
    fontSize: 17,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 0,
  },
  clearBtn: {
    backgroundColor: '#F1F5F9',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  quickAddChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickAddText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});
