import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AddItemModal } from '../components/AddItemModal';
import { MarkSoldModal } from '../components/MarkSoldModal';
import {
  getAllInventoryItems,
  deleteInventoryItem,
  markItemAsSold,
  updateItemStatus,
} from '../services/db';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { PLATFORMS } from '../constants/platforms';
import { canAddMoreItems, isProUser, FREE_TIER_ITEM_LIMIT } from '../services/proManager';
import { getUserXP, getLevelInfo } from '../services/gamification';
import { useTheme } from '../context/ThemeContext';
import { InventoryItem, ItemStatus } from '../types';

export const InventoryScreen: React.FC<{ onOpenProModal?: () => void }> = ({ onOpenProModal }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<ItemStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToSell, setItemToSell] = useState<InventoryItem | null>(null);
  const [userXP, setUserXP] = useState(0);

  const isPro = isProUser();
  const levelInfo = useMemo(() => getLevelInfo(userXP), [userXP]);

  const loadData = useCallback(() => {
    try {
      const data = getAllInventoryItems(activeFilter);
      setItems(data);
      setUserXP(getUserXP());
    } catch (e) {
      console.error(e);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered by search
  const displayedItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.platformId.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Overall statistics for listed inventory
  const inventoryStats = useMemo(() => {
    const active = items.filter((i) => i.status === 'listed');
    const totalInvested = active.reduce((sum, i) => sum + i.purchaseCost, 0);
    const potentialRevenue = active.reduce((sum, i) => sum + i.targetSellingPrice, 0);

    let potentialProfit = 0;
    active.forEach((i) => {
      const calc = calculateResellProfit({
        sellingPrice: i.targetSellingPrice,
        purchaseCost: i.purchaseCost,
        sellerShippingCost: i.sellerShippingCost,
        packagingCost: i.packagingCost,
        platformId: i.platformId,
      });
      potentialProfit += calc.netProfit;
    });

    return {
      activeCount: active.length,
      totalInvested,
      potentialProfit,
    };
  }, [items]);

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      'Elimina Articolo',
      `Vuoi davvero eliminare "${title}" dall'inventario?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            deleteInventoryItem(id);
            loadData();
          },
        },
      ]
    );
  };

  const handleOpenAddModal = () => {
    const totalCount = items.length;
    if (!canAddMoreItems(totalCount)) {
      Alert.alert(
        'Limite Versione Free Raggiunto',
        `Hai raggiunto il limite di ${FREE_TIER_ITEM_LIMIT} articoli della versione gratuita. Passa a ResellTracker Pro a 3,49 € una tantum per sbloccare l'inventario illimitato!`,
        [
          { text: 'Più tardi', style: 'cancel' },
          {
            text: 'Passa a Pro',
            onPress: () => {
              if (onOpenProModal) onOpenProModal();
            },
          },
        ]
      );
      return;
    }
    setModalVisible(true);
  };

  const handleMarkAsSold = (item: InventoryItem) => {
    setItemToSell(item);
  };

  const renderItemCard = ({ item }: { item: InventoryItem }) => {
    const platform = PLATFORMS.find((p) => p.id === item.platformId) || PLATFORMS[0];
    const calc = calculateResellProfit({
      sellingPrice: item.status === 'sold' && item.actualSellingPrice ? item.actualSellingPrice : item.targetSellingPrice,
      purchaseCost: item.purchaseCost,
      sellerShippingCost: item.sellerShippingCost,
      packagingCost: item.packagingCost,
      platformId: item.platformId,
    });

    const isSold = item.status === 'sold';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }, isSold && (isDark ? { backgroundColor: '#111827' } : styles.cardSold)]}>
        <View style={styles.cardHeader}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.cardThumb} />
          ) : (
            <View style={[styles.cardThumbPlaceholder, { backgroundColor: isDark ? '#1E293B' : platform.badgeBg }]}>
              <Ionicons name="shirt-outline" size={26} color={platform.color} />
            </View>
          )}

          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
            </View>

            <View style={styles.tagRow}>
              <View style={[styles.platformBadge, { backgroundColor: isDark ? '#1E293B' : platform.badgeBg }]}>
                <Text style={[styles.platformBadgeText, { color: platform.color }]}>
                  {platform.name}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isSold
                    ? (isDark ? { backgroundColor: '#064E3B' } : { backgroundColor: '#ECFDF5' })
                    : (isDark ? { backgroundColor: '#1E3A8A' } : { backgroundColor: '#EFF6FF' }),
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isSold ? { color: isDark ? '#34D399' : '#059669' } : { color: isDark ? '#93C5FD' : '#2563EB' },
                  ]}
                >
                  {isSold ? 'Venduto' : item.status === 'draft' ? 'Bozza' : 'In Vendita'}
                </Text>
              </View>
            </View>

            {/* Financial comparison */}
            <View style={styles.pricesRow}>
              <Text style={[styles.priceAcquired, { color: colors.textSecondary }]}>Acquisto: {formatEuro(item.purchaseCost)}</Text>
              <Text style={styles.priceArrow}>➔</Text>
              <Text style={[styles.priceTarget, { color: colors.textPrimary }]}>
                {isSold ? `Venduto: ${formatEuro(item.actualSellingPrice || item.targetSellingPrice)}` : `Prezzo: ${formatEuro(item.targetSellingPrice)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Footer: Net profit and quick actions */}
        <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
          <View style={styles.profitBadge}>
            <Text style={[styles.profitBadgeLabel, { color: colors.textSecondary }]}>Guadagno Netto:</Text>
            <Text
              style={[
                styles.profitBadgeValue,
                { color: calc.netProfit > 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {formatEuro(calc.netProfit)}
            </Text>
          </View>

          <View style={styles.cardActions}>
            {!isSold && item.id && (
              <TouchableOpacity
                style={styles.soldActionBtn}
                onPress={() => handleMarkAsSold(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                <Text style={styles.soldActionBtnText}>Venduto</Text>
              </TouchableOpacity>
            )}

            {item.id && (
              <TouchableOpacity
                style={styles.deleteActionBtn}
                onPress={() => handleDelete(item.id!, item.title)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>INVENTARIO ARTICOLI</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>I Miei Capi</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Aggiungi</Text>
        </TouchableOpacity>
      </View>

      {/* Reseller XP & Level Pill */}
      <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.levelRow}>
          <View style={styles.levelInfoGroup}>
            <Text style={styles.levelBadgeEmoji}>{levelInfo.badge}</Text>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.levelTitleText, { color: colors.textPrimary }]}>
                  {levelInfo.title}
                </Text>
                {isPro && (
                  <View style={styles.proBoostPill}>
                    <Text style={styles.proBoostText}>2x XP ⚡</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.levelSubText, { color: colors.textMuted }]}>
                {levelInfo.nextLevelTitle
                  ? `Mancano ${levelInfo.xpToNextLevel} XP a "${levelInfo.nextLevelTitle}"`
                  : 'Livello massimo raggiunto!'}
              </Text>
            </View>
          </View>
          <Text style={[styles.levelXPBadge, { color: colors.primary }]}>
            {levelInfo.currentXP} XP
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.levelTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
          <View
            style={[
              styles.levelFill,
              { width: `${Math.round(levelInfo.progress * 100)}%`, backgroundColor: levelInfo.badgeColor },
            ]}
          />
        </View>
      </View>

      {/* KPI Overview Card */}
      <View style={[styles.kpiContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{inventoryStats.activeCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Capi Attivi</Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{formatEuro(inventoryStats.totalInvested)}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Capitale Fermo</Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            {formatEuro(inventoryStats.potentialProfit)}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Profitto Previsto</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Cerca per titolo o piattaforma..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersRow}>
        {(['all', 'listed', 'sold', 'draft'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveFilter(tab)}
            style={[
              styles.filterChip,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              activeFilter === tab && { backgroundColor: isDark ? colors.primary : '#0F172A' },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: colors.textSecondary },
                activeFilter === tab && { color: '#FFFFFF', fontWeight: '700' },
              ]}
            >
              {tab === 'all'
                ? 'Tutti'
                : tab === 'listed'
                ? 'In Vendita'
                : tab === 'sold'
                ? 'Venduti'
                : 'Bozze'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items List */}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
        renderItem={renderItemCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Nessun articolo trovato</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Nessun risultato corrisponde alla ricerca.'
                : 'Inizia a catalogare i tuoi capi per tenere traccia delle tue vendite.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={handleOpenAddModal}
              >
                <Text style={styles.emptyAddBtnText}>+ Aggiungi il primo articolo</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Add Item Modal */}
      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onItemAdded={loadData}
      />

      {/* Mark As Sold Custom Modal */}
      <MarkSoldModal
        visible={itemToSell !== null}
        item={itemToSell}
        onClose={() => setItemToSell(null)}
        onSuccess={() => {
          setItemToSell(null);
          loadData();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  levelCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  levelBadgeEmoji: {
    fontSize: 22,
  },
  levelTitleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  levelSubText: {
    fontSize: 10,
    marginTop: 1,
  },
  levelXPBadge: {
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 6,
  },
  proBoostPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proBoostText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  levelTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 3,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardSold: {
    opacity: 0.85,
    backgroundColor: '#FAFCFF',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  cardThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  cardThumbPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  platformBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pricesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceAcquired: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  priceArrow: {
    fontSize: 10,
    color: '#94A3B8',
  },
  priceTarget: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  profitBadgeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  profitBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  soldActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  soldActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  deleteActionBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 18,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
