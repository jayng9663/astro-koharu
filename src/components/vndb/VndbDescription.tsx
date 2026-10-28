import { useTranslation } from '@hooks/useTranslation';
import type { DescriptionPart } from '@/lib/vndb/detail';

export function VndbDescription({ parts }: { parts: DescriptionPart[] }) {
  const { t } = useTranslation();
  if (parts.length === 0) return null;
  return (
    <section className="vndb-description" aria-label={t('vndb.detail.description')}>
      <h3>{t('vndb.detail.description')}</h3>
      <p>
        {parts.map((part, index) =>
          part.type === 'link' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are an ordered, static parse of one string
            <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">
              {part.text}
            </a>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are an ordered, static parse of one string
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
    </section>
  );
}
