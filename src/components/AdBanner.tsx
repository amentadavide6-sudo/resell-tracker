import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isProUser } from '../services/proManager';
import { useTheme } from '../context/ThemeContext';

interface AdBannerProps {
  onUpgradePress: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onUpgradePress }) => {
  const { colors, isDark } = useTheme();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(isProUser());
  }, []);

  // Pro users never see ads
  if (isPro) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#111827' : '#F1F5F9',
          borderTopColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.adContent}>
        <View style={[styles.adBadge, isDark && { backgroundColor: '#374151' }]}>
          <Text style={[styles.adBadgeText, isDark && { color: '#9CA3AF' }]}>ANNUNCIO</Text>
        </View>
        <Text style={[styles.adText, { color: colors.textMuted }]} numberOfLines={1}>
          Spazio riservato Google AdMob
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.removeAdsBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={onUpgradePress}
        activeOpacity={0.7}
      >
        <Ionicons name="sparkles" size={12} color="#F59E0B" />
        <Text style={[styles.removeAdsText, { color: colors.textPrimary }]}>Rimuovi Ads (Pro)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 38,
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  adBadge: {
    backgroundColor: '#CBD5E1',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  adText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  removeAdsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  removeAdsText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
