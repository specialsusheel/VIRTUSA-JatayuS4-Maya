import { FinancialRecord } from "@/types/financial";
import { TimeSeriesForecaster } from "./forecasting";
import { formatCurrency } from "@/config/currency";

// AI Analysis Types
export interface AIInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'recommendation' | 'risk' | 'opportunity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  actionable: boolean;
  action?: string;
  category?: string;
  amount?: number;
  date?: string;
  context?: 'individual' | 'organization';
}

export interface SpendingPattern {
  category: string;
  averageAmount: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastOccurrence: string;
}

export interface AnomalyDetection {
  recordId: string;
  anomalyType: 'unusual_amount' | 'unusual_category' | 'unusual_timing' | 'duplicate_suspicion';
  confidence: number;
  explanation: string;
  suggestedAction?: string;
}

export interface FinancialHealth {
  debtToIncomeRatio: number;
  savingsRate: number;
  emergencyFundStatus: 'good' | 'warning' | 'critical';
  spendingEfficiency: number;
  riskLevel: 'low' | 'medium' | 'high';
  context: 'individual' | 'organization';
  // Organization-specific metrics
  cashFlowRatio?: number;
  workingCapitalRatio?: number;
  profitMargin?: number;
  expenseRatio?: number;
}

// Local AI Processing Functions
export class LocalAIAnalyzer {
  private records: FinancialRecord[] = [];
  private context: 'individual' | 'organization';

  constructor(records: FinancialRecord[], context: 'individual' | 'organization' = 'individual') {
    this.records = records;
    this.context = context;
  }

  // Anomaly Detection
  detectAnomalies(): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // Don't run anomaly detection if we have very little data
    if (this.records.length < 3) {
      return anomalies;
    }
    
    // Calculate spending patterns by category
    const categoryPatterns = this.calculateCategoryPatterns();
    
    this.records.forEach(record => {
      const amount = parseFloat(record.amount);
      const category = record.category.toLowerCase();
      
      // Check for unusual amounts - with smarter thresholds
      const categoryPattern = categoryPatterns[category];
      if (categoryPattern) {
        const avgAmount = categoryPattern.averageAmount;
        const stdDev = categoryPattern.standardDeviation;
        
        // Use different thresholds based on category and data size
        const categoryCount = this.records.filter(r => r.category.toLowerCase() === category).length;
        let threshold = 2; // Default 2 standard deviations
        
        // Adjust threshold based on category and data size
        if (categoryCount < 5) {
          threshold = 3; // More lenient for categories with few samples
        } else if (categoryCount > 20) {
          threshold = 1.5; // Stricter for well-sampled categories
        }
        
        // Special handling for core financial categories
        const coreFinancialCategories = ['income', 'expense', 'asset', 'liability'];
        const organizationalCategories = ['revenue', 'cost', 'asset', 'liability', 'equity', 'investment', 'operational_expense', 'capital_expense'];
        const isCoreCategory = this.context === 'individual' 
          ? coreFinancialCategories.includes(category)
          : organizationalCategories.includes(category);
        
        if (isCoreCategory && categoryCount < 3) {
          threshold = 4; // Very lenient for core categories with few samples
        }
        
        if (Math.abs(amount - avgAmount) > threshold * stdDev) {
          const deviation = Math.abs(amount - avgAmount) / stdDev;
          anomalies.push({
            recordId: record.id || '',
            anomalyType: 'unusual_amount',
            confidence: Math.min(0.9, 0.6 + (deviation - threshold) * 0.1),
            explanation: `Amount ${formatCurrency(amount)} is ${deviation.toFixed(1)}x the typical range for ${category} (avg: ${formatCurrency(avgAmount)})`,
            suggestedAction: 'Review this transaction for accuracy'
          });
        }
      }
      
      // Check for unusual categories - but be smarter about financial categories
      const userCategories = this.records.map(r => r.category.toLowerCase());
      const categoryFrequency = userCategories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Define core financial categories that are expected
      const coreFinancialCategories = ['income', 'expense', 'asset', 'liability'];
      const organizationalCategories = ['revenue', 'cost', 'asset', 'liability', 'equity', 'investment', 'operational_expense', 'capital_expense'];
      const isCoreCategory = this.context === 'individual' 
        ? coreFinancialCategories.includes(category)
        : organizationalCategories.includes(category);
      
      // Only flag as unusual if:
      // 1. It's not a core financial category AND has very low frequency
      // 2. It's a core category but has extremely low frequency (less than 5% of total records)
      const totalRecords = this.records.length;
      const categoryCount = categoryFrequency[category] || 0;
      const categoryPercentage = totalRecords > 0 ? (categoryCount / totalRecords) * 100 : 0;
      
      if (!isCoreCategory && categoryCount === 1) {
        // Non-core category with only one occurrence
        anomalies.push({
          recordId: record.id || '',
          anomalyType: 'unusual_category',
          confidence: 0.7,
          explanation: `Category "${category}" is rarely used. Consider if this is the correct category.`,
          suggestedAction: 'Verify this category is correct'
        });
      } else if (isCoreCategory && categoryPercentage < 5 && totalRecords > 10) {
        // Core category but very low percentage (might indicate data entry issues)
        anomalies.push({
          recordId: record.id || '',
          anomalyType: 'unusual_category',
          confidence: 0.5,
          explanation: `Category "${category}" represents only ${categoryPercentage.toFixed(1)}% of your transactions. This might be normal, but worth checking.`,
          suggestedAction: 'Review if this category distribution is expected'
        });
      }
    });
    
    return anomalies;
  }

  // Pattern Recognition
  analyzeSpendingPatterns(): SpendingPattern[] {
    const patterns: Record<string, SpendingPattern> = {};
    
    // Don't analyze patterns if we have very little data
    if (this.records.length < 3) {
      return [];
    }
    
 this.records.forEach(record => {
  const category = record.category.toLowerCase();
  const amount = parseFloat(record.amount);
const date = new Date(
  typeof record.date === 'bigint'
    ? Number(record.date / 1000000n) // 👈 divide BigInt to convert to ms
    : record.date
);

      
      if (!patterns[category]) {
        patterns[category] = {
          category,
          averageAmount: 0,
          frequency: 0,
          trend: 'stable',
          lastOccurrence: record.date
        };
      }
      
      patterns[category].frequency++;
      patterns[category].lastOccurrence = record.date;
    });
    
    // Calculate averages and trends
    Object.keys(patterns).forEach(category => {
      const categoryRecords = this.records.filter(r => r.category.toLowerCase() === category);
      const amounts = categoryRecords.map(r => parseFloat(r.amount));
      
      patterns[category].averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      
      // Simple trend analysis
      const sortedRecords = categoryRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortedRecords.length >= 3) {
        const recentAvg = sortedRecords.slice(-3).reduce((sum, r) => sum + parseFloat(r.amount), 0) / 3;
        const olderAvg = sortedRecords.slice(0, 3).reduce((sum, r) => sum + parseFloat(r.amount), 0) / 3;
        
        if (recentAvg > olderAvg * 1.1) patterns[category].trend = 'increasing';
        else if (recentAvg < olderAvg * 0.9) patterns[category].trend = 'decreasing';
      }
    });
    
    return Object.values(patterns);
  }

  // Financial Health Assessment
  assessFinancialHealth(): FinancialHealth {
    if (this.context === 'individual') {
      return this.assessIndividualFinancialHealth();
    } else {
      return this.assessOrganizationalFinancialHealth();
    }
  }

  private assessIndividualFinancialHealth(): FinancialHealth {
    const incomeRecords = this.records.filter(r => r.category.toLowerCase() === 'income');
    const expenseRecords = this.records.filter(r => r.category.toLowerCase() === 'expense');
    const liabilityRecords = this.records.filter(r => r.category.toLowerCase() === 'liability');
    
    const totalIncome = incomeRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalExpenses = expenseRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalLiabilities = liabilityRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    // Handle edge cases where we don't have enough data
    if (this.records.length < 3) {
      return {
        debtToIncomeRatio: 0,
        savingsRate: 0,
        emergencyFundStatus: 'good',
        spendingEfficiency: 0,
        riskLevel: 'low',
        context: 'individual'
      };
    }
    
    const debtToIncomeRatio = totalIncome > 0 ? totalLiabilities / totalIncome : 0;
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
    
    // Emergency fund assessment (3 months of expenses)
    const monthlyExpenses = totalExpenses / 12; // Assuming 12 months of data
    const emergencyFundNeeded = monthlyExpenses * 3;
    const currentSavings = totalIncome - totalExpenses;
    
    let emergencyFundStatus: 'good' | 'warning' | 'critical' = 'good';
    if (currentSavings < emergencyFundNeeded * 0.5) emergencyFundStatus = 'critical';
    else if (currentSavings < emergencyFundNeeded) emergencyFundStatus = 'warning';
    
    // Spending efficiency (lower is better)
    const spendingEfficiency = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    
    // Risk level assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Calculate risk based on multiple factors, not just emergency fund
    let riskFactors = 0;
    
    // Count risk factors
    if (debtToIncomeRatio > 0.4) riskFactors += 2;
    else if (debtToIncomeRatio > 0.2) riskFactors += 1;
    
    if (savingsRate < 0.05) riskFactors += 2;
    else if (savingsRate < 0.1) riskFactors += 1;
    
    if (spendingEfficiency > 90) riskFactors += 2;
    else if (spendingEfficiency > 80) riskFactors += 1;
    
    // Set risk level based on number of risk factors
    if (riskFactors >= 3) riskLevel = 'high';
    else if (riskFactors >= 1) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Ensure emergency fund status and risk level are consistent
    if (emergencyFundStatus === 'good' && riskLevel === 'high') {
      // If emergency fund is good but other factors indicate high risk,
      // adjust to medium risk at most
      riskLevel = 'medium';
    } else if (emergencyFundStatus === 'critical' && riskLevel === 'low') {
      // If emergency fund is critical but other factors indicate low risk,
      // adjust to medium risk at least
      riskLevel = 'medium';
    }
    
    return {
      debtToIncomeRatio,
      savingsRate,
      emergencyFundStatus,
      spendingEfficiency,
      riskLevel,
      context: 'individual'
    };
  }

  private assessOrganizationalFinancialHealth(): FinancialHealth {
    // Use a more flexible approach to categorization for organizational context
    // Map various possible category names to standardized types
    const categoryMap: Record<string, string[]> = {
      'revenue': ['revenue', 'income', 'sales', 'earnings'],
      'cost': ['cost', 'expense', 'expenses', 'spending', 'cost of goods sold', 'cogs'],
      'asset': ['asset', 'assets', 'current assets', 'fixed assets', 'investments'],
      'liability': ['liability', 'liabilities', 'debt', 'loans', 'accounts payable'],
      'operational_expense': ['operational expense', 'operational_expense', 'opex', 'operating expense', 'overhead'],
      'capital_expense': ['capital expense', 'capital_expense', 'capex', 'capital expenditure']
    };
    
    // Helper function to categorize records based on the mapping
    const categorizeRecords = (type: string) => {
      return this.records.filter(r => {
        const category = r.category.toLowerCase();
        return categoryMap[type].some(term => category.includes(term));
      });
    };
    
    const revenueRecords = categorizeRecords('revenue');
    const costRecords = categorizeRecords('cost');
    const assetRecords = categorizeRecords('asset');
    const liabilityRecords = categorizeRecords('liability');
    const operationalExpenseRecords = categorizeRecords('operational_expense');
    const capitalExpenseRecords = categorizeRecords('capital_expense');
    
    const totalRevenue = revenueRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalCosts = costRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalAssets = assetRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalLiabilities = liabilityRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalOperationalExpenses = operationalExpenseRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalCapitalExpenses = capitalExpenseRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    // If we have very limited data, use fallback values that are more realistic than zeros
    const hasSufficientData = this.records.length >= 3;
    
    // Default values based on typical business ratios if we don't have enough data
    const defaultProfitMargin = 0.05; // 5% profit margin
    const defaultExpenseRatio = 0.85; // 85% expense ratio
    const defaultCashFlowRatio = 1.2; // 1.2:1 cash flow ratio
    const defaultWorkingCapitalRatio = 0.15; // 15% working capital ratio
    
    // Use actual data if available, otherwise use reasonable defaults
    const profitMargin = hasSufficientData && totalRevenue > 0 ? 
      (totalRevenue - totalCosts) / totalRevenue * 100 : defaultProfitMargin * 100;
      
    const expenseRatio = hasSufficientData && totalRevenue > 0 ? 
      totalCosts / totalRevenue * 100 : defaultExpenseRatio * 100;
      
    const cashFlowRatio = hasSufficientData && totalLiabilities > 0 ? 
      totalAssets / totalLiabilities : defaultCashFlowRatio;
      
    const workingCapitalRatio = hasSufficientData && totalAssets > 0 ? 
      (totalAssets - totalLiabilities) / totalAssets * 100 : defaultWorkingCapitalRatio * 100;
    
    // Organizational metrics - already calculated above with fallbacks
    const netIncome = totalRevenue - totalCosts;
    
    // Debt-to-income ratio (using revenue as income for organizations)
    const debtToIncomeRatio = hasSufficientData && totalRevenue > 0 ? 
      totalLiabilities / totalRevenue : 0.4; // Default to 40% if insufficient data
    
    // Savings rate (profit margin for organizations)
    const savingsRate = hasSufficientData && totalRevenue > 0 ? 
      (netIncome / totalRevenue) : defaultProfitMargin;
    
    // Emergency fund status (cash reserves for organizations)
    const monthlyExpenses = (totalOperationalExpenses + totalCapitalExpenses) / 12;
    const emergencyFundNeeded = monthlyExpenses * 3;
    const currentCashReserves = totalAssets - totalLiabilities;
    
    let emergencyFundStatus: 'good' | 'warning' | 'critical' = 'good';
    if (currentCashReserves < emergencyFundNeeded * 0.5) emergencyFundStatus = 'critical';
    else if (currentCashReserves < emergencyFundNeeded) emergencyFundStatus = 'warning';
    
    // Spending efficiency (operational efficiency for organizations)
    const spendingEfficiency = totalRevenue > 0 ? (totalCosts / totalRevenue) * 100 : 0;
    
    // Risk level assessment for organizations
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Calculate risk based on multiple factors, not just emergency fund
    let riskFactors = 0;
    
    // Count risk factors
    if (debtToIncomeRatio > 0.6) riskFactors += 2;
    else if (debtToIncomeRatio > 0.4) riskFactors += 1;
    
    if (profitMargin < 0) riskFactors += 2;
    else if (profitMargin < 0.1) riskFactors += 1;
    
    if (workingCapitalRatio < 0) riskFactors += 2;
    else if (workingCapitalRatio < 10) riskFactors += 1;
    
    if (cashFlowRatio < 1) riskFactors += 2;
    else if (cashFlowRatio < 1.5) riskFactors += 1;
    
    // Set risk level based on number of risk factors
    if (riskFactors >= 4) riskLevel = 'high';
    else if (riskFactors >= 2) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Ensure emergency fund status and risk level are consistent
    if (emergencyFundStatus === 'good' && riskLevel === 'high') {
      // If emergency fund is good but other factors indicate high risk,
      // adjust to medium risk at most
      riskLevel = 'medium';
    } else if (emergencyFundStatus === 'critical' && riskLevel === 'low') {
      // If emergency fund is critical but other factors indicate low risk,
      // adjust to medium risk at least
      riskLevel = 'medium';
    }
    
    return {
      debtToIncomeRatio,
      savingsRate,
      emergencyFundStatus,
      spendingEfficiency,
      riskLevel,
      context: 'organization',
      cashFlowRatio,
      workingCapitalRatio,
      profitMargin,
      expenseRatio
    };
  }

  // Generate AI Insights
  generateInsights(): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Don't generate insights if we have very little data
    if (this.records.length < 5) {
      return insights;
    }
    
    const anomalies = this.detectAnomalies();
    const patterns = this.analyzeSpendingPatterns();
    const health = this.assessFinancialHealth();
    
    // Anomaly insights
    anomalies.forEach(anomaly => {
      insights.push({
        id: `anomaly-${anomaly.recordId}`,
        type: 'anomaly',
        title: 'Unusual Transaction Detected',
        description: anomaly.explanation,
        severity: anomaly.confidence > 0.8 ? 'high' : anomaly.confidence > 0.6 ? 'medium' : 'low',
        confidence: anomaly.confidence,
        actionable: true,
        action: anomaly.suggestedAction
      });
    });
    
    // Pattern insights - only for significant patterns
    patterns.forEach(pattern => {
      // Only show insights for categories with meaningful data
      if (pattern.frequency >= 3 && pattern.trend === 'increasing') {
        // Calculate the percentage of total transactions this category represents
        const categoryPercentage = (pattern.frequency / this.records.length) * 100;
        
        // Only flag if it's a significant portion of spending or if it's a core category
        const coreFinancialCategories = ['income', 'expense', 'asset', 'liability'];
        const organizationalCategories = ['revenue', 'cost', 'asset', 'liability', 'equity', 'investment', 'operational_expense', 'capital_expense'];
        const isCoreCategory = this.context === 'individual' 
          ? coreFinancialCategories.includes(pattern.category)
          : organizationalCategories.includes(pattern.category);
        
        if (categoryPercentage > 10 || isCoreCategory) {
          insights.push({
            id: `trend-${pattern.category}`,
            type: 'trend',
            title: `Spending on ${pattern.category} is increasing`,
            description: `Your ${pattern.category} spending shows an increasing trend (${pattern.frequency} transactions). Consider reviewing your budget.`,
            severity: 'medium',
            confidence: 0.7,
            actionable: true,
            action: 'Review budget for this category',
            category: pattern.category
          });
        }
      }
    });
    
    // Financial health insights - context-specific
    if (health.context === 'individual') {
      if (health.riskLevel === 'high') {
        insights.push({
          id: 'risk-high',
          type: 'risk',
          title: 'High Financial Risk Detected',
          description: `Your debt-to-income ratio is ${(health.debtToIncomeRatio * 100).toFixed(1)}% and emergency fund status is ${health.emergencyFundStatus}.`,
          severity: 'high',
          confidence: 0.9,
          actionable: true,
          action: 'Consider reducing expenses and building emergency fund',
          context: 'individual'
        });
      }
      
      if (health.savingsRate < 0.1) {
        insights.push({
          id: 'savings-low',
          type: 'opportunity',
          title: 'Low Savings Rate',
          description: `Your savings rate is ${(health.savingsRate * 100).toFixed(1)}%. Aim for at least 10-20% for financial security.`,
          severity: 'medium',
          confidence: 0.8,
          actionable: true,
          action: 'Increase savings by reducing non-essential expenses',
          context: 'individual'
        });
      }
    } else {
      // Organizational insights
      if (health.riskLevel === 'high') {
        insights.push({
          id: 'org-risk-high',
          type: 'risk',
          title: 'High Organizational Risk Detected',
          description: `Your debt-to-revenue ratio is ${(health.debtToIncomeRatio * 100).toFixed(1)}% and cash reserves status is ${health.emergencyFundStatus}.`,
          severity: 'high',
          confidence: 0.9,
          actionable: true,
          action: 'Review operational costs and improve cash flow management',
          context: 'organization'
        });
      }
      
      if (health.profitMargin && health.profitMargin < 0.1) {
        insights.push({
          id: 'org-profit-low',
          type: 'opportunity',
          title: 'Low Profit Margin',
          description: `Your profit margin is ${health.profitMargin.toFixed(1)}%. Consider optimizing costs and increasing revenue.`,
          severity: 'medium',
          confidence: 0.8,
          actionable: true,
          action: 'Review pricing strategy and operational efficiency',
          context: 'organization'
        });
      }
      
      if (health.cashFlowRatio && health.cashFlowRatio < 1.5) {
        insights.push({
          id: 'org-cashflow-low',
          type: 'risk',
          title: 'Low Cash Flow Ratio',
          description: `Your cash flow ratio is ${health.cashFlowRatio.toFixed(2)}. Aim for at least 1.5 for healthy operations.`,
          severity: 'medium',
          confidence: 0.7,
          actionable: true,
          action: 'Improve working capital management',
          context: 'organization'
        });
      }
    }
    
    return insights;
  }

  // Enhanced Cash Flow Prediction with Time Series Forecasting
  predictCashFlow(months: number = 3): { month: string; predictedIncome: number; predictedExpenses: number; netCashFlow: number }[] {
    const predictions = [];
    
    // Use enhanced forecasting if we have enough data
    if (this.records.length >= 3) {
      const forecaster = new TimeSeriesForecaster(this.records);
      const forecast = forecaster.generateForecast(months);
      
      return forecast.forecast.map(point => ({
        month: new Date(point.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        predictedIncome: point.income,
        predictedExpenses: point.expenses,
        netCashFlow: point.netCashFlow
      }));
    }
    
    // Fallback to simple prediction for limited data
    // If no records, use default values that match the scale of ₹14,75,950.00
    const avgMonthlyIncome = this.records.length > 0 ?
      this.records
        .filter(r => r.category.toLowerCase() === 'income')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0) / 12 : 1475950;
    
    const avgMonthlyExpenses = this.records.length > 0 ?
      this.records
        .filter(r => r.category.toLowerCase() === 'expense')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0) / 12 : 1055766;
    
    for (let i = 1; i <= months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      predictions.push({
        month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        predictedIncome: avgMonthlyIncome,
        predictedExpenses: avgMonthlyExpenses,
        netCashFlow: avgMonthlyIncome - avgMonthlyExpenses
      });
    }
    
    return predictions;
  }

  private calculateCategoryPatterns(): Record<string, { averageAmount: number; standardDeviation: number }> {
    const patterns: Record<string, { amounts: number[] }> = {};
    
    this.records.forEach(record => {
      const category = record.category.toLowerCase();
      const amount = parseFloat(record.amount);
      
      if (!patterns[category]) {
        patterns[category] = { amounts: [] };
      }
      
      patterns[category].amounts.push(amount);
    });
    
    const result: Record<string, { averageAmount: number; standardDeviation: number }> = {};
    
    Object.keys(patterns).forEach(category => {
      const amounts = patterns[category].amounts;
      const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length;
      const standardDeviation = Math.sqrt(variance);
      
      result[category] = { averageAmount: average, standardDeviation };
    });
    
    return result;
  }
}

// Utility function to create AI analyzer
export const createAIAnalyzer = (records: FinancialRecord[], context: 'individual' | 'organization' = 'individual') => {
  return new LocalAIAnalyzer(records, context);
};