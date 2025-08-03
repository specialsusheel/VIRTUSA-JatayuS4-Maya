import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  DollarSign,
  Target,
  Calendar,
  PiggyBank,
  CreditCard,
  Home,
  Car,
  ShoppingBag,
  Utensils,
  Wifi,
  Heart,
  CheckCircle
} from "lucide-react";
import { createAIAnalyzer, SpendingPattern, FinancialHealth } from "@/utils/ai";
import { FinancialRecord } from "@/types/financial";
import { formatCurrency } from "@/config/currency";

interface SmartRecommendationsProps {
  records: FinancialRecord[];
  context?: 'individual' | 'organization';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'savings' | 'debt' | 'budget' | 'investment' | 'emergency' | 'lifestyle';
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  estimatedSavings?: number;
  actionSteps: string[];
  icon: React.ReactNode;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ records, context = 'individual' }) => {
  const aiAnalyzer = useMemo(() => createAIAnalyzer(records, context), [records, context]);
  
  const patterns = useMemo(() => aiAnalyzer.analyzeSpendingPatterns(), [aiAnalyzer]);
  const health = useMemo(() => aiAnalyzer.assessFinancialHealth(), [aiAnalyzer]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'transportation': return <Car className="h-4 w-4" />;
      case 'housing': return <Home className="h-4 w-4" />;
      case 'entertainment': return <Heart className="h-4 w-4" />;
      case 'shopping': return <ShoppingBag className="h-4 w-4" />;
      case 'utilities': return <Wifi className="h-4 w-4" />;
      case 'credit': return <CreditCard className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Savings recommendations
    if (health.savingsRate < 0.1) {
      recommendations.push({
        id: 'increase-savings',
        title: 'Increase Your Savings Rate',
        description: `Your current savings rate is ${(health.savingsRate * 100).toFixed(1)}%. Aim for at least 10-20% for financial security.`,
        category: 'savings',
        priority: 'high',
        impact: 'high',
        estimatedSavings: health.savingsRate < 0.05 ? 500 : 300,
        actionSteps: [
          'Set up automatic transfers to savings account',
          'Review and reduce non-essential expenses',
          'Create a 50/30/20 budget (50% needs, 30% wants, 20% savings)',
          'Track your progress monthly'
        ],
        icon: <PiggyBank className="h-5 w-5" />
      });
    }

    // Emergency fund recommendations
    if (health.emergencyFundStatus === 'critical') {
      recommendations.push({
        id: 'emergency-fund',
        title: 'Build Emergency Fund',
        description: 'Your emergency fund is critical. Aim for 3-6 months of expenses.',
        category: 'emergency',
        priority: 'high',
        impact: 'high',
        estimatedSavings: 1000,
        actionSteps: [
          'Open a high-yield savings account',
          'Set aside 10% of each paycheck',
          'Cut back on non-essential spending',
          'Consider a side hustle for extra income'
        ],
        icon: <Shield className="h-5 w-5" />
      });
    }

    // Debt reduction recommendations
    if (health.debtToIncomeRatio > 0.4) {
      recommendations.push({
        id: 'reduce-debt',
        title: 'Focus on Debt Reduction',
        description: `Your debt-to-income ratio is ${(health.debtToIncomeRatio * 100).toFixed(1)}%. This is above the recommended 40% threshold.`,
        category: 'debt',
        priority: 'high',
        impact: 'high',
        actionSteps: [
          'List all debts from highest to lowest interest rate',
          'Consider debt consolidation options',
          'Pay more than minimum payments',
          'Avoid taking on new debt'
        ],
        icon: <CreditCard className="h-5 w-5" />
      });
    }

    // Spending pattern recommendations
    patterns.forEach(pattern => {
      if (pattern.trend === 'increasing' && pattern.frequency > 3) {
        recommendations.push({
          id: `reduce-${pattern.category}`,
          title: `Reduce ${pattern.category} Spending`,
          description: `Your ${pattern.category} spending is increasing. Average amount: ${formatCurrency(pattern.averageAmount)}`,
          category: 'budget',
          priority: 'medium',
          impact: 'medium',
          estimatedSavings: pattern.averageAmount * 0.2,
          actionSteps: [
            `Set a monthly budget for ${pattern.category}`,
            'Look for cheaper alternatives',
            'Track spending in this category',
            'Consider if this spending aligns with your goals'
          ],
          icon: getCategoryIcon(pattern.category)
        });
      }
    });

    // Lifestyle optimization recommendations
    if (health.spendingEfficiency > 80) {
      recommendations.push({
        id: 'optimize-spending',
        title: 'Optimize Your Spending',
        description: 'Your spending efficiency can be improved. Look for areas to cut back.',
        category: 'lifestyle',
        priority: 'medium',
        impact: 'medium',
        estimatedSavings: 200,
        actionSteps: [
          'Review recurring subscriptions',
          'Negotiate better rates on bills',
          'Use cashback and rewards programs',
          'Plan meals to reduce food waste'
        ],
        icon: <Target className="h-5 w-5" />
      });
    }

    return recommendations.sort((a, b) => {
      // Sort by priority first, then by impact
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  };

  const recommendations = useMemo(() => generateRecommendations(), [patterns, health]);

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Add financial records to get personalized recommendations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Financial Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {(health.savingsRate * 100).toFixed(1)}%
              </p>
              <Progress value={health.savingsRate * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Target: 10-20%
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Debt-to-Income</p>
              <p className="text-2xl font-bold">
                {(health.debtToIncomeRatio * 100).toFixed(1)}%
              </p>
              <Progress 
                value={Math.min(health.debtToIncomeRatio * 100, 100)} 
                className="h-2" 
              />
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
              <Badge className={getPriorityColor(health.riskLevel)}>
                Risk: {health.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Great job! Your financial health looks good.</p>
              </div>
            ) : (
              recommendations.map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {recommendation.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{recommendation.title}</h3>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getImpactColor(recommendation.impact)}>
                          {recommendation.impact.toUpperCase()} IMPACT
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {recommendation.description}
                      </p>
                      
                      {recommendation.estimatedSavings && (
                        <div className="mb-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800">
                            Potential Monthly Savings: {formatCurrency(recommendation.estimatedSavings)}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Action Steps:</p>
                        <ul className="space-y-1">
                          {recommendation.actionSteps.map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartRecommendations;