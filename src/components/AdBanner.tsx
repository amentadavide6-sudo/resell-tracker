import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isProUser } from '../services/proManager';

interface AdBannerProps {
  onUpgradePress: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onUpgradePress }) => {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(isProUser());
  }, []);

  // Pro users never see ads
  if (isPro) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.adContent}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>ANNUNCIO</Text>
        </View>
        <Text style={styles.adText} numberOfLines={1}>
          Spazio riservato Google AdMob
        </Text>
      </View>

      <TouchableOpacity
        style={styles.removeAdsBtn}
        onPress={onUpgradePress}
        activeOpacity={0.7}
      >
        <Ionicons name="sparkles" size={12} color="#F59E0B" />
        <Text style={styles.removeAdsText}>Rimuovi Ads (Pro)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    color: '#64748B',
    fontStyle: 'italic',
  },
  removeAdsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  removeAdsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
});
