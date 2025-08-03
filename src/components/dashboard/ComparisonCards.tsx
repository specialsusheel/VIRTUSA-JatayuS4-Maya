
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinancialRecord } from "@/types/financial";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/config/currency";

interface ComparisonCardsProps {
  period1Data: FinancialRecord[];
  period2Data: FinancialRecord[];
  period1Label: string;
  period2Label: string;
}

const ComparisonCards: React.FC<ComparisonCardsProps> = ({
  period1Data,
  period2Data,
  period1Label,
  period2Label,
}) => {
  const calculateMetrics = (data: FinancialRecord[]) => {
    const totals = {
      income: 0,
      expenses: 0,
      assets: 0,
      liabilities: 0,
    };

    data.forEach((record) => {
      const amount = parseFloat(record.amount);
      switch (record.category.toLowerCase()) {
        case 'income':
          totals.income += amount;
          break;
        case 'expense':
          totals.expenses += amount;
          break;
        case 'asset':
          totals.assets += amount;
          break;
        case 'liability':
          totals.liabilities += amount;
          break;
      }
    });

    return {
      ...totals,
      balance: totals.assets + totals.income - totals.liabilities - totals.expenses,
      activity: data.length,
    };
  };

  const period1Metrics = calculateMetrics(period1Data);
  const period2Metrics = calculateMetrics(period2Data);

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Using the imported formatCurrency function from @/config/currency

  const comparisonData = [
    {
      title: "Income",
      period1: period1Metrics.income,
      period2: period2Metrics.income,
      change: getPercentageChange(period1Metrics.income, period2Metrics.income),
    },
    {
      title: "Expenses",
      period1: period1Metrics.expenses,
      period2: period2Metrics.expenses,
      change: getPercentageChange(period1Metrics.expenses, period2Metrics.expenses),
    },
    {
      title: "Balance",
      period1: period1Metrics.balance,
      period2: period2Metrics.balance,
      change: getPercentageChange(period1Metrics.balance, period2Metrics.balance),
    },
    {
      title: "Activity",
      period1: period1Metrics.activity,
      period2: period2Metrics.activity,
      change: getPercentageChange(period1Metrics.activity, period2Metrics.activity),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Period Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comparisonData.map((item, index) => {
            const isPositive = item.change >= 0;
            const isActivityOrIncome = item.title === 'Activity' || item.title === 'Income';
            const changeColor = isActivityOrIncome 
              ? (isPositive ? 'text-green-600' : 'text-red-600')
              : (item.title === 'Expenses' 
                  ? (isPositive ? 'text-red-600' : 'text-green-600')
                  : (isPositive ? 'text-green-600' : 'text-red-600'));

            return (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">{item.title}</h4>
                  <div className={`flex items-center ${changeColor}`}>
                    {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    <span className="font-medium">{Math.abs(item.change).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Badge variant="outline" className="mb-1">{period1Label}</Badge>
                    <p className="font-medium">
                      {item.title === 'Activity' ? item.period1 : formatCurrency(item.period1)}
                    </p>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-1">{period2Label}</Badge>
                    <p className="font-medium">
                      {item.title === 'Activity' ? item.period2 : formatCurrency(item.period2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonCards;
