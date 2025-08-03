import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialRecord } from "@/types/financial";
import { formatCurrency } from "@/config/currency";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface FinancialRatioAnalysisProps {
  records: FinancialRecord[];
  context: 'individual' | 'organization';
}

interface RatioData {
  id: string;
  name: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  status: 'good' | 'warning' | 'critical';
  description: string;
  historicalData: { date: string; value: number }[];
  benchmark?: number;
  industryAverage?: number;
}

const FinancialRatioAnalysis: React.FC<FinancialRatioAnalysisProps> = ({ records, context }) => {
  // Calculate financial ratios based on records
  const ratios = useMemo(() => {
    // Helper function to categorize records
    const categorizeRecords = () => {
      const categoryMap: Record<string, string[]> = {
        'income': ['income', 'revenue', 'sales', 'earnings'],
        'expense': ['expense', 'expenses', 'cost', 'spending'],
        'asset': ['asset', 'assets', 'current assets', 'fixed assets'],
        'liability': ['liability', 'liabilities', 'debt', 'loans'],
        'equity': ['equity', 'capital', 'owner equity', 'shareholder equity']
      };
      
      const result: Record<string, FinancialRecord[]> = {};
      
      Object.entries(categoryMap).forEach(([key, terms]) => {
        result[key] = records.filter(r => {
          const category = r.category.toLowerCase();
          return terms.some(term => category.includes(term));
        });
      });
      
      return result;
    };
    
    const categorizedRecords = categorizeRecords();
    
    // Calculate total values
    const calculateTotals = () => {
      const result: Record<string, number> = {};
      
      Object.entries(categorizedRecords).forEach(([key, records]) => {
        result[key] = records.reduce((sum, r) => sum + Math.abs(parseFloat(r.amount)), 0);
      });
      
      return result;
    };
    
    const totals = calculateTotals();
    
    // Generate historical data (last 6 months)
    const generateHistoricalData = (ratioFn: (date: Date) => number) => {
      const data = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
        
        data.push({
          date: monthStr,
          value: ratioFn(date)
        });
      }
      
      return data;
    };
    
    // Calculate trend based on historical data
    const calculateTrend = (data: { date: string; value: number }[]) => {
      if (data.length < 2) return 'stable';
      
      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      const percentChange = ((lastValue - firstValue) / firstValue) * 100;
      
      if (percentChange > 5) return 'increasing';
      if (percentChange < -5) return 'decreasing';
      return 'stable';
    };
    
    // Define ratios based on context
    if (context === 'individual') {
      // Individual financial ratios
      const debtToIncomeRatio = totals.liability / (totals.income || 1);
      const debtToIncomeHistorical = generateHistoricalData((date) => {
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        });
        
        const monthCategorized = {
          income: monthRecords.filter(r => r.category.toLowerCase().includes('income')),
          liability: monthRecords.filter(r => r.category.toLowerCase().includes('liability'))
        };
        
        const monthIncome = monthCategorized.income.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const monthLiability = monthCategorized.liability.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return monthLiability / (monthIncome || 1);
      });
      
      const savingsRate = (totals.income - totals.expense) / (totals.income || 1);
      const savingsRateHistorical = generateHistoricalData((date) => {
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        });
        
        const monthIncome = monthRecords
          .filter(r => r.category.toLowerCase().includes('income'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
          
        const monthExpense = monthRecords
          .filter(r => r.category.toLowerCase().includes('expense'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return (monthIncome - monthExpense) / (monthIncome || 1);
      });
      
      const emergencyFundRatio = totals.asset / (totals.expense / 6); // 6 months of expenses
      const emergencyFundHistorical = generateHistoricalData((date) => {
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        });
        
        const monthAssets = monthRecords
          .filter(r => r.category.toLowerCase().includes('asset'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
          
        const monthExpense = monthRecords
          .filter(r => r.category.toLowerCase().includes('expense'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return monthAssets / (monthExpense / 6);
      });
      
      return [
        {
          id: 'debt_to_income',
          name: 'Debt-to-Income Ratio',
          value: debtToIncomeRatio,
          trend: calculateTrend(debtToIncomeHistorical) as 'increasing' | 'decreasing' | 'stable',
          status: debtToIncomeRatio <= 0.36 ? 'good' : debtToIncomeRatio <= 0.43 ? 'warning' : 'critical',
          description: 'Measures the percentage of your income that goes toward paying debts. Lower is better.',
          historicalData: debtToIncomeHistorical,
          benchmark: 0.36, // 36% is often used as a good benchmark
          industryAverage: 0.4
        },
        {
          id: 'savings_rate',
          name: 'Savings Rate',
          value: savingsRate,
          trend: calculateTrend(savingsRateHistorical) as 'increasing' | 'decreasing' | 'stable',
          status: savingsRate >= 0.2 ? 'good' : savingsRate >= 0.1 ? 'warning' : 'critical',
          description: 'The percentage of income saved. Higher is better.',
          historicalData: savingsRateHistorical,
          benchmark: 0.2, // 20% is a good target
          industryAverage: 0.15
        },
        {
          id: 'emergency_fund_ratio',
          name: 'Emergency Fund Ratio',
          value: emergencyFundRatio,
          trend: calculateTrend(emergencyFundHistorical) as 'increasing' | 'decreasing' | 'stable',
          status: emergencyFundRatio >= 1 ? 'good' : emergencyFundRatio >= 0.5 ? 'warning' : 'critical',
          description: 'Measures how many months of expenses your emergency fund can cover. Higher is better.',
          historicalData: emergencyFundHistorical,
          benchmark: 1, // 6 months of expenses is the target
          industryAverage: 0.75
        }
      ];
    } else {
      // Organization financial ratios
      const currentRatio = totals.asset / (totals.liability || 1);
      const currentRatioHistorical = generateHistoricalData((date) => {
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        });
        
        const monthAssets = monthRecords
          .filter(r => r.category.toLowerCase().includes('asset'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
          
        const monthLiabilities = monthRecords
          .filter(r => r.category.toLowerCase().includes('liability'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return monthAssets / (monthLiabilities || 1);
      });
      
      const debtToEquityRatio = totals.liability / (totals.equity || 1);
      const debtToEquityHistorical = generateHistoricalData((date) => {
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        });
        
        const monthLiabilities = monthRecords
          .filter(r => r.category.toLowerCase().includes('liability'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
          
        const monthEquity = monthRecords
          .filter(r => r.category.toLowerCase().includes('equity'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return monthLiabilities / (monthEquity || 1);
      });
      
      const profitMargin = (totals.income - totals.expense) / (totals.income || 1);
      const profitMarginHistorical = generateHistoricalData((date) => {
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        });
        
        const monthIncome = monthRecords
          .filter(r => r.category.toLowerCase().includes('income'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
          
        const monthExpense = monthRecords
          .filter(r => r.category.toLowerCase().includes('expense'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return (monthIncome - monthExpense) / (monthIncome || 1);
      });
      
      const returnOnAssets = (totals.income - totals.expense) / (totals.asset || 1);
      const returnOnAssetsHistorical = generateHistoricalData((date) => {
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        });
        
        const monthIncome = monthRecords
          .filter(r => r.category.toLowerCase().includes('income'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
          
        const monthExpense = monthRecords
          .filter(r => r.category.toLowerCase().includes('expense'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
          
        const monthAssets = monthRecords
          .filter(r => r.category.toLowerCase().includes('asset'))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return (monthIncome - monthExpense) / (monthAssets || 1);
      });
      
      return [
        {
          id: 'current_ratio',
          name: 'Current Ratio',
          value: currentRatio,
          trend: calculateTrend(currentRatioHistorical) as 'increasing' | 'decreasing' | 'stable',
          status: currentRatio >= 2 ? 'good' : currentRatio >= 1 ? 'warning' : 'critical',
          description: 'Measures the ability to pay short-term obligations. Higher is better.',
          historicalData: currentRatioHistorical,
          benchmark: 2,
          industryAverage: 1.5
        },
        {
          id: 'debt_to_equity',
          name: 'Debt-to-Equity Ratio',
          value: debtToEquityRatio,
          trend: calculateTrend(debtToEquityHistorical) as 'increasing' | 'decreasing' | 'stable',
          status: debtToEquityRatio <= 1.5 ? 'good' : debtToEquityRatio <= 2 ? 'warning' : 'critical',
          description: 'Measures financial leverage. Lower indicates less risk.',
          historicalData: debtToEquityHistorical,
          benchmark: 1.5,
          industryAverage: 1.8
        },
        {
          id: 'profit_margin',
          name: 'Profit Margin',
          value: profitMargin,
          trend: calculateTrend(profitMarginHistorical) as 'increasing' | 'decreasing' | 'stable',
          status: profitMargin >= 0.15 ? 'good' : profitMargin >= 0.05 ? 'warning' : 'critical',
          description: 'Measures profitability as a percentage of revenue. Higher is better.',
          historicalData: profitMarginHistorical,
          benchmark: 0.15,
          industryAverage: 0.1
        },
        {
          id: 'return_on_assets',
          name: 'Return on Assets (ROA)',
          value: returnOnAssets,
          trend: calculateTrend(returnOnAssetsHistorical) as 'increasing' | 'decreasing' | 'stable',
          status: returnOnAssets >= 0.05 ? 'good' : returnOnAssets >= 0.02 ? 'warning' : 'critical',
          description: 'Measures how efficiently assets are being used to generate profit. Higher is better.',
          historicalData: returnOnAssetsHistorical,
          benchmark: 0.05,
          industryAverage: 0.035
        }
      ];
    }
  }, [records, context]);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            Value: <span className="font-bold">{payload[0].value.toFixed(2)}</span>
          </p>
          {payload[0].payload.benchmark && (
            <p className="text-sm text-blue-600">
              Benchmark: {payload[0].payload.benchmark.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Financial Ratio Analysis
        </CardTitle>
        <CardDescription>
          Key financial ratios to assess {context === 'individual' ? 'personal' : 'business'} financial health
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={ratios[0]?.id} className="w-full">
          <TabsList className="w-full flex overflow-auto">
            {ratios.map((ratio) => (
              <TabsTrigger key={ratio.id} value={ratio.id} className="flex-1">
                {ratio.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {ratios.map((ratio) => (
            <TabsContent key={ratio.id} value={ratio.id} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {ratio.value.toFixed(2)}
                      </div>
                      <Badge variant={ratio.status === 'good' ? 'default' : ratio.status === 'warning' ? 'outline' : 'destructive'}>
                        {ratio.status === 'good' ? (
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        ) : ratio.status === 'warning' ? (
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {ratio.status.charAt(0).toUpperCase() + ratio.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-medium">
                        {ratio.trend.charAt(0).toUpperCase() + ratio.trend.slice(1)}
                      </div>
                      {ratio.trend === 'increasing' ? (
                        <TrendingUp className={`h-5 w-5 ${ratio.id === 'debt_to_income' || ratio.id === 'debt_to_equity' ? 'text-red-500' : 'text-green-500'}`} />
                      ) : ratio.trend === 'decreasing' ? (
                        <TrendingDown className={`h-5 w-5 ${ratio.id === 'debt_to_income' || ratio.id === 'debt_to_equity' ? 'text-green-500' : 'text-red-500'}`} />
                      ) : (
                        <Activity className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Benchmark</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-medium">
                        {ratio.benchmark?.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Industry Avg: {ratio.industryAverage?.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Historical Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={ratio.historicalData.map(d => ({
                          ...d,
                          benchmark: ratio.benchmark,
                          industryAverage: ratio.industryAverage
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          name={ratio.name} 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                        {ratio.benchmark && (
                          <ReferenceLine 
                            y={ratio.benchmark} 
                            label="Benchmark" 
                            stroke="#0ea5e9" 
                            strokeDasharray="3 3" 
                          />
                        )}
                        {ratio.industryAverage && (
                          <ReferenceLine 
                            y={ratio.industryAverage} 
                            label="Industry Avg" 
                            stroke="#6b7280" 
                            strokeDasharray="3 3" 
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm">{ratio.description}</p>
                      <p className="text-sm mt-2">
                        {ratio.status === 'good' ? (
                          <span className="text-green-600 font-medium">
                            Your {ratio.name.toLowerCase()} is in good standing. 
                            {ratio.trend === 'increasing' && (ratio.id === 'debt_to_income' || ratio.id === 'debt_to_equity') ? 
                              'However, watch the increasing trend.' : 
                              ratio.trend === 'decreasing' && !(ratio.id === 'debt_to_income' || ratio.id === 'debt_to_equity') ? 
                                'However, watch the decreasing trend.' : 
                                'Keep up the good work!'}
                          </span>
                        ) : ratio.status === 'warning' ? (
                          <span className="text-amber-600 font-medium">
                            Your {ratio.name.toLowerCase()} needs attention. 
                            {ratio.trend === 'improving' ? 
                              'The trend is positive, but still needs improvement.' : 
                              'Consider taking steps to improve this ratio.'}
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Your {ratio.name.toLowerCase()} is at a critical level. 
                            Immediate action is recommended to improve this metric.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FinancialRatioAnalysis;