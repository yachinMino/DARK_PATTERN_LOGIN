import type { Run } from '../game/engine'
import { formatElapsed } from '../game/scoring'
import type { GameAction } from '../game/types'

export function Result({ run, dispatch }: { run: Run; dispatch: (action: GameAction) => void }) {
  const record = run.records[0]
  if (!record) return null

  const metrics = [
    { label: 'クリア時間', value: formatElapsed(record.elapsedMs) },
    { label: '回避した仕掛け', value: `${record.avoided} / 30` },
    { label: '誤操作', value: `${record.mistakes}回` },
    { label: '不要な同意', value: `${record.consents}回` },
    { label: '使用したヒント', value: `${record.hints}件` },
    { label: 'リトライ', value: `${record.retries}回` },
  ]

  return (
    <section className="result-screen" aria-labelledby="result-title">
      <div className="result-header">
        <div className="result-tick" aria-hidden="true">✓</div>
        <div><p className="eyebrow">会員ページ</p><h1 id="result-title">ログインしました</h1></div>
      </div>
      <div className="result-body">
        <div className="grade-card"><span>総合評価</span><strong>{record.grade}</strong><span>{record.points} / 100点</span></div>
        <dl className="result-metrics">
          {metrics.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
        </dl>
      </div>
      <div className="result-actions">
        <p>今回のシード <code>{record.seed}</code></p>
        <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'replay' })}>別の構成で遊ぶ</button>
      </div>
      {run.records.length > 1 && (
        <details className="past-records">
          <summary>過去のクリア記録</summary>
          <ul>
            {run.records.slice(1).map((entry, index) => (
              <li key={`${entry.clearedAt}-${index}`}>
                <time dateTime={new Date(entry.clearedAt).toISOString()}>{new Date(entry.clearedAt).toLocaleDateString('ja-JP')}</time>
                <span>評価 {entry.grade}・{entry.points}点</span><span>{formatElapsed(entry.elapsedMs)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
