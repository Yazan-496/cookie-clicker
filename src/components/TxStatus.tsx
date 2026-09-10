import { explorerTxUrl, shortAddress } from '../lib/chain'
import type { BakeStatus } from '../hooks/useBake'

interface Props {
  status: BakeStatus
  label: string
  error: string | null
  signature: string | null
  onDismiss: () => void
}

export function TxStatus({ status, label, error, signature, onDismiss }: Props) {
  if (status === 'idle') return null

  const tone =
    status === 'error' ? 'error' : status === 'confirmed' ? 'success' : 'pending'

  return (
    <div className={`tx-status tx-${tone}`} role="status" aria-live="polite">
      <div className="tx-row">
        {tone === 'pending' && <span className="spinner" aria-hidden="true" />}
        <span className="tx-label">{error ?? label}</span>
        {(status === 'confirmed' || status === 'error') && (
          <button className="tx-close" onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        )}
      </div>

      {signature && (
        <a
          className="tx-link"
          href={explorerTxUrl(signature)}
          target="_blank"
          rel="noreferrer"
        >
          View {shortAddress(signature, 6)} on Cookiescan ↗
        </a>
      )}
    </div>
  )
}
