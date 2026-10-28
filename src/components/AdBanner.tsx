import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isProUser } from '../services/proManager';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';

interface AdBannerProps {
  onUpgradePress: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onUpgradePress }) => {
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    try {
      setIsPro(isProUser());
    } catch {
      setIsPro(false);
    }
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
      <View style={styles.topBar}>
        <View style={[styles.adBadge, isDark && { backgroundColor: '#374151' }]}>
          <Text style={[styles.adBadgeText, isDark && { color: '#9CA3AF' }]}>{strings.banner.sponsor}</Text>
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
          <Text style={[styles.removeAdsText, { color: colors.textPrimary }]}>{strings.banner.removeAds}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.adWrapper}
        onPress={onUpgradePress}
        activeOpacity={0.85}
      >
        <Text style={[styles.adTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {strings.banner.proTagline}
        </Text>
        <Text style={[styles.adSub, { color: colors.textMuted }]} numberOfLines={1}>
          {strings.banner.proSub}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  removeAdsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  removeAdsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    width: '100%',
  },
  adTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  adSub: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
