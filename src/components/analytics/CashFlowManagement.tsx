import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinancialRecord } from "@/types/financial";
import { formatCurrency } from "@/config/currency";
import { formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Calendar, DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface CashFlowManagementProps {
  records: FinancialRecord[];
  context: 'individual' | 'organization';
}

type TimeFrame = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ViewMode = 'inflow-outflow' | 'net-cash-flow' | 'cumulative';

const CashFlowManagement: React.FC<CashFlowManagementProps> = ({ records, context }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [viewMode, setViewMode] = useState<ViewMode>('inflow-outflow');
  
  // Process records to get cash flow data
  const cashFlowData = useMemo(() => {
    if (!records.length) return [];
    
    // Sort records by date
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Get date range
    const startDate = new Date(sortedRecords[0].date);
    const endDate = new Date(sortedRecords[sortedRecords.length - 1].date);
    
    // Generate time periods based on timeFrame
    const periods: { label: string; start: Date; end: Date }[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let periodEnd: Date;
      let periodLabel: string;
      
      if (timeFrame === 'weekly') {
        // Set to beginning of week (Sunday)
        currentDate = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
        periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 6); // Saturday
        periodLabel = `${formatDate(currentDate, 'MMM d')} - ${formatDate(periodEnd, 'MMM d')}`;
      } else if (timeFrame === 'monthly') {
        // Set to beginning of month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        periodLabel = formatDate(currentDate, 'MMM yyyy');
      } else if (timeFrame === 'quarterly') {
        // Set to beginning of quarter
        const quarter = Math.floor(currentDate.getMonth() / 3);
        currentDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
        periodLabel = `Q${quarter + 1} ${currentDate.getFullYear()}`;
      } else { // yearly
        // Set to beginning of year
        currentDate = new Date(currentDate.getFullYear(), 0, 1);
        periodEnd = new Date(currentDate.getFullYear(), 11, 31);
        periodLabel = currentDate.getFullYear().toString();
      }
      
      periods.push({
        label: periodLabel,
        start: new Date(currentDate),
        end: periodEnd
      });
      
      // Move to next period
      if (timeFrame === 'weekly') {
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
      } else if (timeFrame === 'monthly') {
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      } else if (timeFrame === 'quarterly') {
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
      } else { // yearly
        currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
      }
    }
    
    // Calculate cash flow for each period
    return periods.map(period => {
      const periodRecords = sortedRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= period.start && recordDate <= period.end;
      });
      
      const inflows = periodRecords
        .filter(record => {
          const category = record.category.toLowerCase();
          return category.includes('income') || 
                 category.includes('revenue') || 
                 category.includes('investment') || 
                 category.includes('loan');
        })
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      const outflows = periodRecords
        .filter(record => {
          const category = record.category.toLowerCase();
          return category.includes('expense') || 
                 category.includes('cost') || 
                 category.includes('payment') || 
                 category.includes('tax');
        })
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      const netCashFlow = inflows - outflows;
      
      return {
        period: period.label,
        inflows,
        outflows,
        netCashFlow
      };
    });
  }, [records, timeFrame]);
  
  // Calculate cumulative cash flow
  const cumulativeCashFlowData = useMemo(() => {
    let cumulative = 0;
    return cashFlowData.map(data => {
      cumulative += data.netCashFlow;
      return {
        ...data,
        cumulativeCashFlow: cumulative
      };
    });
  }, [cashFlowData]);
  
  // Calculate cash flow metrics
  const metrics = useMemo(() => {
    if (!cashFlowData.length) {
      return {
        totalInflows: 0,
        totalOutflows: 0,
        netCashFlow: 0,
        burnRate: 0,
        runway: 0,
        cashFlowTrend: 'stable' as 'increasing' | 'decreasing' | 'stable'
      };
    }
    
    const totalInflows = cashFlowData.reduce((sum, data) => sum + data.inflows, 0);
    const totalOutflows = cashFlowData.reduce((sum, data) => sum + data.outflows, 0);
    const netCashFlow = totalInflows - totalOutflows;
    
    // Calculate average monthly burn rate (for organizations)
    const monthlyOutflows = cashFlowData.map(data => data.outflows);
    const avgMonthlyBurn = monthlyOutflows.reduce((sum, outflow) => sum + outflow, 0) / monthlyOutflows.length;
    
    // Calculate runway in months (for organizations)
    // Assuming the last cumulative value represents current cash reserves
    const currentCashReserves = cumulativeCashFlowData[cumulativeCashFlowData.length - 1].cumulativeCashFlow;
    const runway = avgMonthlyBurn > 0 ? currentCashReserves / avgMonthlyBurn : 0;
    
    // Determine cash flow trend
    let cashFlowTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (cashFlowData.length >= 3) {
      const recentPeriods = cashFlowData.slice(-3);
      const firstNetCashFlow = recentPeriods[0].netCashFlow;
      const lastNetCashFlow = recentPeriods[recentPeriods.length - 1].netCashFlow;
      
      if (lastNetCashFlow > firstNetCashFlow * 1.1) { // 10% increase
        cashFlowTrend = 'increasing';
      } else if (lastNetCashFlow < firstNetCashFlow * 0.9) { // 10% decrease
        cashFlowTrend = 'decreasing';
      }
    }
    
    return {
      totalInflows,
      totalOutflows,
      netCashFlow,
      burnRate: avgMonthlyBurn,
      runway,
      cashFlowTrend
    };
  }, [cashFlowData, cumulativeCashFlowData]);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {viewMode === 'inflow-outflow' && (
            <>
              <p className="text-sm text-green-600">
                Inflows: {formatCurrency(payload[0].value)}
              </p>
              <p className="text-sm text-red-600">
                Outflows: {formatCurrency(Math.abs(payload[1].value))}
              </p>
            </>
          )}
          {viewMode === 'net-cash-flow' && (
            <p className="text-sm">
              Net Cash Flow: <span className={payload[0].value >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(payload[0].value)}
              </span>
            </p>
          )}
          {viewMode === 'cumulative' && (
            <p className="text-sm">
              Cumulative Cash Flow: <span className={payload[0].value >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(payload[0].value)}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Render the chart based on view mode
  const renderChart = () => {
    if (viewMode === 'inflow-outflow') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={cashFlowData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="inflows" name="Inflows" fill="#10b981" />
            <Bar dataKey="outflows" name="Outflows" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (viewMode === 'net-cash-flow') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={cashFlowData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="netCashFlow" name="Net Cash Flow">
              {cashFlowData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.netCashFlow >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    } else { // cumulative
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={cumulativeCashFlowData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="cumulativeCashFlow" name="Cumulative Cash Flow">
              {cumulativeCashFlowData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cumulativeCashFlow >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cash Flow Management
        </CardTitle>
        <CardDescription>
          Track and analyze your {context === 'individual' ? 'personal' : 'business'} cash flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'inflow-outflow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('inflow-outflow')}
              >
                Inflow/Outflow
              </Button>
              <Button 
                variant={viewMode === 'net-cash-flow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('net-cash-flow')}
              >
                Net Cash Flow
              </Button>
              <Button 
                variant={viewMode === 'cumulative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cumulative')}
              >
                Cumulative
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Inflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.totalInflows)}
                </div>
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Outflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(metrics.totalOutflows)}
                </div>
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${metrics.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.netCashFlow)}
                </div>
                <Badge variant={metrics.netCashFlow >= 0 ? 'default' : 'destructive'}>
                  {metrics.netCashFlow >= 0 ? 'Positive' : 'Negative'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {context === 'organization' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatCurrency(metrics.burnRate)}/{timeFrame === 'monthly' ? 'month' : timeFrame === 'quarterly' ? 'quarter' : 'year'}
                  </div>
                  <Badge variant={metrics.netCashFlow >= 0 ? 'outline' : 'destructive'}>
                    {metrics.netCashFlow >= 0 ? 'Sustainable' : 'Unsustainable'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {metrics.runway.toFixed(1)} months
                  </div>
                  <Badge variant={metrics.runway > 12 ? 'default' : metrics.runway > 6 ? 'outline' : 'destructive'}>
                    {metrics.runway > 12 ? (
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    ) : metrics.runway > 6 ? (
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    )}
                    {metrics.runway > 12 ? 'Healthy' : metrics.runway > 6 ? 'Caution' : 'Critical'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {metrics.cashFlowTrend === 'increasing' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : metrics.cashFlowTrend === 'decreasing' ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Activity className="h-5 w-5 text-blue-600" />
              )}
              <span className="font-medium">
                {metrics.cashFlowTrend === 'increasing' ? (
                  <span className="text-green-600">Improving cash flow</span>
                ) : metrics.cashFlowTrend === 'decreasing' ? (
                  <span className="text-red-600">Declining cash flow</span>
                ) : (
                  <span className="text-blue-600">Stable cash flow</span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Cash Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderChart()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.netCashFlow < 0 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <p className="text-sm">
                    Your cash flow is negative. Consider reducing non-essential expenses and finding ways to increase income.
                  </p>
                </div>
              )}
              
              {context === 'organization' && metrics.runway < 12 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <p className="text-sm">
                    Your cash runway is less than 12 months. Consider securing additional funding or reducing expenses to extend your runway.
                  </p>
                </div>
              )}
              
              {metrics.cashFlowTrend === 'decreasing' && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <p className="text-sm">
                    Your cash flow trend is declining. Review your recent financial activities to identify and address the causes.
                  </p>
                </div>
              )}
              
              {metrics.netCashFlow > 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <p className="text-sm">
                    Your cash flow is positive. Consider investing excess cash or building an emergency fund.
                  </p>
                </div>
              )}
              
              {context === 'organization' && metrics.runway > 18 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <p className="text-sm">
                    Your cash runway is healthy. Consider strategic investments to grow your business.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CashFlowManagement;