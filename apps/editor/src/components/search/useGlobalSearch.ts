import { computed, onMounted, onUnmounted, ref, type InjectionKey } from 'vue';
import { useAppStore } from '@/stores';
import type { IGlobalSearchService, SearchResultItem } from './search.types';

export const GLOBAL_SEARCH_KEY: InjectionKey<IGlobalSearchService> = Symbol('GLOBAL_SEARCH_KEY');

export function useGlobalSearch(navigate: (path: string) => void, onOpenTrash?: () => void, onOpenDocs?: () => void): IGlobalSearchService {
  const appStore = useAppStore();
  const searchQuery = ref('');
  const isOpen = ref(false);

  function open() {
    searchQuery.value = '';
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  function execute(item: SearchResultItem) {
    close();
    item.action();
  }

  // Predefined navigation items
  const navigationItems: SearchResultItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Ringkasan sistem dan metrik tabel',
      icon: 'house_fill',
      category: 'navigation',
      action: () => navigate('/'),
    },
    {
      id: 'nav-apps',
      title: 'Applications',
      subtitle: 'Jelajahi dan kelola seluruh aplikasi survei',
      icon: 'app_fill',
      category: 'navigation',
      action: () => navigate('/applications'),
    },
    {
      id: 'nav-orgs',
      title: 'Organizations',
      subtitle: 'Kelola tim, anggota, dan grup pengguna',
      icon: 'building_2_fill',
      category: 'navigation',
      action: () => navigate('/organizations'),
    },
    {
      id: 'nav-api-keys',
      title: 'Developer API Keys',
      subtitle: 'Kelola token akses terprogram & webhook',
      icon: 'key_fill',
      category: 'navigation',
      badge: 'Dev',
      action: () => navigate('/api-keys'),
    },
    {
      id: 'action-trash',
      title: 'Aplikasi Terhapus (Trash)',
      subtitle: 'Pulihkan aplikasi yang telah dihapus',
      icon: 'trash_fill',
      category: 'action',
      action: () => {
        if (onOpenTrash) onOpenTrash();
      },
    },
    {
      id: 'action-docs',
      title: 'Dokumentasi REST API Cerdas',
      subtitle: 'Pelajari endpoint, otentikasi, dan cuplikan kode',
      icon: 'book',
      category: 'action',
      action: () => {
        if (onOpenDocs) onOpenDocs();
      },
    },
  ];

  const results = computed<SearchResultItem[]>(() => {
    const q = searchQuery.value.trim().toLowerCase();

    // Map apps to search items
    const appItems: SearchResultItem[] = (appStore.apps || []).map((app) => ({
      id: `app-${app.id}`,
      title: app.name,
      subtitle: app.description || `App: ${app.slug || app.id}`,
      icon: 'doc_text_fill',
      category: 'app',
      badge: app.mode === 'complex' ? 'Complex' : 'Simple',
      action: () => navigate(`/editor/${app.slug || app.id}`),
    }));

    if (!q) {
      // Default: show navigation and recent 5 apps
      return [...navigationItems, ...appItems.slice(0, 5)];
    }

    // Filter apps
    const filteredApps = appItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    // Filter navigation
    const filteredNav = navigationItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    return [...filteredApps, ...filteredNav];
  });

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isOpen.value) {
        close();
      } else {
        open();
      }
    } else if (e.key === 'Escape' && isOpen.value) {
      close();
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    searchQuery,
    isOpen,
    results,
    open,
    close,
    execute,
  };
}
