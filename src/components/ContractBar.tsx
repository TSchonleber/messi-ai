import { useState } from 'react'
import { CONTRACT_ADDRESS } from '../config'

export function ContractBar() {
  const [copied, setCopied] = useState(false)
  const ca = CONTRACT_ADDRESS

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ca)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="ca-bar">
      <span className="ca-label">⚽ Contract</span>
      {ca ? (
        <>
          <code className="ca-addr" title={ca}>{ca}</code>
          <button className="ca-copy" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <a
            className="ca-link"
            href={`https://pump.fun/coin/${ca}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            pump.fun ↗
          </a>
        </>
      ) : (
        <span className="ca-soon">drops here at launch — not live yet</span>
      )}
    </div>
  )
}
