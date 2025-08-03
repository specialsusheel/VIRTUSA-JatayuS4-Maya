
import React, { useState, useMemo } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { Link } from "react-router-dom";
import ContextSelector from "@/components/dashboard/ContextSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinancialRecord } from "@/types/financial";
import { createAIAnalyzer } from "@/utils/ai";
import { formatCurrency } from "@/config/currency";
import ExpenseDistributionChart from "@/components/dashboard/ExpenseDistributionChart";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Lightbulb,
  ArrowRight,
  PieChart,
  Activity,
  Calendar
} from "lucide-react";


const Dashboard = () => {
  const { records } = useBlockchain();
  const [context, setContext] = useState<'individual' | 'organization'>('individual');
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

  // Calculate summary metrics
  const aiAnalyzer = createAIAnalyzer(filteredRecords, context);
  const insights = aiAnalyzer?.generateInsights() || [];
  const health = aiAnalyzer?.assessFinancialHealth() || {};
  const anomalies = aiAnalyzer?.detectAnomalies() || [];

  // Get top insights and anomalies
  const topInsights = insights.slice(0, 2);
  const topAnomalies = anomalies.slice(0, 2);

  // Calculate summary metrics based on context
  const getSummaryMetrics = () => {
    const incomeRecords = filteredRecords.filter(r => r.category.toLowerCase() === 'income' || r.category.toLowerCase() === 'revenue');
    const expenseRecords = filteredRecords.filter(r => r.category.toLowerCase() === 'expense' || r.category.toLowerCase() === 'cost');
    const assetRecords = filteredRecords.filter(r => r.category.toLowerCase() === 'asset');
    const liabilityRecords = filteredRecords.filter(r => r.category.toLowerCase() === 'liability');
    
    const totalIncome = incomeRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalExpenses = expenseRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalAssets = assetRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalLiabilities = liabilityRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const netCashFlow = totalIncome - totalExpenses;
    const netWorth = totalAssets - totalLiabilities;
    
    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      netWorth,
      recordCount: filteredRecords.length,
      incomeCount: incomeRecords.length,
      expenseCount: expenseRecords.length,
      assetCount: assetRecords.length,
      liabilityCount: liabilityRecords.length
    };
  };

  const metrics = getSummaryMetrics();

  // Calculate health score
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
    } else {
      // Individual-specific metrics
      if (health.debtToIncomeRatio && health.debtToIncomeRatio > 0.43) score -= 25;
      else if (health.debtToIncomeRatio && health.debtToIncomeRatio > 0.36) score -= 15;
      else if (health.debtToIncomeRatio && health.debtToIncomeRatio < 0.25) score += 15;
      
      if (health.savingsRate && health.savingsRate < 0.1) score -= 20;
      else if (health.savingsRate && health.savingsRate > 0.2) score += 15;
    }
    
    // Cap the score between 0 and 100
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = getHealthScore();
  const healthStatus = healthScore >= 70 ? "Good" : healthScore >= 40 ? "Moderate" : "Poor";
  const healthColor = healthScore >= 70 ? "text-green-500" : healthScore >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div>
      <div className="container mx-auto">
        
        <div className="space-y-6">
          {/* Context Selector */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <ContextSelector 
                context={context}
                onContextChange={setContext}
                recordCount={filteredRecords.length}
              />
            </div>
            <Button asChild variant="outline">
              <Link to="/analytics" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Analytics
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Financial Health */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {context === 'organization' ? 'Business Health' : 'Financial Health'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold ${healthColor}`}>{healthScore}</p>
                  <Badge variant={healthScore >= 70 ? "success" : healthScore >= 40 ? "warning" : "destructive"}>
                    {healthStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {context === 'organization' 
                    ? 'Based on profitability and cash flow' 
                    : 'Based on debt and savings'}
                </p>
              </CardContent>
            </Card>

            {/* Cash Flow */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {context === 'organization' ? 'Net Cash Flow' : 'Net Cash Flow'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold ${(metrics?.netCashFlow || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(metrics?.netCashFlow || 0)}
                  </p>
                  {(metrics?.netCashFlow || 0) >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Income: {formatCurrency(metrics?.totalIncome || 0)} | Expenses: {formatCurrency(metrics?.totalExpenses || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Net Worth / Balance Sheet */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {context === 'organization' ? 'Balance Sheet' : 'Net Worth'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold ${(metrics?.netWorth || 0) >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    {formatCurrency(metrics?.netWorth || 0)}
                  </p>
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Assets: {formatCurrency(metrics?.totalAssets || 0)} | Liabilities: {formatCurrency(metrics?.totalLiabilities || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{metrics?.recordCount || 0}</p>
                  <Activity className="h-5 w-5 text-gray-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {context === 'organization' 
                    ? `Revenue: ${metrics?.incomeCount || 0} | Expenses: ${metrics?.expenseCount || 0}` 
                    : `Income: ${metrics?.incomeCount || 0} | Expenses: ${metrics?.expenseCount || 0}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Visualization */}
          <div className="grid grid-cols-1 gap-4">
            {/* Category Allocation Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Category Allocation</CardTitle>
                <CardDescription>
                  Breakdown of your finances by main categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {filteredRecords.length > 0 ? (
                    <ExpenseDistributionChart records={filteredRecords} />
                  ) : (
                    <p className="text-muted-foreground">No financial data available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>
                Key financial insights based on your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topInsights.length > 0 ? (
                  topInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {insight.type === 'risk' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : insight.type === 'opportunity' ? (
                        <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
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
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/analytics" className="flex items-center justify-center">
                    View All Insights
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly Alerts */}
          {topAnomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Alerts</CardTitle>
                <CardDescription>
                  Unusual transactions that may require attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAnomalies.map((anomaly, index) => (
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
                  ))}
                  <Button asChild variant="outline" className="w-full mt-2">
                    <Link to="/analytics" className="flex items-center justify-center">
                      View All Anomalies
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                  <Link to="/transactions">
                    <Activity className="h-6 w-6 mb-2" />
                    <span>Transactions</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                  <Link to="/file-import">
                    <Calendar className="h-6 w-6 mb-2" />
                    <span>Import Data</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                  <Link to="/analytics">
                    <PieChart className="h-6 w-6 mb-2" />
                    <span>Analytics</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                  <Link to="/export">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>Export</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
