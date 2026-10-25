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
import {
  getAllInventoryItems,
  deleteInventoryItem,
  markItemAsSold,
  updateItemStatus,
} from '../services/db';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { PLATFORMS } from '../constants/platforms';
import { canAddMoreItems, FREE_TIER_ITEM_LIMIT } from '../services/proManager';
import { InventoryItem, ItemStatus } from '../types';

export const InventoryScreen: React.FC<{ onOpenProModal?: () => void }> = ({ onOpenProModal }) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<ItemStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

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

  const loadData = useCallback(() => {
    try {
      const data = getAllInventoryItems(activeFilter);
      setItems(data);
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

  const handleMarkAsSold = (item: InventoryItem) => {
    Alert.prompt
      ? Alert.prompt(
          'Segna come Venduto',
          `Prezzo finale incassato per "${item.title}":`,
          [
            { text: 'Annulla', style: 'cancel' },
            {
              text: 'Conferma Vendita',
              onPress: (val) => {
                const finalPrice = parseFloat(val?.replace(',', '.') || '') || item.targetSellingPrice;
                if (item.id) {
                  markItemAsSold(item.id, finalPrice);
                  loadData();
                }
              },
            },
          ],
          'plain-text',
          item.targetSellingPrice.toString()
        )
      : Alert.alert(
          'Segna come Venduto',
          `Confermi di aver venduto "${item.title}" a ${formatEuro(item.targetSellingPrice)}?`,
          [
            { text: 'Annulla', style: 'cancel' },
            {
              text: 'Conferma',
              onPress: () => {
                if (item.id) {
                  markItemAsSold(item.id, item.targetSellingPrice);
                  loadData();
                }
              },
            },
          ]
        );
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
      <View style={[styles.card, isSold && styles.cardSold]}>
        <View style={styles.cardHeader}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.cardThumb} />
          ) : (
            <View style={[styles.cardThumbPlaceholder, { backgroundColor: platform.badgeBg }]}>
              <Ionicons name="shirt-outline" size={26} color={platform.color} />
            </View>
          )}

          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
            </View>

            <View style={styles.tagRow}>
              <View style={[styles.platformBadge, { backgroundColor: platform.badgeBg }]}>
                <Text style={[styles.platformBadgeText, { color: platform.color }]}>
                  {platform.name}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isSold ? { backgroundColor: '#ECFDF5' } : { backgroundColor: '#EFF6FF' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isSold ? { color: '#059669' } : { color: '#2563EB' },
                  ]}
                >
                  {isSold ? 'Venduto' : item.status === 'draft' ? 'Bozza' : 'In Vendita'}
                </Text>
              </View>
            </View>

            {/* Financial comparison */}
            <View style={styles.pricesRow}>
              <Text style={styles.priceAcquired}>Acquisto: {formatEuro(item.purchaseCost)}</Text>
              <Text style={styles.priceArrow}>➔</Text>
              <Text style={styles.priceTarget}>
                {isSold ? `Venduto: ${formatEuro(item.actualSellingPrice || item.targetSellingPrice)}` : `Prezzo: ${formatEuro(item.targetSellingPrice)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Footer: Net profit and quick actions */}
        <View style={styles.cardFooter}>
          <View style={styles.profitBadge}>
            <Text style={styles.profitBadgeLabel}>Guadagno Netto:</Text>
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
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>INVENTARIO ARTICOLI</Text>
          <Text style={styles.headerTitle}>I Miei Capi</Text>
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

      {/* KPI Overview Card */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>{inventoryStats.activeCount}</Text>
          <Text style={styles.kpiLabel}>Capi Attivi</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>{formatEuro(inventoryStats.totalInvested)}</Text>
          <Text style={styles.kpiLabel}>Capitale Fermo</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            {formatEuro(inventoryStats.potentialProfit)}
          </Text>
          <Text style={styles.kpiLabel}>Profitto Previsto</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca per titolo o piattaforma..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersRow}>
        {(['all', 'listed', 'sold', 'draft'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveFilter(tab)}
            style={[styles.filterChip, activeFilter === tab && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === tab && styles.filterChipTextActive,
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
