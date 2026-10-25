import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { Ionicons } from '@expo/vector-icons';
import { isProUser } from '../services/proManager';
import { useTheme } from '../context/ThemeContext';
import { ADMOB_CONFIG } from '../constants/admob';

interface AdBannerProps {
  onUpgradePress: () => void;
}

const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.bannerAdUnitId;

export const AdBanner: React.FC<AdBannerProps> = ({ onUpgradePress }) => {
  const { colors, isDark } = useTheme();
  const [isPro, setIsPro] = useState(false);
  const [adError, setAdError] = useState(false);

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
      <View style={styles.topBar}>
        <View style={[styles.adBadge, isDark && { backgroundColor: '#374151' }]}>
          <Text style={[styles.adBadgeText, isDark && { color: '#9CA3AF' }]}>ANNUNCIO</Text>
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

      <View style={styles.adWrapper}>
        {!adError ? (
          <BannerAd
            unitId={AD_UNIT_ID}
            size={BannerAdSize.BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdFailedToLoad={(err) => {
              console.log('AdMob banner failed to load:', err?.message);
              setAdError(true);
            }}
          />
        ) : (
          <Text style={[styles.adText, { color: colors.textMuted }]} numberOfLines={1}>
            ResellTracker · Calcola guadagni reali su Vinted ed eBay
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    minHeight: 50,
    width: '100%',
  },
  adText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
