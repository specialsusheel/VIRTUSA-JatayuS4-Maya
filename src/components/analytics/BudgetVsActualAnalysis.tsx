import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/config/currency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ArrowUpDown, DollarSign, Percent, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { FinancialRecord } from "@/types/financial";

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

interface BudgetPeriod {
  id: string;
  name: string;
  categories: BudgetCategory[];
}

interface BudgetVsActualAnalysisProps {
  records?: FinancialRecord[];
}

const BudgetVsActualAnalysis: React.FC<BudgetVsActualAnalysisProps> = ({ records = [] }) => {
  const [activePeriod, setActivePeriod] = useState<string>('current');
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // Sample budget data - in a real app, this would come from user input or a database
  const [budgetPeriods, setBudgetPeriods] = useState<BudgetPeriod[]>([
    {
      id: 'current',
      name: 'Current Month',
      categories: [
        { id: 'housing', name: 'Housing', budgeted: 1500, actual: 1550, variance: -50, variancePercent: -3.33 },
        { id: 'utilities', name: 'Utilities', budgeted: 300, actual: 275, variance: 25, variancePercent: 8.33 },
        { id: 'groceries', name: 'Groceries', budgeted: 600, actual: 580, variance: 20, variancePercent: 3.33 },
        { id: 'transportation', name: 'Transportation', budgeted: 400, actual: 450, variance: -50, variancePercent: -12.5 },
        { id: 'healthcare', name: 'Healthcare', budgeted: 200, actual: 150, variance: 50, variancePercent: 25 },
        { id: 'entertainment', name: 'Entertainment', budgeted: 300, actual: 400, variance: -100, variancePercent: -33.33 },
        { id: 'dining', name: 'Dining Out', budgeted: 350, actual: 420, variance: -70, variancePercent: -20 },
        { id: 'savings', name: 'Savings', budgeted: 800, actual: 800, variance: 0, variancePercent: 0 },
      ]
    },
    {
      id: 'previous',
      name: 'Previous Month',
      categories: [
        { id: 'housing', name: 'Housing', budgeted: 1500, actual: 1500, variance: 0, variancePercent: 0 },
        { id: 'utilities', name: 'Utilities', budgeted: 300, actual: 290, variance: 10, variancePercent: 3.33 },
        { id: 'groceries', name: 'Groceries', budgeted: 600, actual: 620, variance: -20, variancePercent: -3.33 },
        { id: 'transportation', name: 'Transportation', budgeted: 400, actual: 380, variance: 20, variancePercent: 5 },
        { id: 'healthcare', name: 'Healthcare', budgeted: 200, actual: 220, variance: -20, variancePercent: -10 },
        { id: 'entertainment', name: 'Entertainment', budgeted: 300, actual: 350, variance: -50, variancePercent: -16.67 },
        { id: 'dining', name: 'Dining Out', budgeted: 350, actual: 380, variance: -30, variancePercent: -8.57 },
        { id: 'savings', name: 'Savings', budgeted: 800, actual: 800, variance: 0, variancePercent: 0 },
      ]
    },
    {
      id: 'quarter',
      name: 'Current Quarter',
      categories: [
        { id: 'housing', name: 'Housing', budgeted: 4500, actual: 4550, variance: -50, variancePercent: -1.11 },
        { id: 'utilities', name: 'Utilities', budgeted: 900, actual: 870, variance: 30, variancePercent: 3.33 },
        { id: 'groceries', name: 'Groceries', budgeted: 1800, actual: 1900, variance: -100, variancePercent: -5.56 },
        { id: 'transportation', name: 'Transportation', budgeted: 1200, actual: 1150, variance: 50, variancePercent: 4.17 },
        { id: 'healthcare', name: 'Healthcare', budgeted: 600, actual: 580, variance: 20, variancePercent: 3.33 },
        { id: 'entertainment', name: 'Entertainment', budgeted: 900, actual: 1050, variance: -150, variancePercent: -16.67 },
        { id: 'dining', name: 'Dining Out', budgeted: 1050, actual: 1200, variance: -150, variancePercent: -14.29 },
        { id: 'savings', name: 'Savings', budgeted: 2400, actual: 2400, variance: 0, variancePercent: 0 },
      ]
    }
  ]);
  
  // Get the active period data
  const activePeriodData = useMemo(() => {
    return budgetPeriods.find(period => period.id === activePeriod) || budgetPeriods[0];
  }, [budgetPeriods, activePeriod]);
  
  // Calculate totals for the active period
  const totals = useMemo(() => {
    const totalBudgeted = activePeriodData.categories.reduce((sum, category) => sum + category.budgeted, 0);
    const totalActual = activePeriodData.categories.reduce((sum, category) => sum + category.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;
    
    return {
      budgeted: totalBudgeted,
      actual: totalActual,
      variance: totalVariance,
      variancePercent: totalVariancePercent
    };
  }, [activePeriodData]);
  
  // Prepare data for the chart
  const chartData = useMemo(() => {
    return activePeriodData.categories.map(category => ({
      name: category.name,
      budgeted: category.budgeted,
      actual: category.actual,
      variance: category.variance
    }));
  }, [activePeriodData]);
  
  // Update a budget category
  const updateBudgetCategory = (categoryId: string, field: 'budgeted' | 'actual', value: number) => {
    setBudgetPeriods(prevPeriods => {
      return prevPeriods.map(period => {
        if (period.id === activePeriod) {
          const updatedCategories = period.categories.map(category => {
            if (category.id === categoryId) {
              const updatedCategory = { ...category, [field]: value };
              // Recalculate variance
              updatedCategory.variance = updatedCategory.actual - updatedCategory.budgeted;
              updatedCategory.variancePercent = updatedCategory.budgeted > 0 
                ? (updatedCategory.variance / updatedCategory.budgeted) * 100 
                : 0;
              return updatedCategory;
            }
            return category;
          });
          return { ...period, categories: updatedCategories };
        }
        return period;
      });
    });
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const budgeted = payload[0].value;
      const actual = payload[1].value;
      const variance = actual - budgeted;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">Budgeted: <span className="font-bold">{formatCurrency(budgeted)}</span></p>
          <p className="text-sm">Actual: <span className="font-bold">{formatCurrency(actual)}</span></p>
          <p className={`text-sm ${variance < 0 ? 'text-red-500' : variance > 0 ? 'text-green-500' : 'text-gray-500'}`}>
            Variance: <span className="font-bold">{formatCurrency(variance)}</span> 
            ({variancePercent.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Get color based on variance
  const getVarianceColor = (variance: number) => {
    if (variance < 0) return 'text-red-500';
    if (variance > 0) return 'text-green-500';
    return 'text-gray-500';
  };
  
  // Get badge variant based on variance
  const getVarianceBadgeVariant = (variance: number) => {
    if (variance < 0) return 'destructive';
    if (variance > 0) return 'success';
    return 'secondary';
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Budget vs. Actual Analysis
        </CardTitle>
        <CardDescription>
          Compare your planned budget with actual spending to identify areas for improvement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" value={activePeriod} onValueChange={setActivePeriod} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {budgetPeriods.map((period) => (
                <TabsTrigger key={period.id} value={period.id}>
                  {period.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'View Mode' : 'Edit Budget'}
            </Button>
          </div>
          
          {budgetPeriods.map((period) => (
            <TabsContent key={period.id} value={period.id} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                      <span className="text-2xl font-bold">{formatCurrency(totals.budgeted)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                      <span className="text-2xl font-bold">{formatCurrency(totals.actual)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overall Variance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <ArrowUpDown className={`h-5 w-5 mr-2 ${getVarianceColor(totals.variance)}`} />
                      <span className={`text-2xl font-bold ${getVarianceColor(totals.variance)}`}>
                        {formatCurrency(totals.variance)}
                      </span>
                      <Badge 
                        variant={getVarianceBadgeVariant(totals.variance)} 
                        className="ml-2"
                      >
                        {totals.variancePercent.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="mt-2">
                      {totals.variance < 0 ? (
                        <div className="flex items-center text-sm text-red-500">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Over budget
                        </div>
                      ) : totals.variance > 0 ? (
                        <div className="flex items-center text-sm text-green-500">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Under budget
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          On budget
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Budget vs. Actual by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                          barGap={0}
                          barCategoryGap={10}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70} 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="budgeted" name="Budgeted" fill="#94a3b8" />
                          <Bar dataKey="actual" name="Actual" fill="#3b82f6">
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.actual > entry.budgeted ? '#ef4444' : '#22c55e'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Variance Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Category</th>
                            {!editMode ? (
                              <>
                                <th className="text-right py-2">Budgeted</th>
                                <th className="text-right py-2">Actual</th>
                                <th className="text-right py-2">Variance</th>
                              </>
                            ) : (
                              <>
                                <th className="text-right py-2">Budgeted</th>
                                <th className="text-right py-2">Actual</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {activePeriodData.categories.map((category) => (
                            <tr key={category.id} className="border-b hover:bg-gray-50">
                              <td className="py-2">{category.name}</td>
                              {!editMode ? (
                                <>
                                  <td className="text-right py-2">{formatCurrency(category.budgeted)}</td>
                                  <td className="text-right py-2">{formatCurrency(category.actual)}</td>
                                  <td className="text-right py-2">
                                    <span className={getVarianceColor(category.variance)}>
                                      {formatCurrency(category.variance)}
                                      <span className="text-xs ml-1">({category.variancePercent.toFixed(1)}%)</span>
                                    </span>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="text-right py-2">
                                    <Input
                                      type="number"
                                      value={category.budgeted}
                                      onChange={(e) => updateBudgetCategory(category.id, 'budgeted', Number(e.target.value))}
                                      className="w-24 inline-block text-right"
                                    />
                                  </td>
                                  <td className="text-right py-2">
                                    <Input
                                      type="number"
                                      value={category.actual}
                                      onChange={(e) => updateBudgetCategory(category.id, 'actual', Number(e.target.value))}
                                      className="w-24 inline-block text-right"
                                    />
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold">
                            <td className="py-2">Total</td>
                            <td className="text-right py-2">{formatCurrency(totals.budgeted)}</td>
                            <td className="text-right py-2">{formatCurrency(totals.actual)}</td>
                            {!editMode && (
                              <td className="text-right py-2">
                                <span className={getVarianceColor(totals.variance)}>
                                  {formatCurrency(totals.variance)}
                                  <span className="text-xs ml-1">({totals.variancePercent.toFixed(1)}%)</span>
                                </span>
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BudgetVsActualAnalysis;