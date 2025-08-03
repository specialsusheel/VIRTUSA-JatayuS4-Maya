import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/config/currency";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Target, TrendingUp, Calculator, Calendar, Landmark, Home, GraduationCap, Car, Plane } from "lucide-react";

interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  interestRate: number;
  timeframe: number; // in months
  icon: React.ReactNode;
}

const StrategicFinancialPlanning: React.FC = () => {
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([
    {
      id: 'retirement',
      name: 'Retirement',
      targetAmount: 1000000,
      currentAmount: 150000,
      monthlyContribution: 1500,
      interestRate: 7,
      timeframe: 300, // 25 years
      icon: <Landmark className="h-5 w-5" />
    },
    {
      id: 'home',
      name: 'Home Purchase',
      targetAmount: 100000,
      currentAmount: 35000,
      monthlyContribution: 1000,
      interestRate: 3,
      timeframe: 60, // 5 years
      icon: <Home className="h-5 w-5" />
    },
    {
      id: 'education',
      name: 'Education Fund',
      targetAmount: 80000,
      currentAmount: 15000,
      monthlyContribution: 500,
      interestRate: 5,
      timeframe: 120, // 10 years
      icon: <GraduationCap className="h-5 w-5" />
    },
    {
      id: 'vehicle',
      name: 'Vehicle Purchase',
      targetAmount: 35000,
      currentAmount: 10000,
      monthlyContribution: 700,
      interestRate: 2,
      timeframe: 36, // 3 years
      icon: <Car className="h-5 w-5" />
    },
    {
      id: 'vacation',
      name: 'Dream Vacation',
      targetAmount: 15000,
      currentAmount: 3000,
      monthlyContribution: 500,
      interestRate: 1.5,
      timeframe: 24, // 2 years
      icon: <Plane className="h-5 w-5" />
    }
  ]);
  
  // Calculate the projected growth for a goal
  const calculateProjection = (goal: FinancialGoal) => {
    const data = [];
    let balance = goal.currentAmount;
    const monthlyRate = goal.interestRate / 100 / 12;
    
    // Calculate projection for each month
    for (let month = 0; month <= goal.timeframe; month++) {
      // Only add data points for specific intervals to keep the chart clean
      if (month === 0 || month % Math.max(1, Math.floor(goal.timeframe / 12)) === 0 || month === goal.timeframe) {
        const date = new Date();
        date.setMonth(date.getMonth() + month);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        data.push({
          month: formattedDate,
          balance: balance,
          goal: goal.targetAmount
        });
      }
      
      // Update balance for next month
      balance = balance * (1 + monthlyRate) + goal.monthlyContribution;
    }
    
    return data;
  };
  
  // Calculate the time to reach the goal
  const calculateTimeToGoal = (goal: FinancialGoal) => {
    let balance = goal.currentAmount;
    const monthlyRate = goal.interestRate / 100 / 12;
    let months = 0;
    
    while (balance < goal.targetAmount && months < 600) { // Cap at 50 years
      balance = balance * (1 + monthlyRate) + goal.monthlyContribution;
      months++;
    }
    
    return months;
  };
  
  // Calculate the required monthly contribution to reach the goal in the specified timeframe
  const calculateRequiredContribution = (goal: FinancialGoal) => {
    const monthlyRate = goal.interestRate / 100 / 12;
    const futureValueOfCurrentBalance = goal.currentAmount * Math.pow(1 + monthlyRate, goal.timeframe);
    const amountNeeded = goal.targetAmount - futureValueOfCurrentBalance;
    
    // PMT formula: PMT = (PV * r * (1+r)^n) / ((1+r)^n - 1)
    // Where PV is present value (amount needed), r is rate, n is number of periods
    const numerator = amountNeeded * monthlyRate * Math.pow(1 + monthlyRate, goal.timeframe);
    const denominator = Math.pow(1 + monthlyRate, goal.timeframe) - 1;
    
    return numerator / denominator;
  };
  
  // Update a goal's property
  const updateGoal = (id: string, property: keyof FinancialGoal, value: number) => {
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        return { ...goal, [property]: value };
      }
      return goal;
    }));
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            Balance: <span className="font-bold">{formatCurrency(payload[0].value)}</span>
          </p>
          <p className="text-sm text-blue-600">
            Goal: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Calculate progress percentage
  const calculateProgress = (goal: FinancialGoal) => {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  };
  
  // Format timeframe in years and months
  const formatTimeframe = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };
  
  // Get the active goal or the first goal if none is selected
  const activeGoal = activeGoalId ? goals.find(g => g.id === activeGoalId) : goals[0];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategic Financial Planning
        </CardTitle>
        <CardDescription>
          Plan and track your progress towards important financial goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={goals[0].id} value={activeGoalId || goals[0].id} onValueChange={setActiveGoalId} className="w-full">
          <TabsList className="w-full flex overflow-auto">
            {goals.map((goal) => (
              <TabsTrigger key={goal.id} value={goal.id} className="flex-1 flex items-center gap-1">
                {goal.icon}
                {goal.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {goals.map((goal) => (
            <TabsContent key={goal.id} value={goal.id} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Current: {formatCurrency(goal.currentAmount)}</span>
                          <span className="text-sm font-medium">Target: {formatCurrency(goal.targetAmount)}</span>
                        </div>
                        
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full" 
                            style={{ width: `${calculateProgress(goal)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">{calculateProgress(goal)}% Complete</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Adjust Your Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor={`target-${goal.id}`}>Target Amount</Label>
                            <span className="text-sm font-medium">{formatCurrency(goal.targetAmount)}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Slider
                              id={`target-${goal.id}`}
                              min={goal.currentAmount}
                              max={goal.targetAmount * 2}
                              step={1000}
                              value={[goal.targetAmount]}
                              onValueChange={(value) => updateGoal(goal.id, 'targetAmount', value[0])}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor={`contribution-${goal.id}`}>Monthly Contribution</Label>
                            <span className="text-sm font-medium">{formatCurrency(goal.monthlyContribution)}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Slider
                              id={`contribution-${goal.id}`}
                              min={0}
                              max={goal.monthlyContribution * 3}
                              step={50}
                              value={[goal.monthlyContribution]}
                              onValueChange={(value) => updateGoal(goal.id, 'monthlyContribution', value[0])}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor={`interest-${goal.id}`}>Expected Annual Return</Label>
                            <span className="text-sm font-medium">{goal.interestRate}%</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Slider
                              id={`interest-${goal.id}`}
                              min={0}
                              max={12}
                              step={0.5}
                              value={[goal.interestRate]}
                              onValueChange={(value) => updateGoal(goal.id, 'interestRate', value[0])}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor={`timeframe-${goal.id}`}>Timeframe</Label>
                            <span className="text-sm font-medium">{formatTimeframe(goal.timeframe)}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Slider
                              id={`timeframe-${goal.id}`}
                              min={1}
                              max={goal.timeframe * 2}
                              step={1}
                              value={[goal.timeframe]}
                              onValueChange={(value) => updateGoal(goal.id, 'timeframe', value[0])}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Projection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={calculateProjection(goal)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="balance" 
                              name="Projected Balance" 
                              stroke="#3b82f6" 
                              activeDot={{ r: 8 }} 
                              strokeWidth={2}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="goal" 
                              name="Goal Amount" 
                              stroke="#6b7280" 
                              strokeDasharray="5 5" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Estimated Completion</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeframe(calculateTimeToGoal(goal))} at current contribution rate
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Calculator className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Recommended Monthly Contribution</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(calculateRequiredContribution(goal))} to reach goal in {formatTimeframe(goal.timeframe)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Total Contributions</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(goal.monthlyContribution * goal.timeframe)} over {formatTimeframe(goal.timeframe)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Projected Growth</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(calculateProjection(goal)[calculateProjection(goal).length - 1].balance - goal.currentAmount - (goal.monthlyContribution * goal.timeframe))} from investment returns
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategicFinancialPlanning;