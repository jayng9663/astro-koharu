import { LazyMotionProvider } from '@components/common/LazyMotionProvider';
import { useVndbData } from '@hooks/useVndbData';
import { useVndbSelection } from '@hooks/useVndbSelection';
import { useVndbShelf } from '@hooks/useVndbShelf';
import { VndbControls } from './VndbControls';
import { VndbDetailDialog } from './VndbDetailDialog';
import { VndbGrid } from './VndbGrid';
import { VndbPager } from './VndbPager';
import { VndbEmpty, VndbError, VndbLoading } from './VndbShelfStates';

interface VndbCollectionProps {
  userId: string;
  hideCoverAbove: number;
}

export function VndbCollection({ userId, hideCoverAbove }: VndbCollectionProps) {
  const { entries, stats, isLoading, error, retry } = useVndbData(userId);
  const shelf = useVndbShelf(entries);
  const selection = useVndbSelection(shelf.items);

  if (isLoading) return <VndbLoading />;
  if (error) return <VndbError onRetry={retry} />;
  if (shelf.items.length === 0) return <VndbEmpty />;

  return (
    <LazyMotionProvider>
      <div ref={shelf.shelfRef} className="bangumi-shelf space-y-5">
        <VndbControls
          activeFilter={shelf.activeFilter}
          filterCounts={shelf.filterCounts}
          onFilterChange={shelf.setFilter}
          stats={stats}
          sortKey={shelf.sortKey}
          sortDirection={shelf.sortDirection}
          onSortKeyChange={shelf.setSortKey}
          onSortDirectionToggle={shelf.toggleSortDirection}
        />
        <VndbGrid
          items={shelf.pageItems}
          viewKey={`${shelf.activeFilter}-${shelf.sortKey}-${shelf.sortDirection}-${shelf.currentPage}`}
          hideCoverAbove={hideCoverAbove}
          showStatus={shelf.activeFilter === 'all'}
          isRevealed={selection.isRevealed}
          onRevealedChange={selection.setRevealed}
          onOpen={selection.open}
        />
        <VndbPager currentPage={shelf.currentPage} totalPages={shelf.totalPages} onPageChange={shelf.goToPage} />
      </div>
      <VndbDetailDialog
        target={selection.selected}
        onClose={selection.close}
        hideCoverAbove={hideCoverAbove}
        coverRevealed={selection.selected ? selection.isRevealed(selection.selected.entry.id) : false}
        onCoverRevealedChange={(revealed) => selection.selected && selection.setRevealed(selection.selected.entry.id, revealed)}
      />
    </LazyMotionProvider>
  );
}
