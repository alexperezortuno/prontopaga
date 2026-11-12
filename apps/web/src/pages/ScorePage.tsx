import type { ReactElement } from 'react';
import { ScoreConsultation } from '../components/ScoreConsultation';

export function ScorePage(): ReactElement {
  return (
    <main className="page-shell score-page">
      <ScoreConsultation />
      <p className="page-footnote">Los resultados son deterministas por RUT y representan una simulación técnica.</p>
    </main>
  );
}
