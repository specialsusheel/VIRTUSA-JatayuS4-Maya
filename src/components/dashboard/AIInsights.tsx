import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/config/currency";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Shield, 
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Target
} from "lucide-react";
import { createAIAnalyzer, AIInsight, FinancialHealth } from "@/utils/ai";
import { FinancialRecord } from "@/types/financial";
import { TimeSeriesForecaster, TimeSeriesForecast } from "@/utils/forecasting";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

interface AIInsightsProps {
  records: FinancialRecord[];
  context?: 'individual' | 'organization';
}

const AIInsights: React.FC<AIInsightsProps> = ({ records, context = 'individual' }) => {
  const aiAnalyzer = useMemo(() => createAIAnalyzer(records, context), [records, context]);
  
  const insights = useMemo(() => aiAnalyzer.generateInsights(), [aiAnalyzer]);
  const health = useMemo(() => aiAnalyzer.assessFinancialHealth(), [aiAnalyzer]);
  const cashFlowPrediction = useMemo(() => aiAnalyzer.predictCashFlow(3), [aiAnalyzer]);
  
  // Enhanced time series forecasting
  const forecaster = useMemo(() => new TimeSeriesForecaster(records), [records]);
  const timeSeriesForecast = useMemo(() => forecaster.generateForecast(6), [forecaster]);



  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'risk': return <Shield className="h-4 w-4" />;
      case 'opportunity': return <DollarSign className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const formatChartData = (forecast: TimeSeriesForecast) => {
    const allData = [...forecast.historical, ...forecast.forecast];
    return allData.map(point => ({
      date: point.date,
      income: point.income,
      expenses: point.expenses,
      netCashFlow: point.netCashFlow,
      type: forecast.historical.includes(point) ? 'Historical' : 'Forecast'
    }));
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Add some financial records to get AI-powered insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">


      {/* Financial Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Financial Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Debt-to-Income Ratio</p>
              <p className="text-2xl font-bold">
                {(health.debtToIncomeRatio * 100).toFixed(1)}%
              </p>
              <Progress 
                value={Math.min(health.debtToIncomeRatio * 100, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {(health.savingsRate * 100).toFixed(1)}%
              </p>
              <Progress 
                value={health.savingsRate * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Emergency Fund</p>
              <p className={`text-2xl font-bold ${getHealthStatusColor(health.emergencyFundStatus)}`}>
                {health.emergencyFundStatus.charAt(0).toUpperCase() + health.emergencyFundStatus.slice(1)}
              </p>
              <Badge className={getRiskLevelColor(health.riskLevel)}>
                Risk: {health.riskLevel.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Spending Efficiency</p>
              <p className="text-2xl font-bold">
                {health.spendingEfficiency.toFixed(1)}%
              </p>
              <Progress 
                value={health.spendingEfficiency} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Time Series Forecasting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            6-Month Cash Flow Forecast
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Trend: <span className={getTrendColor(timeSeriesForecast.trend)}>{timeSeriesForecast.trend}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Accuracy: {(timeSeriesForecast.accuracy * 100).toFixed(0)}%</span>
            </div>
            <Badge variant="outline">
              {timeSeriesForecast.seasonality} seasonality
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time Series Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatChartData(timeSeriesForecast)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return `${month}/${year.slice(2)}`;
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${formatCurrency(value / 1000).replace(/\.\d+/, '')}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => {
                      const [year, month] = label.split('-');
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${monthNames[parseInt(month) - 1]} ${year}`;
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="Income"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                    name="Expenses"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netCashFlow" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="Net Cash Flow"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Average Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(timeSeriesForecast.forecast.reduce((sum, f) => sum + f.income, 0) / timeSeriesForecast.forecast.length)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Average Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(timeSeriesForecast.forecast.reduce((sum, f) => sum + f.expenses, 0) / timeSeriesForecast.forecast.length)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Projected Net Cash Flow</p>
                <p className={`text-2xl font-bold ${timeSeriesForecast.forecast.reduce((sum, f) => sum + f.netCashFlow, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(timeSeriesForecast.forecast.reduce((sum, f) => sum + f.netCashFlow, 0))}
                </p>
              </div>
            </div>

            {/* Monthly Forecast Details */}
            <div className="space-y-2">
              <h4 className="font-medium">Monthly Forecast Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {timeSeriesForecast.forecast.map((prediction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(prediction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(prediction.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        prediction.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(prediction.netCashFlow)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Net Cash Flow
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Great! No concerning patterns detected in your financial data.</p>
              </div>
            ) : (
              insights.map((insight) => (
                <Alert key={insight.id} className={`border-l-4 ${getSeverityColor(insight.severity)}`}>
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {insight.title}
                        <Badge variant="outline" className="text-xs">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        {insight.description}
                        {insight.actionable && insight.action && (
                          <div className="mt-3">
                            <Button size="sm" variant="outline" className="text-xs">
                              {insight.action}
                            </Button>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {health.savingsRate < 0.1 && (
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Increase Savings</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Your savings rate is low. Consider setting up automatic transfers.
                </span>
              </Button>
            )}
            
            {health.debtToIncomeRatio > 0.4 && (
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Reduce Debt</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  High debt-to-income ratio detected. Focus on debt reduction.
                </span>
              </Button>
            )}
            
            {health.emergencyFundStatus === 'critical' && (
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Build Emergency Fund</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Emergency fund is critical. Aim for 3-6 months of expenses.
                </span>
              </Button>
            )}
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Review Transactions</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Check for any unusual transactions or categorization errors.
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;