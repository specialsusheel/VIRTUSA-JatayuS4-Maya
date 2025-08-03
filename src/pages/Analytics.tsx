import React, { useState, useMemo } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/config/currency";
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Lightbulb, 
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  PieChart,
  Building2,
  User,
  Activity,
  Calculator
} from "lucide-react";
import ContextSelector from "@/components/dashboard/ContextSelector";
import OrganizationMetrics from "@/components/dashboard/OrganizationMetrics";
import IndividualMetrics from "@/components/dashboard/IndividualMetrics";
import CashFlowForecastChart from "@/components/analytics/CashFlowForecastChart";
import FinancialRatioAnalysis from "@/components/analytics/FinancialRatioAnalysis";
import CashFlowManagement from "@/components/analytics/CashFlowManagement";
import StrategicFinancialPlanning from "@/components/analytics/StrategicFinancialPlanning";
import BudgetVsActualAnalysis from "@/components/analytics/BudgetVsActualAnalysis";
import TaxPlanningOptimization from "@/components/analytics/TaxPlanningOptimization";
import { createAIAnalyzer } from "@/utils/ai";
import DateRangeFilter from "@/components/dashboard/DateRangeFilter";
import { ForecastPoint } from "@/utils/forecasting";
import ExpenseDistributionChart from "@/components/dashboard/ExpenseDistributionChart";

const Analytics: React.FC = () => {
  const { records } = useBlockchain();
  const [activeTab, setActiveTab] = useState("metrics");
  const [context, setContext] = useState<'individual' | 'organization'>('individual');
  
  // Date range and comparison state
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriods, setComparisonPeriods] = useState<{
    period1: { start: Date | null; end: Date | null; label: string };
    period2: { start: Date | null; end: Date | null; label: string };
  }>({
    period1: { start: null, end: null, label: "This Month" },
    period2: { start: null, end: null, label: "Last Month" },
  });

  // Filter records based on date range
  const filteredRecords = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return records;
    
    return records.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= dateRange.startDate! && recordDate <= dateRange.endDate!;
    });
  }, [records, dateRange]);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (!comparisonMode) return null;

    const period1Records = records.filter((record) => {
      const recordDate = new Date(record.date);
      return comparisonPeriods.period1.start && comparisonPeriods.period1.end &&
             recordDate >= comparisonPeriods.period1.start && recordDate <= comparisonPeriods.period1.end;
    });

    const period2Records = records.filter((record) => {
      const recordDate = new Date(record.date);
      return comparisonPeriods.period2.start && comparisonPeriods.period2.end &&
             recordDate >= comparisonPeriods.period2.start && recordDate <= comparisonPeriods.period2.end;
    });

    return {
      period1: period1Records,
      period2: period2Records,
    };
  }, [records, comparisonMode, comparisonPeriods]);

  const aiAnalyzer = createAIAnalyzer(filteredRecords, context);
  const insights = aiAnalyzer?.generateInsights() || [];
  const health = aiAnalyzer?.assessFinancialHealth() || { profitMargin: null, cashFlowRatio: null, workingCapitalRatio: null, debtToIncomeRatio: null, savingsRate: null, emergencyFundStatus: null };
  const patterns = aiAnalyzer?.analyzeSpendingPatterns() || { categories: [] };
  const anomalies = aiAnalyzer?.detectAnomalies() || [];
  const cashFlowPrediction = aiAnalyzer?.predictCashFlow(6) || [];
  
  // Generate historical data for the chart
  const historicalData = useMemo(() => {
    // Group records by month
    const monthlyData: Record<string, { income: number; expenses: number; netCashFlow: number }> = {};
    
    // Get the last 6 months for historical data
    const now = new Date();
    for (let i = 6; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      monthlyData[monthKey] = { income: 0, expenses: 0, netCashFlow: 0 };
    }
    
    // Aggregate records by month
    filteredRecords.forEach(record => {
      const recordDate = record.date.substring(0, 7); // YYYY-MM format
      if (monthlyData[recordDate]) {
        const amount = parseFloat(record.amount);
        const category = record.category.toLowerCase();
        
        if (category === 'income' || amount > 0) {
          monthlyData[recordDate].income += Math.abs(amount);
        } else if (category === 'expense' || amount < 0) {
          monthlyData[recordDate].expenses += Math.abs(amount);
        }
      }
    });
    
    // Calculate net cash flow and convert to array of ForecastPoint
    return Object.entries(monthlyData).map(([date, data]) => {
      const netCashFlow = data.income - data.expenses;
      return {
        date,
        income: data.income,
        expenses: data.expenses,
        netCashFlow,
        confidence: 1.0 // Historical data has 100% confidence
      } as ForecastPoint;
    });
  }, [filteredRecords]);

  const getHealthScore = () => {
    let score = 70; // Start with a neutral score
    
    // Adjust score based on context-specific metrics
    if (context === 'organization') {
      // Organization-specific metrics
      if (health.profitMargin && health.profitMargin < 0) score -= 25;
      else if (health.profitMargin && health.profitMargin < 5) score -= 15;
      else if (health.profitMargin && health.profitMargin > 15) score += 15;
      
      if (health.cashFlowRatio && health.cashFlowRatio < 1) score -= 20;
      else if (health.cashFlowRatio && health.cashFlowRatio > 2) score += 10;
      
      if (health.workingCapitalRatio && health.workingCapitalRatio < 1) score -= 15;
      else if (health.workingCapitalRatio && health.workingCapitalRatio > 2) score += 10;
    } else {
      // Individual-specific metrics
      if (health.debtToIncomeRatio && health.debtToIncomeRatio > 0.43) score -= 25;
      else if (health.debtToIncomeRatio && health.debtToIncomeRatio > 0.36) score -= 15;
      else if (health.debtToIncomeRatio && health.debtToIncomeRatio < 0.25) score += 15;
      
      if (health.savingsRate && health.savingsRate < 0.1) score -= 20;
      else if (health.savingsRate && health.savingsRate > 0.2) score += 15;
      
      if (health.emergencyFundStatus && health.emergencyFundStatus < 3) score -= 15;
      else if (health.emergencyFundStatus && health.emergencyFundStatus > 6) score += 10;
    }
    
    // Cap the score between 0 and 100
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = getHealthScore();
  const healthStatus = healthScore >= 70 ? "Good" : healthScore >= 40 ? "Moderate" : "Poor";
  const healthColor = healthScore >= 70 ? "text-green-500" : healthScore >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Detailed financial metrics and insights for data-driven decisions
            </p>
          </div>
          
          {/* Context Selector */}
          <ContextSelector 
            context={context}
            onContextChange={setContext}
            recordCount={filteredRecords.length}
          />
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangeFilter
              dateRange={dateRange}
              setDateRange={setDateRange}
              comparisonMode={comparisonMode}
              setComparisonMode={setComparisonMode}
              comparisonPeriods={comparisonPeriods}
              setComparisonPeriods={setComparisonPeriods}
            />
          </CardContent>
        </Card>

        {/* Health Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium">
                {context === 'organization' ? 'Business Health Score' : 'Financial Health Score'}
              </CardTitle>
              <Badge variant={healthScore >= 70 ? "success" : healthScore >= 40 ? "warning" : "destructive"}>
                {healthStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {context === 'organization' ? (
                  <Building2 className={`h-8 w-8 mr-3 ${healthColor}`} />
                ) : (
                  <User className={`h-8 w-8 mr-3 ${healthColor}`} />
                )}
                <div>
                  <p className={`text-3xl font-bold ${healthColor}`}>{healthScore}</p>
                  <p className="text-sm text-muted-foreground">
                    {context === 'organization' 
                      ? 'Based on profitability, cash flow, and capital efficiency' 
                      : 'Based on debt, savings, and emergency fund status'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {context === 'organization' 
                    ? `${health.profitMargin ? Math.round(health.profitMargin * 100) : 'N/A'}% Profit Margin` 
                    : `${health.savingsRate ? Math.round(health.savingsRate * 100) : 'N/A'}% Savings Rate`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {context === 'organization'
                    ? `${health.cashFlowRatio ? health.cashFlowRatio.toFixed(2) : 'N/A'} Cash Flow Ratio`
                    : `${health.debtToIncomeRatio ? Math.round(health.debtToIncomeRatio * 100) : 'N/A'}% Debt-to-Income`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="metrics" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailed Metrics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="forecasts" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Forecasts & Trends
            </TabsTrigger>
          </TabsList>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            {context === 'organization' ? (
              <OrganizationMetrics 
                records={filteredRecords} 
                comparisonData={comparisonData}
                comparisonPeriods={comparisonPeriods}
                comparisonMode={comparisonMode}
              />
            ) : (
              <IndividualMetrics 
                records={filteredRecords} 
                comparisonData={comparisonData}
                comparisonPeriods={comparisonPeriods}
                comparisonMode={comparisonMode}
              />
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Financial Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights && insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        {insight.type === 'risk' ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : insight.type === 'opportunity' ? (
                          <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{insight.title}</p>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No insights available with current data.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending Pattern Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patterns && patterns.categories && patterns.categories.length > 0 ? (
                    patterns.categories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b last:border-0">
                        <div>
                          <p className="font-medium capitalize">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.frequency} transactions, avg. {formatCurrency(category.averageAmount)}
                          </p>
                        </div>
                        <Badge variant={category.trend === 'increasing' ? 'destructive' : category.trend === 'decreasing' ? 'success' : 'outline'}>
                          {category.trend === 'increasing' ? 'Increasing' : category.trend === 'decreasing' ? 'Decreasing' : 'Stable'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No spending pattern data available.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anomaly Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {anomalies && anomalies.length > 0 ? (
                    anomalies.map((anomaly, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">{anomaly.description}</p>
                            <Badge variant="outline" className="ml-2">
                              {formatCurrency(parseFloat(anomaly.amount))}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(anomaly.date).toLocaleDateString()} - {anomaly.category}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No anomalies detected in the current data set.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecasts Tab */}
          <TabsContent value="forecasts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Forecast (Next 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {cashFlowPrediction && cashFlowPrediction.length > 0 ? (
                    <div className="space-y-8">
                      {/* Cash Flow Forecast Chart */}
                      <div className="h-80 w-full">
                        <CashFlowForecastChart 
                          forecastData={cashFlowPrediction.map(month => ({
                            date: month.month,
                            income: month.predictedIncome,
                            expenses: month.predictedExpenses,
                            netCashFlow: month.netCashFlow,
                            confidence: 0.8 - (0.05 * cashFlowPrediction.indexOf(month))
                          }))}
                          historicalData={historicalData}
                        />
                      </div>
                      
                      {/* Monthly Forecast Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cashFlowPrediction.map((month, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm font-medium">{month.month}</p>
                                <p className={`text-2xl font-bold ${month.netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {formatCurrency(month.netCashFlow)}
                                </p>
                                <div className="flex justify-center items-center mt-2">
                                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(month.predictedIncome)} income
                                  </p>
                                </div>
                                <div className="flex justify-center items-center mt-1">
                                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(month.predictedExpenses)} expenses
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Insufficient data for cash flow prediction.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;