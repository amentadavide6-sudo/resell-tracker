import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlatformConfig, PlatformId } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { useAlert } from '../context/AlertContext';
import { getAllAvailablePlatforms, deleteCustomPlatform } from '../services/customPlatformManager';

interface PlatformSelectorProps {
  selectedId?: PlatformId;
  onSelect?: (id: PlatformId) => void;
  multiSelect?: boolean;
  selectedIds?: PlatformId[];
  onToggle?: (id: PlatformId) => void;
  title?: string;
  platforms?: PlatformConfig[];
  onDeleteCustom?: (id: PlatformId) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedId,
  onSelect,
  multiSelect = false,
  selectedIds = [],
  onToggle,
  title,
  platforms,
  onDeleteCustom,
}) => {
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const { showAlert } = useAlert();

  const [platformList, setPlatformList] = useState<PlatformConfig[]>(() =>
    platforms || getAllAvailablePlatforms()
  );

  useEffect(() => {
    setPlatformList(platforms || getAllAvailablePlatforms());
  }, [platforms]);

  const handlePress = (id: PlatformId) => {
    if (multiSelect && onToggle) {
      onToggle(id);
    } else if (onSelect) {
      onSelect(id);
    }
  };

  const confirmDeleteCustom = (platform: PlatformConfig) => {
    showAlert({
      title: strings.inventory.deleteCustomPlatformTitle,
      message: `${strings.inventory.deleteCustomPlatformMsg}\n\n"${platform.name}"`,
      type: 'warning',
      buttons: [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: () => {
            deleteCustomPlatform(platform.id);
            setPlatformList((prev) => prev.filter((p) => p.id !== platform.id));
            if (onDeleteCustom) {
              onDeleteCustom(platform.id);
            }
          },
        },
      ],
    });
  };

  const getPlatformName = (platform: PlatformConfig) => {
    if (platform.id === 'custom') {
      return strings.platforms.customName;
    }
    return platform.name;
  };

  const getPlatformTagline = (platform: PlatformConfig) => {
    switch (platform.id) {
      case 'vinted':
        return strings.platforms.vintedTag;
      case 'ebay':
        return strings.platforms.ebayTag;
      case 'wallapop':
        return strings.platforms.wallapopTag;
      case 'subito':
        return strings.platforms.subitoTag;
      case 'depop':
        return strings.platforms.depopTag;
      case 'custom':
        return strings.platforms.customTag;
      default:
        return platform.tagline;
    }
  };

  const defaultTitle = multiSelect
    ? strings.inventory.allPlatforms
    : strings.calculator.selectPlatform;

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {title || defaultTitle}
        </Text>
        {multiSelect && selectedIds.length > 1 && (
          <View style={[styles.multiCountBadge, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
            <Text style={[styles.multiCountText, { color: '#6366F1' }]}>
              {selectedIds.length} {strings.common.pieces}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {platformList.map((platform) => {
          const isSelected = multiSelect
            ? selectedIds.includes(platform.id)
            : platform.id === selectedId;

          return (
            <View
              key={platform.id}
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
              {/* Separate touchable delete icon for custom platforms - NOT nested */}
              {platform.isCustom && (
                <TouchableOpacity
                  style={[
                    styles.deleteCustomBtn,
                    { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' },
                  ]}
                  onPress={() => confirmDeleteCustom(platform)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={12} color="#EF4444" />
                </TouchableOpacity>
              )}

              {/* Main selection touchable */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePress(platform.id)}
                onLongPress={() => {
                  if (platform.isCustom) {
                    confirmDeleteCustom(platform);
                  }
                }}
                delayLongPress={350}
                style={styles.cardContent}
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
                    numberOfLines={1}
                  >
                    {getPlatformName(platform)}
                  </Text>
                  {multiSelect && isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={platform.color}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.badge,
                    { backgroundColor: isDark ? '#1E293B' : platform.badgeBg },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: platform.color }]} numberOfLines={1}>
                    {getPlatformTagline(platform)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
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
    position: 'relative',
    borderWidth: 1.5,
    borderRadius: 14,
    minWidth: 135,
    overflow: 'visible',
  },
  cardContent: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 16,
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
    flexShrink: 1,
    marginRight: 4,
  },
  deleteCustomBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 20,
    padding: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 160,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
