import React, { useState } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  PieChart
} from "lucide-react";
import AIInsights from "@/components/dashboard/AIInsights";
import SmartRecommendations from "@/components/dashboard/SmartRecommendations";
import AnomalyDetector from "@/components/transactions/AnomalyDetector";
import ContextSelector from "@/components/dashboard/ContextSelector";
import { createAIAnalyzer } from "@/utils/ai";
import { formatCurrency } from "@/config/currency";

const AIInsightsPage: React.FC = () => {
  const { records } = useBlockchain();
  const [activeTab, setActiveTab] = useState("overview");
  const [context, setContext] = useState<'individual' | 'organization'>('individual');

  const aiAnalyzer = createAIAnalyzer(records, context);
  const insights = aiAnalyzer.generateInsights();
  const health = aiAnalyzer.assessFinancialHealth();
  const patterns = aiAnalyzer.analyzeSpendingPatterns();
  const anomalies = aiAnalyzer.detectAnomalies();
  const cashFlowPrediction = aiAnalyzer.predictCashFlow(6);
np
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
      
      if (health.workingCapitalRatio && health.workingCapitalRatio < 0) score -= 20;
      else if (health.workingCapitalRatio && health.workingCapitalRatio > 30) score += 10;
      
      if (health.expenseRatio && health.expenseRatio > 90) score -= 15;
      else if (health.expenseRatio && health.expenseRatio < 70) score += 10;
    }
    
    // Common metrics for both individual and organization
    if (health.savingsRate < 0.05) score -= 25;
    else if (health.savingsRate < 0.1) score -= 15;
    else if (health.savingsRate > 0.2) score += 15;
    
    if (health.debtToIncomeRatio > 0.6) score -= 30;
    else if (health.debtToIncomeRatio > 0.4) score -= 20;
    else if (health.debtToIncomeRatio < 0.2) score += 15;
    
    if (health.emergencyFundStatus === 'critical') score -= 30;
    else if (health.emergencyFundStatus === 'warning') score -= 15;
    else if (health.emergencyFundStatus === 'good') score += 15;
    
    if (health.spendingEfficiency > 90) score -= 15;
    else if (health.spendingEfficiency < 70) score += 10;
    
    // Adjust based on risk level
    if (health.riskLevel === 'high') score -= 10;
    else if (health.riskLevel === 'low') score += 10;
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = getHealthScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI-Powered Financial Intelligence</h1>
              <p className="text-muted-foreground">
                Smart insights, predictions, and recommendations for {context === 'individual' ? 'personal' : 'organizational'} financial health
              </p>
            </div>
          </div>
          
          {/* Context Selector */}
          <ContextSelector 
            context={context}
            onContextChange={setContext}
            recordCount={records.length}
          />
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Financial Health Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
                      {healthScore}/100
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AI Insights</p>
                    <p className="text-2xl font-bold">{insights.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Anomalies</p>
                    <p className="text-2xl font-bold">{anomalies.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patterns</p>
                    <p className="text-2xl font-bold">{patterns.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Anomalies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Financial Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Health Score</p>
                      <Badge className={getScoreBadge(healthScore)}>
                        {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
                      </Badge>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          healthScore >= 80 ? 'bg-green-500' : 
                          healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${healthScore}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Savings Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(health.savingsRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target: 10-20%
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Debt-to-Income</p>
                    <p className="text-2xl font-bold">
                      {(health.debtToIncomeRatio * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target: &lt;40%
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Emergency Fund</p>
                    <p className={`text-2xl font-bold ${
                      health.emergencyFundStatus === 'good' ? 'text-green-600' :
                      health.emergencyFundStatus === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {health.emergencyFundStatus.charAt(0).toUpperCase() + health.emergencyFundStatus.slice(1)}
                    </p>
                    <Badge className={getScoreBadge(health.riskLevel === 'high' ? 30 : health.riskLevel === 'medium' ? 60 : 90)}>
                      Risk: {health.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  6-Month Cash Flow Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashFlowPrediction.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{prediction.month}</p>
                          <p className="text-sm text-muted-foreground">
                            Income: {formatCurrency(prediction.predictedIncome)} | 
                            Expenses: {formatCurrency(prediction.predictedExpenses)}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <AIInsights records={records} context={context} />
          </TabsContent>

          <TabsContent value="recommendations">
            <SmartRecommendations records={records} context={context} />
          </TabsContent>

          <TabsContent value="anomalies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Anomaly Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnomalyDetector records={records} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIInsightsPage;