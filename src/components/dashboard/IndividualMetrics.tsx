import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinancialRecord } from "@/types/financial";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Percent,
  User,
  PiggyBank,
  CreditCard,
  Target,
  Activity,
  AlertCircle,
  CheckCircle2,
  Wallet
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from "@/config/currency";

interface IndividualMetricsProps {
  records: FinancialRecord[];
  comparisonData: {
    period1: FinancialRecord[];
    period2: FinancialRecord[];
  } | null;
  comparisonPeriods: {
    period1: { start: Date | null; end: Date | null; label: string };
    period2: { start: Date | null; end: Date | null; label: string };
  };
  comparisonMode: boolean;
}

const IndividualMetrics: React.FC<IndividualMetricsProps> = ({ records, comparisonData, comparisonPeriods, comparisonMode }) => {
  // Calculate individual-specific metrics
  const calculateMetrics = () => {
    const incomeRecords = records.filter(r => r.category.toLowerCase() === 'income');
    const expenseRecords = records.filter(r => r.category.toLowerCase() === 'expense');
    const assetRecords = records.filter(r => r.category.toLowerCase() === 'asset');
    const liabilityRecords = records.filter(r => r.category.toLowerCase() === 'liability');
    const investmentRecords = records.filter(r => r.category.toLowerCase().includes('investment'));
    
    const totalIncome = incomeRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalExpenses = expenseRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalAssets = assetRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalLiabilities = liabilityRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalInvestments = investmentRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    // Net Worth
    const netWorth = totalAssets - totalLiabilities;
    
    // Monthly Cash Flow
    const cashFlow = totalIncome - totalExpenses;
    
    // Savings Rate
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome * 100 : 0;
    
    // Emergency Fund Status
    const monthlyExpenses = totalExpenses / 12; // Assuming 12 months of data
    const emergencyFundNeeded = monthlyExpenses * 6; // 6 months of expenses
    const emergencyFundCurrent = totalAssets * 0.3; // Assuming 30% of assets are liquid emergency funds
    const emergencyFundRatio = emergencyFundNeeded > 0 ? emergencyFundCurrent / emergencyFundNeeded : 0;
    
    // Debt Metrics
    const debtToIncomeRatio = totalIncome > 0 ? totalLiabilities / totalIncome : 0;
    const debtServiceRatio = totalIncome > 0 ? (totalLiabilities * 0.05) / totalIncome : 0; // Assuming 5% monthly payment
    
    // Credit Score (placeholder)
    const creditScore = 720;
    
    // Investment Portfolio
    const investmentPerformance = 8.5; // Placeholder - annual return %
    const investmentDiversification = 65; // Placeholder - diversification score
    const investmentRisk = 'Moderate'; // Placeholder
    
    // Financial Goals (placeholders)
    const goals = [
      { name: 'Emergency Fund', target: emergencyFundNeeded, current: emergencyFundCurrent, progress: emergencyFundRatio * 100 },
      { name: 'House Down Payment', target: 50000, current: 15000, progress: 30 },
      { name: 'Retirement', target: 1000000, current: 250000, progress: 25 },
      { name: 'Debt Payoff', target: totalLiabilities, current: totalLiabilities * 0.7, progress: 30 }
    ];
    
    // Personal Financial Health Score (0-100)
    let healthScore = 0;
    
    // Savings component (0-25 points)
    if (savingsRate > 20) healthScore += 25;
    else if (savingsRate > 15) healthScore += 20;
    else if (savingsRate > 10) healthScore += 15;
    else if (savingsRate > 5) healthScore += 10;
    else if (savingsRate > 0) healthScore += 5;
    
    // Debt component (0-25 points)
    if (debtToIncomeRatio < 0.1) healthScore += 25;
    else if (debtToIncomeRatio < 0.2) healthScore += 20;
    else if (debtToIncomeRatio < 0.3) healthScore += 15;
    else if (debtToIncomeRatio < 0.4) healthScore += 10;
    else if (debtToIncomeRatio < 0.5) healthScore += 5;
    
    // Emergency fund component (0-25 points)
    if (emergencyFundRatio > 1) healthScore += 25;
    else if (emergencyFundRatio > 0.75) healthScore += 20;
    else if (emergencyFundRatio > 0.5) healthScore += 15;
    else if (emergencyFundRatio > 0.25) healthScore += 10;
    else if (emergencyFundRatio > 0) healthScore += 5;
    
    // Income stability component (0-25 points)
    // Using placeholder value for now
    healthScore += 20;
    
    // Expense Categories for Pie Chart
    const expenseCategories = expenseRecords.reduce((acc, record) => {
      const category = record.category.toLowerCase();
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += parseFloat(record.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const expenseCategoryData = Object.entries(expenseCategories).map(([name, value]) => ({
      name,
      value
    }));
    
    // Income Sources
    const incomeSources = incomeRecords.reduce((acc, record) => {
      const description = record.description.toLowerCase();
      if (!acc[description]) {
        acc[description] = 0;
      }
      acc[description] += parseFloat(record.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const topIncomeSources = Object.entries(incomeSources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));
    
    return {
      netWorth,
      totalIncome,
      totalExpenses,
      totalAssets,
      totalLiabilities,
      totalInvestments,
      cashFlow,
      savingsRate,
      emergencyFundRatio,
      emergencyFundCurrent,
      emergencyFundNeeded,
      debtToIncomeRatio,
      debtServiceRatio,
      creditScore,
      investmentPerformance,
      investmentDiversification,
      investmentRisk,
      goals,
      healthScore,
      expenseCategoryData,
      topIncomeSources
    };
  };

  const metrics = calculateMetrics();
  
  // Using the imported formatCurrency function from @/config/currency
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Generate cash flow data (placeholder)
  const cashFlowData = [
    { month: 'Jan', income: 5000, expenses: 3500, net: 1500 },
    { month: 'Feb', income: 5200, expenses: 3800, net: 1400 },
    { month: 'Mar', income: 5100, expenses: 3600, net: 1500 },
    { month: 'Apr', income: 5300, expenses: 3900, net: 1400 },
    { month: 'May', income: 5400, expenses: 3700, net: 1700 },
    { month: 'Jun', income: 5500, expenses: 3800, net: 1700 },
  ];
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FCCDE5', '#FB8072'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Financial Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Net Worth */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.netWorth)}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Assets</p>
                    <p className="font-medium">{formatCurrency(metrics.totalAssets)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Liabilities</p>
                    <p className="font-medium">{formatCurrency(metrics.totalLiabilities)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Investments</p>
                    <p className="font-medium">{formatCurrency(metrics.totalInvestments)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Income */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalIncome / 12)}</div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Annual: {formatCurrency(metrics.totalIncome)}</p>
                  <p className="text-sm font-medium mt-2">Top Income Sources:</p>
                  <div className="space-y-1 mt-1">
                    {metrics.topIncomeSources.map((source, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{source.name}</span>
                        <span>{formatCurrency(source.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Expenses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalExpenses / 12)}</div>
                <p className="text-xs text-muted-foreground">Annual: {formatCurrency(metrics.totalExpenses)}</p>
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {metrics.expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Cash Flow */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(metrics.cashFlow / 12)}</div>
                  <div className={`flex items-center ${metrics.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.cashFlow > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    <span>{formatPercentage(Math.abs(metrics.cashFlow / metrics.totalIncome * 100))}</span>
                  </div>
                </div>
                <div className="h-32 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
                      <Line type="monotone" dataKey="net" stroke="#3b82f6" name="Net" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Savings Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(metrics.savingsRate)}</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${metrics.savingsRate > 20 ? 'bg-green-600' : metrics.savingsRate > 10 ? 'bg-yellow-500' : 'bg-red-600'}`}
                    style={{ width: `${Math.min(metrics.savingsRate * 5, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.savingsRate > 20 ? "Excellent" : metrics.savingsRate > 10 ? "Good" : "Needs Improvement"}
                </p>
              </CardContent>
            </Card>
            
            {/* Emergency Fund */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Emergency Fund</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{(metrics.emergencyFundRatio * 6).toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">months</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${metrics.emergencyFundRatio >= 1 ? 'bg-green-600' : metrics.emergencyFundRatio >= 0.5 ? 'bg-yellow-500' : 'bg-red-600'}`}
                    style={{ width: `${Math.min(metrics.emergencyFundRatio * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-muted-foreground">Current: {formatCurrency(metrics.emergencyFundCurrent)}</span>
                  <span className="text-muted-foreground">Target: {formatCurrency(metrics.emergencyFundNeeded)}</span>
                </div>
                <div className="mt-2">
                  <Badge className={metrics.emergencyFundRatio >= 1 ? 'bg-green-100 text-green-800' : metrics.emergencyFundRatio >= 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                    {metrics.emergencyFundRatio >= 1 ? 'Fully Funded' : metrics.emergencyFundRatio >= 0.5 ? 'Partially Funded' : 'At Risk'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Debt Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Debt Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Debt-to-Income:</span>
                      <span className="font-medium">{formatPercentage(metrics.debtToIncomeRatio * 100)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${metrics.debtToIncomeRatio < 0.3 ? 'bg-green-600' : metrics.debtToIncomeRatio < 0.4 ? 'bg-yellow-500' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(metrics.debtToIncomeRatio * 250, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Debt Service Ratio:</span>
                      <span className="font-medium">{formatPercentage(metrics.debtServiceRatio * 100)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${metrics.debtServiceRatio < 0.28 ? 'bg-green-600' : metrics.debtServiceRatio < 0.36 ? 'bg-yellow-500' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(metrics.debtServiceRatio * 250, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Credit Score:</span>
                    <span className="font-medium">{metrics.creditScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Financial Goals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Financial Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.goals.map((goal, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm">
                        <span>{goal.name}:</span>
                        <span className="font-medium">{formatPercentage(goal.progress)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="h-1.5 rounded-full bg-blue-600"
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-0.5 text-muted-foreground">
                        <span>{formatCurrency(goal.current)}</span>
                        <span>{formatCurrency(goal.target)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Investment Portfolio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Investment Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Performance:</span>
                    <span className="font-medium text-green-600">+{metrics.investmentPerformance}%</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Diversification:</span>
                      <span className="font-medium">{metrics.investmentDiversification}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 rounded-full bg-purple-600"
                        style={{ width: `${metrics.investmentDiversification}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Risk Profile:</span>
                    <span className="font-medium">{metrics.investmentRisk}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Total Value:</span>
                    <span className="font-medium">{formatCurrency(metrics.totalInvestments)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Financial Health Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Financial Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-600">{metrics.healthScore}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className={`h-2.5 rounded-full ${metrics.healthScore > 70 ? 'bg-green-600' : metrics.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-600'}`}
                      style={{ width: `${metrics.healthScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics.healthScore > 70 ? "Excellent" : metrics.healthScore > 40 ? "Good" : "Needs Attention"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Personal Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.savingsRate < 10 && (
              <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                <h3 className="font-medium text-amber-800 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Low Savings Rate
                </h3>
                <p className="text-sm text-amber-700">
                  Your savings rate of {formatPercentage(metrics.savingsRate)} is below the recommended 10-20%. Consider reviewing your budget to find areas where you can reduce expenses.
                </p>
              </div>
            )}
            
            {metrics.emergencyFundRatio < 0.5 && (
              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <h3 className="font-medium text-red-800 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Emergency Fund at Risk
                </h3>
                <p className="text-sm text-red-700">
                  Your emergency fund covers only {(metrics.emergencyFundRatio * 6).toFixed(1)} months of expenses, below the recommended 6 months. Prioritize building this safety net.
                </p>
              </div>
            )}
            
            {metrics.debtToIncomeRatio > 0.4 && (
              <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                <h3 className="font-medium text-amber-800 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  High Debt-to-Income Ratio
                </h3>
                <p className="text-sm text-amber-700">
                  Your debt-to-income ratio of {formatPercentage(metrics.debtToIncomeRatio * 100)} is above the recommended 36%. Consider strategies to reduce debt or increase income.
                </p>
              </div>
            )}
            
            {metrics.cashFlow > 0 && metrics.savingsRate > 15 && (
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <h3 className="font-medium text-green-800 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Positive Cash Flow
                </h3>
                <p className="text-sm text-green-700">
                  You have a healthy positive cash flow with a savings rate of {formatPercentage(metrics.savingsRate)}. Consider allocating more to investments or accelerating debt payoff.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualMetrics;