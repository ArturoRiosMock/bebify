import type { CatalogEntry } from '@/config/category-catalog';
import { DEFAULT_CATEGORY_ICON, getCategoryIcon } from '@/config/category-icons';

export type MegaMenuPanelProps = {
  entries: CatalogEntry[];
  featuredImage: string | null;
  featuredTitle: string | null;
  viewAllLabel?: string;
  viewAllHandle: string | null;
  onSelectCategory: (entry: CatalogEntry) => void;
  onViewAll: (collectionHandle: string) => void;
};

function entryKey(entry: CatalogEntry, index: number): string {
  if (entry.type === 'heading') return `heading-${index}`;
  if (entry.type === 'route') return entry.path;
  if (entry.type === 'tag') return `tag-${entry.collectionHandle}-${entry.tag}`;
  return entry.handle;
}

function EntryIcon({ entry }: { entry: CatalogEntry }) {
  if (entry.type === 'heading') return null;
  const iconHandle =
    entry.type === 'collection' ? entry.handle : entry.collectionHandle;
  const Icon =
    entry.type === 'route' ? DEFAULT_CATEGORY_ICON : getCategoryIcon(iconHandle);
  return <Icon className="h-5 w-5 shrink-0 text-[#0c3c1f]" aria-hidden />;
}

export function MegaMenuPanel({ entries, onSelectCategory }: MegaMenuPanelProps) {
  const clickables = entries.filter((e) => e.type !== 'heading');
  const gridColsClass =
    clickables.length > 8 ? 'grid-cols-3' : clickables.length > 4 ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div
      className="w-[min(640px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-1 max-h-[min(70vh,520px)] overflow-y-auto"
      role="menu"
    >
      <div className={`grid gap-2 ${gridColsClass}`}>
        {entries.map((entry, index) => {
          if (entry.type === 'heading') {
            return (
              <p
                key={entryKey(entry, index)}
                className="col-span-full px-1 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#717182] first:pt-0"
              >
                {entry.label}
              </p>
            );
          }

          return (
            <button
              key={entryKey(entry, index)}
              type="button"
              role="menuitem"
              className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-left text-sm font-medium text-[#212121] transition-colors hover:bg-[#0c3c1f]/5 active:bg-[#0c3c1f]/10"
              onClick={() => onSelectCategory(entry)}
            >
              <EntryIcon entry={entry} />
              <span className="min-w-0 flex-1 leading-snug">{entry.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
