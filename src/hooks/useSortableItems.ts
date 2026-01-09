import { useState, useEffect, useMemo, useCallback } from 'react';

interface ItemSettings {
  order: number;
  isPinned: boolean;
}

type SettingsMap = Record<string, ItemSettings>;

interface SortableConfig<T extends { id: string }> {
  storageKey: string;
  items: T[];
}

export function useSortableItems<T extends { id: string }>({ storageKey, items }: SortableConfig<T>) {
  // Carrega configurações do localStorage
  const [settings, setSettings] = useState<SettingsMap>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Salva no localStorage quando muda
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [storageKey, settings]);

  // Ordena itens: fixados primeiro (por ordem), depois não-fixados (por ordem)
  const sortedItems = useMemo(() => {
    const itemsWithSettings = items.map((item) => {
      const itemSettings = settings[item.id] || { order: 999, isPinned: false };
      return { item: item as T, settings: itemSettings };
    });

    // Separa fixados e não fixados
    const pinned = itemsWithSettings
      .filter((x) => x.settings.isPinned)
      .sort((a, b) => a.settings.order - b.settings.order);

    const unpinned = itemsWithSettings
      .filter((x) => !x.settings.isPinned)
      .sort((a, b) => a.settings.order - b.settings.order);

    return [...pinned, ...unpinned].map((x) => x.item);
  }, [items, settings]);

  // Verifica se um item está fixado
  const isPinned = useCallback(
    (id: string) => settings[id]?.isPinned || false,
    [settings]
  );

  // Toggle fixar/desfixar
  const togglePin = useCallback((id: string) => {
    setSettings((prev) => {
      const current = prev[id] || { order: 999, isPinned: false };
      return {
        ...prev,
        [id]: { ...current, isPinned: !current.isPinned },
      };
    });
  }, []);

  // Atualiza ordem após drag-and-drop
  const reorder = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;

    setSettings((prev) => {
      const newSettings = { ...prev };
      
      // Encontra as posições atuais
      const activeSettings = newSettings[activeId] || { order: 999, isPinned: false };
      const overSettings = newSettings[overId] || { order: 999, isPinned: false };

      // Define nova ordem baseada na posição do item de destino
      newSettings[activeId] = { ...activeSettings, order: overSettings.order };

      // Recalcula ordens para todos os outros itens
      const allIds = Object.keys(newSettings);
      const sortedIds = allIds
        .filter((id) => id !== activeId)
        .sort((a, b) => (newSettings[a]?.order || 999) - (newSettings[b]?.order || 999));

      let orderIndex = 0;
      for (const id of sortedIds) {
        if (orderIndex === overSettings.order) orderIndex++;
        newSettings[id] = { ...newSettings[id], order: orderIndex };
        orderIndex++;
      }

      return newSettings;
    });
  }, []);

  // Move um item para cima
  const moveUp = useCallback(
    (id: string) => {
      const currentIndex = sortedItems.findIndex((item) => item.id === id);
      if (currentIndex <= 0) return;
      const prevId = sortedItems[currentIndex - 1].id;
      reorder(id, prevId);
    },
    [sortedItems, reorder]
  );

  // Move um item para baixo
  const moveDown = useCallback(
    (id: string) => {
      const currentIndex = sortedItems.findIndex((item) => item.id === id);
      if (currentIndex < 0 || currentIndex >= sortedItems.length - 1) return;
      const nextId = sortedItems[currentIndex + 1].id;
      reorder(id, nextId);
    },
    [sortedItems, reorder]
  );

  return {
    sortedItems,
    isPinned,
    togglePin,
    reorder,
    moveUp,
    moveDown,
  };
}
