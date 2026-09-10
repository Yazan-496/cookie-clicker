import { explorerTxUrl, shortAddress } from '../lib/chain'
import type { BakeRecord } from '../hooks/useBake'
import { Skeleton } from './Skeleton'

interface Props {
  records: BakeRecord[]
  loading?: boolean
}

export function BakeHistory({ records, loading }: Props) {
  if (loading && records.length === 0) {
    return (
      <section className="history">
        <h2 className="history-title">On-chain bakes</h2>
        <ul className="history-list" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <li className="history-item" key={index}>
              <Skeleton width="62px" height="0.9rem" />
              <Skeleton width="96px" height="0.8rem" />
            </li>
          ))}
        </ul>
      </section>
    )
  }

  if (records.length === 0) return null

  return (
    <section className="history">
      <h2 className="history-title">On-chain bakes</h2>
      <ul className="history-list">
        {records.map((record) => (
          <li key={record.signature} className="history-item">
            <span className="history-score">{record.score.toLocaleString()}</span>
            <a
              className="history-link"
              href={explorerTxUrl(record.signature)}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddress(record.signature, 6)} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
