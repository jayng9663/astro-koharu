import { useTranslation } from '@hooks/useTranslation';
import type { ReactNode } from 'react';
import type { TranslationKey } from '@/i18n/types';
import { VNDB_SITE_BASE } from '@/lib/vndb/constants';
import { formatPlayTime, listExternalLinks, listTitles, pickTags } from '@/lib/vndb/detail';
import { PLATFORM_LABELS } from '@/lib/vndb/platforms';
import { formatScore } from '@/lib/vndb/utils';
import type { VndbDetailResult, VndbProducer, VndbShelfItem } from '@/types/vndb';
import { STATUS_LABEL_KEYS } from './VndbCard';

const LENGTH_KEYS: Readonly<Record<number, TranslationKey>> = {
  1: 'vndb.detail.length1',
  2: 'vndb.detail.length2',
  3: 'vndb.detail.length3',
  4: 'vndb.detail.length4',
  5: 'vndb.detail.length5',
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function Producers({ producers }: { producers: VndbProducer[] }) {
  return producers.map((producer, index) => (
    <span key={producer.id}>
      {index > 0 && ', '}
      <a
        href={`${VNDB_SITE_BASE}/${producer.id}`}
        target="_blank"
        rel="noopener noreferrer"
        title={producer.original ?? undefined}
      >
        {producer.name}
      </a>
    </span>
  ));
}

interface VndbDetailFactsProps {
  item: VndbShelfItem;
  detail: VndbDetailResult;
  languageName: (code: string) => string;
}

/** The facts table: titles, dates, play time, credits, ratings, the visitor-visible list data, tags and links. */
export function VndbDetailFacts({ item, detail, languageName }: VndbDetailFactsProps) {
  const { t } = useTranslation();
  const { entry, status } = item;
  const { vn, publishers } = detail;

  const play = formatPlayTime(vn.length_minutes);
  const playText = play
    ? t(play.unit === 'hours' ? 'vndb.detail.hours' : 'vndb.detail.minutes', { n: play.value })
    : vn.length
      ? t(LENGTH_KEYS[vn.length])
      : null;
  const titles = listTitles(vn.titles);
  const tags = pickTags(vn.tags);
  const links = listExternalLinks(vn.extlinks);
  const devNote = vn.devstatus === 1 ? t('vndb.detail.devStatus1') : vn.devstatus === 2 ? t('vndb.detail.devStatus2') : null;

  return (
    <dl className="vndb-info">
      {titles.length > 0 && (
        <Row label={t('vndb.detail.titles')}>
          <ul className="vndb-titles">
            {titles.map((entryTitle) => (
              <li key={`${entryTitle.lang}-${entryTitle.title}`}>
                <span className="vndb-title-lang">{languageName(entryTitle.lang)}</span>
                <span>
                  {entryTitle.title}
                  {entryTitle.latin && entryTitle.latin !== entryTitle.title && (
                    <span className="vndb-title-sub">{entryTitle.latin}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Row>
      )}
      {vn.aliases.length > 0 && <Row label={t('vndb.detail.aliases')}>{vn.aliases.join(' / ')}</Row>}
      {vn.released && (
        <Row label={t('vndb.detail.released')}>
          {vn.released}
          {devNote && <span className="vndb-dev-note">{devNote}</span>}
        </Row>
      )}
      {playText && (
        <Row label={t('vndb.detail.playTime')}>
          {playText}
          {play && vn.length_votes > 0 && (
            <span className="vndb-title-latin">{t('vndb.detail.votes', { count: vn.length_votes })}</span>
          )}
        </Row>
      )}
      {vn.developers.length > 0 && (
        <Row label={t('vndb.detail.developers')}>
          <Producers producers={vn.developers} />
        </Row>
      )}
      {publishers.length > 0 && (
        <Row label={t('vndb.detail.publishers')}>
          <Producers producers={publishers} />
        </Row>
      )}
      {vn.languages.length > 0 && <Row label={t('vndb.detail.languages')}>{vn.languages.map(languageName).join(', ')}</Row>}
      {vn.platforms.length > 0 && (
        <Row label={t('vndb.detail.platforms')}>{vn.platforms.map((id) => PLATFORM_LABELS[id] ?? id).join(', ')}</Row>
      )}
      {vn.rating !== null && (
        <Row label={t('vndb.detail.rating')}>
          <span className="tabular-nums">
            ★ {formatScore(vn.rating)}
            {vn.votecount > 0 && <span className="vndb-title-latin">{t('vndb.detail.votes', { count: vn.votecount })}</span>}
          </span>
        </Row>
      )}
      {entry.vote !== null && (
        <Row label={t('vndb.detail.yourVote')}>
          <span className="bangumi-own-score tabular-nums">★ {formatScore(entry.vote)}</span>
        </Row>
      )}
      {status && <Row label={t('vndb.detail.status')}>{t(STATUS_LABEL_KEYS[status])}</Row>}
      {entry.started && <Row label={t('vndb.detail.startedOn')}>{entry.started}</Row>}
      {entry.finished && <Row label={t('vndb.detail.finishedOn')}>{entry.finished}</Row>}
      {tags.length > 0 && (
        <Row label={t('vndb.detail.tags')}>
          <ul className="vndb-chips">
            {tags.map((tag) => (
              <li key={tag.name} className="vndb-chip">
                {tag.name}
              </li>
            ))}
          </ul>
        </Row>
      )}
      {links.length > 0 && (
        <Row label={t('vndb.detail.links')}>
          <ul className="vndb-chips">
            {links.map((link) => (
              <li key={link.href}>
                <a className="vndb-chip vndb-chip-link" href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Row>
      )}
    </dl>
  );
}
