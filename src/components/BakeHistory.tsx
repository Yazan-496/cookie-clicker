import { explorerTxUrl, shortAddress } from '../lib/chain'
import type { BakeRecord } from '../hooks/useBake'

interface Props {
  records: BakeRecord[]
}

export function BakeHistory({ records }: Props) {
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
