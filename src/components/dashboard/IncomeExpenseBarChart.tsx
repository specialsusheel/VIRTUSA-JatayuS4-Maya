import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { FinancialRecord } from '@/types/financial';
import { formatCurrency } from '@/config/currency';

interface IncomeExpenseBarChartProps {
  records: FinancialRecord[];
}

const IncomeExpenseBarChart: React.FC<IncomeExpenseBarChartProps> = ({ records }) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    // Get the last 6 months of data
    const now = new Date();
    const monthsData: Record<string, { 
      month: string, 
      income: number, 
      expense: number, 
      asset: number, 
      liability: number, 
      equity: number,
      netCashFlow: number,
      netWorth: number
    }> = {};
    
    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthsData[monthKey] = { 
        month: monthName, 
        income: 0, 
        expense: 0, 
        asset: 0, 
        liability: 0, 
        equity: 0,
        netCashFlow: 0,
        netWorth: 0
      };
    }
    
    // Categorize records by month and main financial categories
    records.forEach(record => {
      const recordDate = record.date.substring(0, 7); // YYYY-MM format
      if (monthsData[recordDate]) {
        const amount = Math.abs(parseFloat(record.amount));
        const category = record.category.toLowerCase();
        
        // Check for main financial categories
        if (['income', 'expense', 'asset', 'liability', 'equity'].includes(category)) {
          monthsData[recordDate][category as keyof typeof monthsData[typeof recordDate]] += amount;
        }
      }
    });
    
    // Calculate net cash flow and net worth for each month
    Object.keys(monthsData).forEach(monthKey => {
      const month = monthsData[monthKey];
      month.netCashFlow = month.income - month.expense;
      month.netWorth = month.asset - month.liability;
    });
    
    // Convert to array and sort by date
    return Object.values(monthsData)
      .sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
  }, [records]);
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium text-lg mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any) => (
              <p key={entry.name} className="flex justify-between items-center gap-4">
                <span style={{ color: entry.color }} className="font-medium flex items-center">
                  <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></span>
                  {entry.name}:
                </span>
                <span className="font-bold" style={{ color: entry.color }}>
                  {formatCurrency(entry.value)}
                </span>
              </p>
            ))}
          </div>
          {payload.some(p => p.dataKey === 'income') && payload.some(p => p.dataKey === 'expense') && (
            <div className="mt-2 pt-2 border-t">
              <p className="flex justify-between items-center">
                <span className="font-medium">Net Cash Flow:</span>
                <span className={`font-bold ${payload[0].payload.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(payload[0].payload.netCashFlow)}
                </span>
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Define chart colors
  const chartColors = {
    income: "#10B981",    // Green
    expense: "#F59E0B",   // Amber
    asset: "#3B82F6",     // Blue
    liability: "#EF4444", // Red
    equity: "#8B5CF6",    // Purple
    netCashFlow: "#059669", // Darker green
    netWorth: "#2563EB"     // Darker blue
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        barGap={8}
        barSize={24}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
        <XAxis 
          dataKey="month" 
          axisLine={{ stroke: '#d1d5db' }} 
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value)} 
          axisLine={{ stroke: '#d1d5db' }}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          width={80}
        />
        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{ fill: 'rgba(224, 231, 255, 0.2)' }}
        />
        <Legend 
          verticalAlign="top" 
          height={36} 
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingBottom: '10px' }}
        />
        <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={1} />
        <Bar dataKey="income" name="Income" fill={chartColors.income} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill={chartColors.expense} radius={[4, 4, 0, 0]} />
        <Bar dataKey="asset" name="Asset" fill={chartColors.asset} radius={[4, 4, 0, 0]} />
        <Bar dataKey="liability" name="Liability" fill={chartColors.liability} radius={[4, 4, 0, 0]} />
        <Bar dataKey="equity" name="Equity" fill={chartColors.equity} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseBarChart;