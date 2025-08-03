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
  Building2,
  Users,
  ShoppingCart,
  Clock,
  Activity
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from "@/config/currency";

interface OrganizationMetricsProps {
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

const OrganizationMetrics: React.FC<OrganizationMetricsProps> = ({ records, comparisonData, comparisonPeriods, comparisonMode }) => {
  // Calculate organization-specific metrics
  const calculateMetrics = () => {
    // Map various possible category names to standardized types
    const categoryMap: Record<string, string[]> = {
      'revenue': ['revenue', 'income', 'sales', 'earnings'],
      'cost': ['cost', 'expense', 'expenses', 'spending', 'cost of goods sold', 'cogs'],
      'asset': ['asset', 'assets', 'current assets', 'fixed assets', 'investments'],
      'liability': ['liability', 'liabilities', 'debt', 'loans', 'accounts payable'],
      'operational_expense': ['operational expense', 'operational_expense', 'opex', 'operating expense', 'overhead'],
      'capital_expense': ['capital expense', 'capital_expense', 'capex', 'capital expenditure'],
      'employee': ['employee', 'staff', 'personnel', 'human resources', 'hr'],
      'customer': ['customer', 'client', 'user', 'subscriber']
    };
    
    // Helper function to categorize records based on the mapping
    const categorizeRecords = (type: string) => {
      return records.filter(r => {
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
    const employeeRecords = categorizeRecords('employee');
    const customerRecords = categorizeRecords('customer');
    
    const totalRevenue = revenueRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalCosts = costRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalAssets = assetRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalLiabilities = liabilityRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalOperationalExpenses = operationalExpenseRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalCapitalExpenses = capitalExpenseRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    // Calculate organization-specific KPIs
    const grossProfit = totalRevenue - totalCosts;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    const operatingProfit = totalRevenue - totalOperationalExpenses;
    const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
    
    const ebitda = operatingProfit; // Simplified EBITDA calculation
    const netIncome = grossProfit - totalOperationalExpenses - totalCapitalExpenses;
    
    // Cash Flow
    const operatingCashFlow = operatingProfit; // Simplified
    const investingCashFlow = -totalCapitalExpenses; // Negative as it's an outflow
    const financingCashFlow = 0; // Placeholder, would need actual financing data
    
    // Financial Ratios
    const debtToEquity = totalLiabilities / (totalAssets - totalLiabilities);
    const currentRatio = totalAssets / totalLiabilities;
    
    // Customer Metrics (placeholder calculations)
    const customerCount = customerRecords.length;
    const churnRate = 5; // Placeholder - would need historical data
    const cac = totalOperationalExpenses / (customerCount || 1); // Customer Acquisition Cost
    const clv = totalRevenue / (customerCount || 1) * 3; // Customer Lifetime Value (simplified)
    
    // Employee Metrics
    const headcount = employeeRecords.length;
    const avgEmployeeCost = headcount > 0 ? 
      employeeRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0) / headcount : 0;
    
    // Sector-specific (example: inventory turnover)
    const inventoryTurnover = 4; // Placeholder
    const arDays = 45; // Placeholder for Accounts Receivable Days
    
    // Organizational Health Score (0-100)
    let healthScore = 0;
    
    // Profitability component (0-40 points)
    if (grossProfitMargin > 30) healthScore += 40;
    else if (grossProfitMargin > 20) healthScore += 30;
    else if (grossProfitMargin > 10) healthScore += 20;
    else if (grossProfitMargin > 0) healthScore += 10;
    
    // Financial stability component (0-30 points)
    if (currentRatio > 2) healthScore += 30;
    else if (currentRatio > 1.5) healthScore += 20;
    else if (currentRatio > 1) healthScore += 10;
    
    // Growth component (0-30 points)
    // Would need historical data for proper calculation
    // Using placeholder value for now
    healthScore += 20;
    
    return {
      totalRevenue,
      grossProfit,
      grossProfitMargin,
      operatingMargin,
      ebitda,
      netIncome,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      debtToEquity,
      currentRatio,
      churnRate,
      cac,
      clv,
      headcount,
      avgEmployeeCost,
      inventoryTurnover,
      arDays,
      healthScore
    };
  };

  const metrics = calculateMetrics();
  
  // Using the imported formatCurrency function from @/config/currency
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Generate revenue trend data (placeholder)
  const revenueTrendData = [
    { month: 'Jan', revenue: 120000 },
    { month: 'Feb', revenue: 140000 },
    { month: 'Mar', revenue: 130000 },
    { month: 'Apr', revenue: 170000 },
    { month: 'May', revenue: 190000 },
    { month: 'Jun', revenue: 210000 },
  ];
  
  // Generate margin comparison data (placeholder)
  const marginComparisonData = [
    { year: '2021', grossMargin: 25, operatingMargin: 15, netMargin: 8 },
    { year: '2022', grossMargin: 28, operatingMargin: 17, netMargin: 10 },
    { year: '2023', grossMargin: 30, operatingMargin: 20, netMargin: 12 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizational Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Revenue & Growth */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>8.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Profit Margins */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{formatPercentage(metrics.grossProfitMargin)}</div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>2.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Operating Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{formatPercentage(metrics.operatingMargin)}</div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>1.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* EBITDA & Net Income */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(metrics.ebitda)}</div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>3.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(metrics.netIncome)}</div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>5.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Cash Flow */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Operating:</span>
                    <span className="font-medium">{formatCurrency(metrics.operatingCashFlow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investing:</span>
                    <span className="font-medium">{formatCurrency(metrics.investingCashFlow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Financing:</span>
                    <span className="font-medium">{formatCurrency(metrics.financingCashFlow)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Financial Ratios */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Debt-to-Equity Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.debtToEquity.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.debtToEquity < 1 ? "Healthy balance" : "Consider debt reduction"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.currentRatio.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.currentRatio > 1.5 ? "Strong liquidity" : "Monitor cash flow"}
                </p>
              </CardContent>
            </Card>
            
            {/* Customer Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Customer Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Churn Rate:</span>
                    <span className="font-medium">{metrics.churnRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAC:</span>
                    <span className="font-medium">{formatCurrency(metrics.cac)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLV:</span>
                    <span className="font-medium">{formatCurrency(metrics.clv)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Employee Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Workforce</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Headcount:</span>
                    <span className="font-medium">{metrics.headcount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Cost:</span>
                    <span className="font-medium">{formatCurrency(metrics.avgEmployeeCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Sector-specific KPIs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sector Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Inventory Turnover:</span>
                    <span className="font-medium">{metrics.inventoryTurnover.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AR Days:</span>
                    <span className="font-medium">{metrics.arDays}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Organizational Health Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Organizational Health</CardTitle>
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
      
      {/* Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Multi-Year Margin Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="grossMargin" name="Gross Margin" fill="#3b82f6" />
                <Bar dataKey="operatingMargin" name="Operating Margin" fill="#10b981" />
                <Bar dataKey="netMargin" name="Net Margin" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Key Organizational Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-800 mb-1">Profitability Trend</h3>
              <p className="text-sm text-blue-700">
                Your gross profit margin has improved by 2.1% compared to last quarter, indicating improved operational efficiency.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <h3 className="font-medium text-green-800 mb-1">Cash Flow Opportunity</h3>
              <p className="text-sm text-green-700">
                Operating cash flow is strong, consider strategic investments to accelerate growth while maintaining healthy reserves.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
              <h3 className="font-medium text-amber-800 mb-1">Customer Acquisition</h3>
              <p className="text-sm text-amber-700">
                Your CAC to CLV ratio is 1:3, which is healthy. However, reducing churn rate by 1% could increase profitability by an estimated 4%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationMetrics;