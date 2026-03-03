// src/features/wealth-strategist/utils/projections.ts

interface ProjectionPoint {
    month: string;
    patrimoine: number;
    investi: number;
    label: string;
  }
  
  export function calculateWealthProjection(
    currentNetWorth: number,
    monthlyInvestment: number,
    annualReturn: number = 0.08, // 8% par défaut (bourse/PE)
    years: number = 10
  ): ProjectionPoint[] {
    const points: ProjectionPoint[] = [];
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    
    let total = currentNetWorth;
    let cumulatedInvested = currentNetWorth;
  
    const now = new Date();
  
    for (let m = 0; m <= years * 12; m++) {
      const projectionDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      
      // On n'ajoute l'épargne qu'à partir du mois 1
      if (m > 0) {
        total = total * (1 + monthlyReturn) + monthlyInvestment;
        cumulatedInvested += monthlyInvestment;
      }
  
      // On ne garde qu'un point par trimestre pour le graphique pour plus de clarté
      if (m % 3 === 0) {
        points.push({
          month: projectionDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          patrimoine: Math.round(total),
          investi: Math.round(cumulatedInvested),
          label: `Année ${Math.floor(m / 12)}`
        });
      }
    }
  
    return points;
  }