import { answers } from '../game/answers'
import { patterns, stageNames, stages, stepConfig } from '../game/config'
import type { Run } from '../game/engine'
import { steps } from '../game/types'
import type { PatternId } from '../game/types'
import './answerReview.css'

const orderedPatterns = steps.flatMap(step => patterns.filter(pattern => pattern.step === step))
const groups = stages.map(stage => ({
  stage,
  name: stageNames[stage],
  patterns: orderedPatterns.filter(pattern => stepConfig[pattern.step].stage === stage),
}))

const verdicts = {
  avoided: '回避済み',
  penalized: '減点対象',
  seen: '遭遇・回避未記録',
  unseen: '未遭遇',
}

function verdictFor(run: Run, pattern: PatternId): keyof typeof verdicts {
  if (run.avoided.includes(pattern)) return 'avoided'
  if (run.tainted.includes(pattern)) return 'penalized'
  return run.encountered.includes(pattern) ? 'seen' : 'unseen'
}

export function AnswerReview({ run }: { run: Run }) {
  const counts = { avoided: 0, penalized: 0, seen: 0, unseen: 0 }
  for (const pattern of patterns) counts[verdictFor(run, pattern.id)]++

  return (
    <section className="answer-review" aria-labelledby="answers">
      <header className="answer-header">
        <div>
          <p className="eyebrow">プレイ記録</p>
          <h1 id="answers">答え合わせ</h1>
          <p>30種類の仕掛けの見分け方と回避手順を確認できます。</p>
        </div>
        <a className="btn btn--subtle" href="#result-title">クリア結果に戻る</a>
      </header>
      <dl className="answer-counts" aria-label="今回のプレイの判定">
        {Object.entries(verdicts).map(([key, label]) => (
          <div key={key} data-verdict={key}><dt>{label}</dt><dd>{counts[key as keyof typeof counts]}件</dd></div>
        ))}
      </dl>
      <nav className="answer-nav" aria-label="ステージ別の答え">
        <ol>
          {groups.map(group => (
            <li key={group.stage}><a href={`#answers-stage-${group.stage}`}><span>{group.stage}</span>{group.name}</a></li>
          ))}
        </ol>
      </nav>
      {groups.map(group => (
        <section className="answer-stage" key={group.stage} aria-labelledby={`answers-stage-${group.stage}`}>
          <h2 id={`answers-stage-${group.stage}`} tabIndex={-1}><span>{group.stage}</span>{group.name}</h2>
          <div className="answer-grid">
            {group.patterns.map(pattern => {
              const answer = answers[pattern.id]
              const verdict = verdictFor(run, pattern.id)
              return (
                <article className="answer-card" key={pattern.id} aria-labelledby={`answer-title-${pattern.id}`}>
                  <header>
                    <h3 id={`answer-title-${pattern.id}`}><span>#{String(pattern.id).padStart(2, '0')}</span>{pattern.title}</h3>
                    <span className="answer-verdict" data-verdict={verdict}>{verdicts[verdict]}</span>
                  </header>
                  <dl>
                    <div><dt>見分け方</dt><dd>{answer.clue}</dd></div>
                    <div><dt>回避手順</dt><dd>{answer.solution}</dd></div>
                  </dl>
                </article>
              )
            })}
          </div>
        </section>
      ))}
      <a className="btn btn--subtle answer-top" href="#answers">答え合わせの先頭へ</a>
    </section>
  )
}
