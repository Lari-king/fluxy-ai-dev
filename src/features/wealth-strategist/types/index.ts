// src/features/wealth-strategist/types/index.ts

export interface StrategyOptimization {
    id: string;
    title: string;
    description: string;
    impactLabel: string;
    type: 'savings' | 'investment' | 'arbitrage';
    color: 'blue' | 'green' | 'orange' | 'purple';
  }
  
  export interface WealthAnalysisResult {
    currentNetWorth: number;
    netSavings: number;
    investmentCapacity: number;
    savingsRate: number;
    liquidAssets: number;
  }