import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

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
  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(value.replace(',', '.')) || 0;
    const updated = Math.max(0, current + amount);
    onChangeValue(updated.toString());
  };

  return (
    <View style={styles.container}>
      {/* Label and subtitle stacked vertically to avoid horizontal column collisions */}
      <View style={styles.labelContainer}>
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.currencySymbol}>€</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(txt) => {
            const sanitized = txt.replace(/[^0-9.,]/g, '');
            onChangeValue(sanitized);
          }}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          selectTextOnFocus
        />
        {value !== '' && (
          <TouchableOpacity
            onPress={() => onChangeValue('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {quickAddAmounts.length > 0 && (
        <View style={styles.quickAddRow}>
          {quickAddAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => handleQuickAdd(amt)}
              style={styles.quickAddChip}
              activeOpacity={0.6}
            >
              <Text style={styles.quickAddText}>+{amt}€</Text>
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
    minHeight: 32, // Consistent height for label + subtitle alignment across adjacent columns
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  currencySymbol: {
    fontSize: 17,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
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
