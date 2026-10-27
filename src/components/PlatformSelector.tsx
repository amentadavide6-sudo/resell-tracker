import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLATFORMS } from '../constants/platforms';
import { PlatformId } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PlatformSelectorProps {
  selectedId?: PlatformId;
  onSelect?: (id: PlatformId) => void;
  multiSelect?: boolean;
  selectedIds?: PlatformId[];
  onToggle?: (id: PlatformId) => void;
  title?: string;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedId,
  onSelect,
  multiSelect = false,
  selectedIds = [],
  onToggle,
  title,
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = (id: PlatformId) => {
    if (multiSelect && onToggle) {
      onToggle(id);
    } else if (onSelect) {
      onSelect(id);
    }
  };

  const defaultTitle = multiSelect
    ? 'PIATTAFORME ATTIVE (MULTI-SELEZIONE)'
    : 'SELEZIONA PIATTAFORMA';

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {title || defaultTitle}
        </Text>
        {multiSelect && selectedIds.length > 1 && (
          <View style={[styles.multiCountBadge, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
            <Text style={[styles.multiCountText, { color: '#6366F1' }]}>
              {selectedIds.length} selezionate
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PLATFORMS.map((platform) => {
          const isSelected = multiSelect
            ? selectedIds.includes(platform.id)
            : platform.id === selectedId;

          return (
            <TouchableOpacity
              key={platform.id}
              activeOpacity={0.7}
              onPress={() => handlePress(platform.id)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
                isSelected && {
                  borderColor: platform.color,
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
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
                    { color: colors.textPrimary },
                    isSelected && { color: platform.color, fontWeight: '700' },
                  ]}
                >
                  {platform.name}
                </Text>
                {multiSelect && isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={platform.color}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </View>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: isDark ? '#1E293B' : platform.badgeBg },
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
    marginVertical: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  multiCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  multiCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  card: {
    borderWidth: 1.5,
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
