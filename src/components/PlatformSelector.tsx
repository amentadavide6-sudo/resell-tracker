import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { PLATFORMS } from '../constants/platforms';
import { PlatformId } from '../types';

interface PlatformSelectorProps {
  selectedId: PlatformId;
  onSelect: (id: PlatformId) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>SELEZIONA PIATTAFORMA</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PLATFORMS.map((platform) => {
          const isSelected = platform.id === selectedId;
          return (
            <TouchableOpacity
              key={platform.id}
              activeOpacity={0.7}
              onPress={() => onSelect(platform.id)}
              style={[
                styles.card,
                isSelected && {
                  borderColor: platform.color,
                  backgroundColor: '#FFFFFF',
                  shadowColor: platform.color,
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: platform.color },
                  ]}
                />
                <Text
                  style={[
                    styles.platformName,
                    isSelected && { color: platform.color, fontWeight: '700' },
                  ]}
                >
                  {platform.name}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: platform.badgeBg },
                ]}
              >
                <Text style={[styles.badgeText, { color: platform.color }]}>
                  {platform.tagline}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 130,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
