export type SearchCategory = 'app' | 'navigation' | 'action';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  category: SearchCategory;
  badge?: string;
  action: () => void;
}

export interface IGlobalSearchService {
  searchQuery: import('vue').Ref<string>;
  isOpen: import('vue').Ref<boolean>;
  results: import('vue').ComputedRef<SearchResultItem[]>;
  open: () => void;
  close: () => void;
  execute: (item: SearchResultItem) => void;
}
