import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { FinancialRecord } from "@/types/financial";
import { formatCurrency } from "@/config/currency";

interface CategoryPieChartProps {
  records: FinancialRecord[];
}

const COLORS = {
  asset: '#3B82F6',
  liability: '#EF4444',
  income: '#10B981',
  expense: '#F59E0B',
  equity: '#8B5CF6',
  deposit: '#14B8A6',
  food: '#F97316',
  education: '#6366F1',
  default: '#8884d8',
};

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ records }) => {
  // Only include the main financial categories: income, expense, equity, liability, asset
  const categoryTotals = records.reduce((acc, record) => {
    const category = record.category?.toLowerCase() || "uncategorized";
    // Only process the main financial categories
    if (['income', 'expense', 'equity', 'liability', 'asset'].includes(category)) {
      const amount = parseFloat(record.amount || "0");
      if (!acc[category]) acc[category] = 0;
      acc[category] += amount;
    }
    return acc;
  }, {} as Record<string, number>);

const totalValue = Object.values(categoryTotals)
  .reduce((a, b) => a + Math.abs(b), 0);

  const chartData = Object.entries(categoryTotals)
  .map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: Math.abs(amount), // ✅ FIX: Recharts needs positive values
    percentage: totalValue > 0 ? ((Math.abs(amount) / totalValue) * 100).toFixed(1) : "0.0",
  }))
  .filter(item => item.value !== 0);

  console.log("chartData:", chartData); // ✅ move outside JSX

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
<p className="text-sm">Value: {formatCurrency(Math.abs(data.value))}</p>
          <p className="text-sm">Percentage: {data.payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  if (records.length === 0 || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
             <Pie
  data={chartData}
  cx="50%"
  cy="50%"
  labelLine={false}
  outerRadius={80}
  dataKey="value"
  minAngle={10} // <-- Force visibility
  paddingAngle={5} // <-- Optional spacing between slices
  label={({ name, percentage }) => `${name} (${percentage}%)`}
>

                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || COLORS.default}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Summary */}
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Category Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {chartData.map((item) => (
              <div key={item.name} className="flex justify-between">
                <span>{item.name}:</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryPieChart;
