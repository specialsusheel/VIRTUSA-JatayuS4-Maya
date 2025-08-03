import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FinancialRecord } from '@/types/financial';
import { formatCurrency } from '@/config/currency';

interface ExpenseDistributionChartProps {
  records: FinancialRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FCCDE5', '#FB8072'];

const ExpenseDistributionChart: React.FC<ExpenseDistributionChartProps> = ({ records }) => {
  // Calculate distribution by main financial categories
  const expenseData = useMemo(() => {
    // Group by main financial categories
    const mainCategories = ['income', 'expense', 'equity', 'liability', 'asset'];
    
    const categorizedData = mainCategories.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Sum amounts by category
    records.forEach(record => {
      const category = record.category.toLowerCase();
      if (mainCategories.includes(category)) {
        categorizedData[category] += Math.abs(parseFloat(record.amount));
      }
    });
    
    // Convert to array format for recharts
    const result = Object.entries(categorizedData)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        value
      }))
      .filter(item => item.value > 0) // Only include categories with values
      .sort((a, b) => b.value - a.value); // Sort by value descending
    
    return result;
  }, [records]);
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p>{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {expenseData.length > 0 ? (
        <PieChart>
          <Pie
            data={expenseData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {expenseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No expense data available</p>
        </div>
      )}
    </ResponsiveContainer>
  );
};

export default ExpenseDistributionChart;