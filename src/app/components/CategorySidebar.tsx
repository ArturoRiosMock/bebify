import { Link } from 'react-router-dom';
import type { CollectionItem } from '@/shopify/hooks/useShopifyCollections';
import { resolveCategorySidebar } from '@/config/category-catalog';
import { shouldRenderAdSlot, AdBanner } from '@/app/components/AdBanner';

interface CategorySidebarProps {
  collections: CollectionItem[];
  activeHandle?: string;
  activeTag?: string | null;
}

export function CategorySidebar({ collections, activeHandle, activeTag }: CategorySidebarProps) {
  const sections = resolveCategorySidebar(collections, activeHandle, activeTag);

  return (
    <div className="sticky top-4 space-y-6">
      <div>
        <h3 className="text-[#0c3c1f] font-bold mb-4 text-sm uppercase tracking-wide">
          Categorías
        </h3>
        <nav className="space-y-4">
          <Link
            to="/productos"
            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
              !activeHandle
                ? 'bg-[#0c3c1f] text-white font-medium'
                : 'text-[#212121] hover:bg-gray-100 hover:text-[#0c3c1f]'
            }`}
          >
            Todos los Productos
          </Link>

          {sections.map((section) => (
            <div key={section.id}>
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#717182]">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item, index) =>
                  item.kind === 'heading' ? (
                    <p
                      key={`${section.id}-h-${index}`}
                      className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]"
                    >
                      {item.label}
                    </p>
                  ) : (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                        item.active
                          ? 'bg-[#0c3c1f] text-white font-medium'
                          : 'text-[#212121] hover:bg-gray-100 hover:text-[#0c3c1f]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {shouldRenderAdSlot('collection-sidebar-skyscraper') && (
        <AdBanner slotId="collection-sidebar-skyscraper" variant="sidebar" />
      )}
    </div>
  );
}
