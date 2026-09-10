import { shortAddress } from '../lib/chain'
import { NIGHTLY_INSTALL_URL } from '../lib/nightly'

interface Props {
  address: string | null
  connecting: boolean
  installed: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function ConnectButton({
  address,
  connecting,
  installed,
  onConnect,
  onDisconnect,
}: Props) {
  if (!installed) {
    return (
      <a
        className="btn btn-ghost"
        href={NIGHTLY_INSTALL_URL}
        target="_blank"
        rel="noreferrer"
      >
        Install Nightly
      </a>
    )
  }

  if (address) {
    return (
      <button className="btn btn-ghost" onClick={onDisconnect} title={address}>
        <span className="dot" aria-hidden="true" />
        {shortAddress(address)}
      </button>
    )
  }

  return (
    <button className="btn btn-ghost" onClick={onConnect} disabled={connecting}>
      {connecting ? 'Connecting…' : 'Connect Nightly'}
    </button>
  )
}
