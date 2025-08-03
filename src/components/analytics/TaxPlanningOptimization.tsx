import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/config/currency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Calculator, Receipt, TrendingDown, Landmark, FileText, PiggyBank, Coins, DollarSign, BarChart3 } from "lucide-react";
import { FinancialRecord } from "@/types/financial";

interface TaxBracket {
  rate: number;
  min: number;
  max: number | null;
  label: string;
}

interface DeductionCategory {
  id: string;
  name: string;
  amount: number;
  eligible: boolean;
  description: string;
}

interface TaxScenario {
  id: string;
  name: string;
  income: number;
  deductions: DeductionCategory[];
  taxCredits: number;
  taxableIncome: number;
  estimatedTax: number;
  effectiveRate: number;
}

interface TaxPlanningOptimizationProps {
  records?: FinancialRecord[];
}

const TaxPlanningOptimization: React.FC<TaxPlanningOptimizationProps> = ({ records = [] }) => {
  // Tax brackets (simplified for demonstration)
  const taxBrackets: TaxBracket[] = [
    { rate: 0.10, min: 0, max: 11000, label: '10%' },
    { rate: 0.12, min: 11000, max: 44725, label: '12%' },
    { rate: 0.22, min: 44725, max: 95375, label: '22%' },
    { rate: 0.24, min: 95375, max: 182100, label: '24%' },
    { rate: 0.32, min: 182100, max: 231250, label: '32%' },
    { rate: 0.35, min: 231250, max: 578125, label: '35%' },
    { rate: 0.37, min: 578125, max: null, label: '37%' },
  ];
  
  // State for scenarios
  const [scenarios, setScenarios] = useState<TaxScenario[]>([
    {
      id: 'current',
      name: 'Current Scenario',
      income: 85000,
      deductions: [
        { id: 'standard', name: 'Standard Deduction', amount: 13850, eligible: true, description: 'Basic deduction available to all taxpayers' },
        { id: 'mortgage', name: 'Mortgage Interest', amount: 8500, eligible: true, description: 'Interest paid on home mortgage' },
        { id: 'charity', name: 'Charitable Contributions', amount: 2500, eligible: true, description: 'Donations to qualified organizations' },
        { id: 'medical', name: 'Medical Expenses', amount: 4000, eligible: false, description: 'Expenses exceeding 7.5% of AGI' },
        { id: 'retirement', name: 'Retirement Contributions', amount: 6000, eligible: true, description: 'Contributions to qualified retirement accounts' },
        { id: 'education', name: 'Education Expenses', amount: 2000, eligible: true, description: 'Qualified education expenses' },
      ],
      taxCredits: 1000,
      taxableIncome: 0, // Calculated
      estimatedTax: 0, // Calculated
      effectiveRate: 0, // Calculated
    },
    {
      id: 'optimized',
      name: 'Optimized Scenario',
      income: 85000,
      deductions: [
        { id: 'standard', name: 'Standard Deduction', amount: 13850, eligible: true, description: 'Basic deduction available to all taxpayers' },
        { id: 'mortgage', name: 'Mortgage Interest', amount: 8500, eligible: true, description: 'Interest paid on home mortgage' },
        { id: 'charity', name: 'Charitable Contributions', amount: 5000, eligible: true, description: 'Donations to qualified organizations' },
        { id: 'medical', name: 'Medical Expenses', amount: 4000, eligible: true, description: 'Expenses exceeding 7.5% of AGI' },
        { id: 'retirement', name: 'Retirement Contributions', amount: 20500, eligible: true, description: 'Maximized 401(k) contributions' },
        { id: 'education', name: 'Education Expenses', amount: 2000, eligible: true, description: 'Qualified education expenses' },
      ],
      taxCredits: 2500,
      taxableIncome: 0, // Calculated
      estimatedTax: 0, // Calculated
      effectiveRate: 0, // Calculated
    },
  ]);
  
  const [activeScenario, setActiveScenario] = useState<string>('current');
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // Calculate tax based on income and brackets
  const calculateTax = (taxableIncome: number) => {
    let tax = 0;
    
    for (let i = 0; i < taxBrackets.length; i++) {
      const bracket = taxBrackets[i];
      const nextBracket = taxBrackets[i + 1];
      
      if (taxableIncome > bracket.min) {
        const bracketMax = bracket.max !== null ? bracket.max : Infinity;
        const incomeInBracket = Math.min(taxableIncome, bracketMax) - bracket.min;
        tax += incomeInBracket * bracket.rate;
        
        if (bracket.max !== null && taxableIncome >= bracket.max) {
          continue;
        } else {
          break;
        }
      }
    }
    
    return tax;
  };
  
  // Calculate taxable income, tax, and effective rate for all scenarios
  const calculatedScenarios = useMemo(() => {
    return scenarios.map(scenario => {
      const eligibleDeductions = scenario.deductions
        .filter(d => d.eligible)
        .reduce((sum, d) => sum + d.amount, 0);
      
      const taxableIncome = Math.max(0, scenario.income - eligibleDeductions);
      const estimatedTax = Math.max(0, calculateTax(taxableIncome) - scenario.taxCredits);
      const effectiveRate = scenario.income > 0 ? (estimatedTax / scenario.income) * 100 : 0;
      
      return {
        ...scenario,
        taxableIncome,
        estimatedTax,
        effectiveRate
      };
    });
  }, [scenarios]);
  
  // Get the active scenario
  const activeScenarioData = useMemo(() => {
    return calculatedScenarios.find(s => s.id === activeScenario) || calculatedScenarios[0];
  }, [calculatedScenarios, activeScenario]);
  
  // Update scenario field
  const updateScenario = (scenarioId: string, field: keyof TaxScenario, value: any) => {
    setScenarios(prevScenarios => {
      return prevScenarios.map(scenario => {
        if (scenario.id === scenarioId) {
          return { ...scenario, [field]: value };
        }
        return scenario;
      });
    });
  };
  
  // Update deduction
  const updateDeduction = (scenarioId: string, deductionId: string, field: keyof DeductionCategory, value: any) => {
    setScenarios(prevScenarios => {
      return prevScenarios.map(scenario => {
        if (scenario.id === scenarioId) {
          const updatedDeductions = scenario.deductions.map(deduction => {
            if (deduction.id === deductionId) {
              return { ...deduction, [field]: value };
            }
            return deduction;
          });
          return { ...scenario, deductions: updatedDeductions };
        }
        return scenario;
      });
    });
  };
  
  // Prepare data for the tax breakdown chart
  const taxBreakdownData = useMemo(() => {
    const data = [];
    let remainingIncome = activeScenarioData.taxableIncome;
    
    for (const bracket of taxBrackets) {
      if (remainingIncome <= 0) break;
      
      const bracketMax = bracket.max !== null ? bracket.max : Infinity;
      const incomeInBracket = Math.min(remainingIncome, bracketMax - bracket.min);
      
      if (incomeInBracket > 0) {
        const taxInBracket = incomeInBracket * bracket.rate;
        data.push({
          name: `${bracket.label} Bracket`,
          value: taxInBracket,
          rate: bracket.rate,
          income: incomeInBracket,
        });
        
        remainingIncome -= incomeInBracket;
      }
    }
    
    // Add tax credits if any
    if (activeScenarioData.taxCredits > 0) {
      data.push({
        name: 'Tax Credits',
        value: -activeScenarioData.taxCredits,
        rate: 0,
        income: 0,
      });
    }
    
    return data;
  }, [activeScenarioData, taxBrackets]);
  
  // Prepare data for the deductions pie chart
  const deductionsChartData = useMemo(() => {
    return activeScenarioData.deductions
      .filter(d => d.eligible && d.amount > 0)
      .map(d => ({
        name: d.name,
        value: d.amount,
      }));
  }, [activeScenarioData]);
  
  // Custom tooltip for the tax breakdown chart
  const TaxBreakdownTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          {data.name !== 'Tax Credits' ? (
            <>
              <p className="text-sm">Rate: <span className="font-bold">{(data.rate * 100).toFixed(1)}%</span></p>
              <p className="text-sm">Income in bracket: <span className="font-bold">{formatCurrency(data.income)}</span></p>
              <p className="text-sm">Tax amount: <span className="font-bold">{formatCurrency(data.value)}</span></p>
            </>
          ) : (
            <p className="text-sm">Amount: <span className="font-bold text-green-500">{formatCurrency(Math.abs(data.value))}</span></p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for the deductions chart
  const DeductionsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Amount: <span className="font-bold">{formatCurrency(data.value)}</span></p>
          <p className="text-sm">Percentage: <span className="font-bold">
            {((data.value / activeScenarioData.deductions.filter(d => d.eligible).reduce((sum, d) => sum + d.amount, 0)) * 100).toFixed(1)}%
          </span></p>
        </div>
      );
    }
    return null;
  };
  
  // Calculate tax savings between scenarios
  const taxSavings = useMemo(() => {
    const currentScenario = calculatedScenarios.find(s => s.id === 'current');
    const optimizedScenario = calculatedScenarios.find(s => s.id === 'optimized');
    
    if (currentScenario && optimizedScenario) {
      return currentScenario.estimatedTax - optimizedScenario.estimatedTax;
    }
    
    return 0;
  }, [calculatedScenarios]);
  
  // Generate tax optimization tips
  const taxTips = useMemo(() => {
    const tips = [];
    
    // Retirement contributions tip
    const currentRetirement = calculatedScenarios.find(s => s.id === 'current')?.deductions.find(d => d.id === 'retirement');
    if (currentRetirement && currentRetirement.amount < 22500) { // 2023 401(k) limit
      tips.push({
        icon: <PiggyBank className="h-5 w-5 text-blue-500" />,
        title: 'Maximize Retirement Contributions',
        description: `Increasing your 401(k) or IRA contributions can reduce your taxable income. You could contribute up to ${formatCurrency(22500 - currentRetirement.amount)} more.`
      });
    }
    
    // Charitable contributions tip
    const currentCharity = calculatedScenarios.find(s => s.id === 'current')?.deductions.find(d => d.id === 'charity');
    if (currentCharity) {
      tips.push({
        icon: <Landmark className="h-5 w-5 text-blue-500" />,
        title: 'Charitable Giving',
        description: 'Consider bunching charitable contributions in alternating years to exceed the standard deduction threshold.'
      });
    }
    
    // Tax credits tip
    const currentCredits = calculatedScenarios.find(s => s.id === 'current')?.taxCredits;
    if (currentCredits && currentCredits < 2000) {
      tips.push({
        icon: <Coins className="h-5 w-5 text-blue-500" />,
        title: 'Explore Available Tax Credits',
        description: 'Look into education credits, child tax credits, or energy efficiency credits that you may qualify for.'
      });
    }
    
    // Medical expenses tip
    const currentMedical = calculatedScenarios.find(s => s.id === 'current')?.deductions.find(d => d.id === 'medical');
    if (currentMedical && !currentMedical.eligible) {
      tips.push({
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        title: 'Medical Expense Timing',
        description: 'Consider bunching medical procedures in a single year to exceed the 7.5% AGI threshold for deductibility.'
      });
    }
    
    return tips;
  }, [calculatedScenarios]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Tax Planning & Optimization
        </CardTitle>
        <CardDescription>
          Analyze your tax situation and identify strategies to minimize your tax burden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" value={activeScenario} onValueChange={setActiveScenario} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {calculatedScenarios.map((scenario) => (
                <TabsTrigger key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'View Mode' : 'Edit Scenario'}
            </Button>
          </div>
          
          {calculatedScenarios.map((scenario) => (
            <TabsContent key={scenario.id} value={scenario.id} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                      {editMode ? (
                        <Input
                          type="number"
                          value={scenario.income}
                          onChange={(e) => updateScenario(scenario.id, 'income', Number(e.target.value))}
                          className="w-32"
                        />
                      ) : (
                        <span className="text-2xl font-bold">{formatCurrency(scenario.income)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-muted-foreground mr-2" />
                      <span className="text-2xl font-bold">{formatCurrency(scenario.estimatedTax)}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Effective Rate: {scenario.effectiveRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tax Credits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingDown className="h-5 w-5 text-green-500 mr-2" />
                      {editMode ? (
                        <Input
                          type="number"
                          value={scenario.taxCredits}
                          onChange={(e) => updateScenario(scenario.id, 'taxCredits', Number(e.target.value))}
                          className="w-32"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-green-500">{formatCurrency(scenario.taxCredits)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Deductions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto max-h-[300px]">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Deduction</th>
                            <th className="text-right py-2">Amount</th>
                            <th className="text-center py-2">Eligible</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scenario.deductions.map((deduction) => (
                            <tr key={deduction.id} className="border-b hover:bg-gray-50">
                              <td className="py-2">
                                <div className="font-medium">{deduction.name}</div>
                                <div className="text-xs text-muted-foreground">{deduction.description}</div>
                              </td>
                              <td className="text-right py-2">
                                {editMode ? (
                                  <Input
                                    type="number"
                                    value={deduction.amount}
                                    onChange={(e) => updateDeduction(scenario.id, deduction.id, 'amount', Number(e.target.value))}
                                    className="w-24 inline-block text-right"
                                  />
                                ) : (
                                  formatCurrency(deduction.amount)
                                )}
                              </td>
                              <td className="text-center py-2">
                                {editMode ? (
                                  <input
                                    type="checkbox"
                                    checked={deduction.eligible}
                                    onChange={(e) => updateDeduction(scenario.id, deduction.id, 'eligible', e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                ) : (
                                  <Badge variant={deduction.eligible ? 'success' : 'secondary'}>
                                    {deduction.eligible ? 'Yes' : 'No'}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold">
                            <td className="py-2">Total Eligible Deductions</td>
                            <td className="text-right py-2" colSpan={2}>
                              {formatCurrency(scenario.deductions
                                .filter(d => d.eligible)
                                .reduce((sum, d) => sum + d.amount, 0))}
                            </td>
                          </tr>
                          <tr className="font-bold">
                            <td className="py-2">Taxable Income</td>
                            <td className="text-right py-2" colSpan={2}>
                              {formatCurrency(scenario.taxableIncome)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tax Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={taxBreakdownData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<TaxBreakdownTooltip />} />
                            <Bar dataKey="value" name="Tax Amount">
                              {taxBreakdownData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.name === 'Tax Credits' ? '#22c55e' : '#3b82f6'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {scenario.id === 'optimized' && (
                    <Card className="bg-green-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Potential Tax Savings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <TrendingDown className="h-6 w-6 text-green-500 mr-2" />
                          <span className="text-2xl font-bold text-green-500">{formatCurrency(taxSavings)}</span>
                        </div>
                        <div className="mt-2 text-sm">
                          By implementing the optimized tax strategy, you could save approximately {formatCurrency(taxSavings)} in taxes.
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              
              {scenario.id === 'current' && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tax Optimization Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {taxTips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          {tip.icon}
                          <div>
                            <h4 className="font-medium">{tip.title}</h4>
                            <p className="text-sm text-muted-foreground">{tip.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TaxPlanningOptimization;