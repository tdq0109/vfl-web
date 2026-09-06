'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/* Điều hướng trang. `page` đếm từ 1. Chỉ một trang thì không hiện gì. */
interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const t = useT();

  if (pageCount <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 text-sm text-muted',
        className,
      )}
    >
      <span>{t('nen.trang', { trang: page, tong: pageCount })}</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('action.truoc')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          {t('action.sau')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
