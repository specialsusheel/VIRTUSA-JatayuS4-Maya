import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from "@/config/currency";
import { FinancialRecord } from "@/types/financial";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, Target, Save, FileText } from "lucide-react";

interface BudgetPlannerProps {
  records: FinancialRecord[];
}

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ records }) => {
  const [activePeriod, setActivePeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [selectedQuarter, setSelectedQuarter] = useState<string>(`${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Budget categories with initial values derived from historical data
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(() => {
    // Extract unique categories from records
    const categories = Array.from(new Set(records.map(r => r.category)));
    
    // Calculate average monthly spending for each category
    return categories.map(category => {
      const categoryRecords = records.filter(r => r.category === category);
      const totalAmount = categoryRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.amount)), 0);
      const avgMonthlyAmount = totalAmount / 12; // Simple average
      
      // Calculate actual amount for current period
      const actualAmount = calculateActualAmount(category, activePeriod, selectedMonth, selectedQuarter, selectedYear);
      
      return {
        id: category.toLowerCase().replace(/\s+/g, '_'),
        name: category,
        plannedAmount: avgMonthlyAmount,
        actualAmount,
        variance: actualAmount - avgMonthlyAmount,
        variancePercent: avgMonthlyAmount > 0 ? ((actualAmount - avgMonthlyAmount) / avgMonthlyAmount) * 100 : 0
      };
    });
  });
  
  // Calculate actual amount spent for a category in the selected period
  const calculateActualAmount = (category: string, period: 'monthly' | 'quarterly' | 'annual', month: string, quarter: string, year: number) => {
    let filteredRecords = records.filter(r => r.category === category);
    
    // Filter by period
    if (period === 'monthly') {
      filteredRecords = filteredRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getFullYear() === parseInt(month.split('-')[0]) && 
               recordDate.getMonth() === parseInt(month.split('-')[1]) - 1;
      });
    } else if (period === 'quarterly') {
      const quarterNumber = parseInt(quarter.split('Q')[1]);
      const startMonth = (quarterNumber - 1) * 3;
      const endMonth = startMonth + 2;
      
      filteredRecords = filteredRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getFullYear() === parseInt(quarter.split('-')[0]) && 
               recordDate.getMonth() >= startMonth && recordDate.getMonth() <= endMonth;
      });
    } else if (period === 'annual') {
      filteredRecords = filteredRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getFullYear() === year;
      });
    }
    
    return filteredRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.amount)), 0);
  };
  
  // Update budget category planned amount
  const updatePlannedAmount = (id: string, amount: number) => {
    setBudgetCategories(prev => 
      prev.map(cat => 
        cat.id === id 
          ? { 
              ...cat, 
              plannedAmount: amount,
              variance: cat.actualAmount - amount,
              variancePercent: amount > 0 ? ((cat.actualAmount - amount) / amount) * 100 : 0
            } 
          : cat
      )
    );
  };
  
  // Generate chart data
  const chartData = budgetCategories.map(cat => ({
    name: cat.name,
    planned: cat.plannedAmount,
    actual: cat.actualAmount,
    variance: cat.variance
  }));
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-lg mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex justify-between items-center gap-4">
              <span className="font-medium text-blue-600">Planned:</span>
              <span className="font-bold">{formatCurrency(payload[0].value)}</span>
            </p>
            <p className="flex justify-between items-center gap-4">
              <span className="font-medium text-green-600">Actual:</span>
              <span className="font-bold">{formatCurrency(payload[1].value)}</span>
            </p>
            <p className="flex justify-between items-center gap-4">
              <span className="font-medium text-red-600">Variance:</span>
              <span className={`font-bold ${payload[2].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(payload[2].value)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Budget Planner
            </CardTitle>
            <CardDescription>
              Plan and track your budget against actual spending
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="planner">Budget Planner</TabsTrigger>
            <TabsTrigger value="analysis">Variance Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="planner" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="w-full md:w-1/3">
                <div className="space-y-4">
                  <div>
                    <Label>Budget Period</Label>
                    <Select 
                      value={activePeriod} 
                      onValueChange={(value) => setActivePeriod(value as 'monthly' | 'quarterly' | 'annual')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {activePeriod === 'monthly' && (
                    <div>
                      <Label>Month</Label>
                      <Input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                      />
                    </div>
                  )}
                  
                  {activePeriod === 'quarterly' && (
                    <div>
                      <Label>Quarter</Label>
                      <Select 
                        value={selectedQuarter} 
                        onValueChange={setSelectedQuarter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={`${selectedYear}-Q1`}>Q1 {selectedYear}</SelectItem>
                          <SelectItem value={`${selectedYear}-Q2`}>Q2 {selectedYear}</SelectItem>
                          <SelectItem value={`${selectedYear}-Q3`}>Q3 {selectedYear}</SelectItem>
                          <SelectItem value={`${selectedYear}-Q4`}>Q4 {selectedYear}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {activePeriod === 'annual' && (
                    <div>
                      <Label>Year</Label>
                      <Input 
                        type="number" 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
                        min={2020} 
                        max={2030} 
                      />
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Budget Categories</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {budgetCategories.map((category) => (
                        <div key={category.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>{category.name}</Label>
                            <span className="text-sm font-medium">
                              {formatCurrency(category.plannedAmount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Slider
                              defaultValue={[category.plannedAmount]}
                              max={category.plannedAmount * 2}
                              step={100}
                              onValueChange={(value) => updatePlannedAmount(category.id, value[0])}
                            />
                            <Input
                              type="number"
                              value={category.plannedAmount}
                              onChange={(e) => updatePlannedAmount(category.id, parseFloat(e.target.value))}
                              className="w-24"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-2/3">
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="planned" name="Planned" fill="#8884d8" />
                      <Bar dataKey="actual" name="Actual" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.actualAmount, 0))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Net Variance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${budgetCategories.reduce((sum, cat) => sum + cat.variance, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.variance, 0))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="rounded-md border">
                <div className="p-4">
                  <h3 className="font-medium mb-2">Budget Variance Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left font-medium">Category</th>
                        <th className="p-2 text-right font-medium">Planned</th>
                        <th className="p-2 text-right font-medium">Actual</th>
                        <th className="p-2 text-right font-medium">Variance</th>
                        <th className="p-2 text-right font-medium">Variance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetCategories.map((category) => (
                        <tr key={category.id} className="border-t hover:bg-muted/50">
                          <td className="p-2">{category.name}</td>
                          <td className="p-2 text-right">{formatCurrency(category.plannedAmount)}</td>
                          <td className="p-2 text-right">{formatCurrency(category.actualAmount)}</td>
                          <td className={`p-2 text-right ${category.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(category.variance)}
                          </td>
                          <td className={`p-2 text-right ${category.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {category.variancePercent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-medium">
                        <td className="p-2">Total</td>
                        <td className="p-2 text-right">{formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0))}</td>
                        <td className="p-2 text-right">{formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.actualAmount, 0))}</td>
                        <td className={`p-2 text-right ${budgetCategories.reduce((sum, cat) => sum + cat.variance, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.variance, 0))}
                        </td>
                        <td className="p-2 text-right"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BudgetPlanner;