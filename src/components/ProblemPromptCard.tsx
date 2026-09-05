import { facilityCategoryLabel } from "../data/facilityLabels";
import type { FacilityCategory } from "../types/facility";

export type ProblemPrompt = {
  category: FacilityCategory;
  affectedCount: number;
  totalCount: number;
  affectedPopulation: number;
};

export function ProblemPromptCard({
  prompt,
  onStartPlacement,
  onDismiss
}: {
  prompt: ProblemPrompt;
  onStartPlacement: (category: FacilityCategory) => void;
  onDismiss: () => void;
}) {
  const label = facilityCategoryLabel(prompt.category);
  return (
    <section className="panel problem-prompt-card" aria-live="polite">
      <div className="problem-prompt-topline">ここで困る人がいるかも</div>
      <h2>{label.problemSubject}が{prompt.affectedCount}か所、水の影響を受けそうです。</h2>
      {prompt.affectedPopulation > 0 ? (
        <p className="problem-population-highlight">
          約<strong>{formatPeople(prompt.affectedPopulation)}人</strong>が
          {label.shortName}を利用しにくくなる可能性があります。
        </p>
      ) : null}
      <p className="problem-question-text">{label.problemQuestion}</p>
      <div className="problem-actions">
        <button
          type="button"
          className="problem-primary-button"
          onClick={() => onStartPlacement(prompt.category)}
        >
          {label.placementCta}
        </button>
        <button type="button" className="problem-secondary-button" onClick={onDismiss}>
          あとで見る
        </button>
      </div>
    </section>
  );
}

function formatPeople(value: number) {
  return value.toLocaleString("ja-JP");
}
