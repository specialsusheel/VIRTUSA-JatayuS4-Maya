import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import { formatCurrency } from '@/config/currency';
import { ForecastPoint } from '@/utils/forecasting';

interface CashFlowForecastChartProps {
  historicalData?: ForecastPoint[];
  forecastData: ForecastPoint[];
}

const CashFlowForecastChart: React.FC<CashFlowForecastChartProps> = ({
  historicalData = [],
  forecastData,
}) => {
  // Combine historical and forecast data for a continuous chart
  const chartData = [...historicalData, ...forecastData].map(point => {
    // Handle different date formats
    let formattedMonth;
    
    if (point.date.includes('-')) {
      // Handle YYYY-MM format from historicalData
      const dateParts = point.date.split('-');
      const year = dateParts[0];
      const month = new Date(parseInt(year), parseInt(dateParts[1]) - 1, 1)
        .toLocaleString('default', { month: 'short' });
      formattedMonth = `${month} ${year.slice(2)}`; // Format as "Jan 23"
    } else {
      // Handle month format from forecastData (e.g., "January 2025")
      formattedMonth = point.date;
    }
    
    return {
      ...point,
      month: formattedMonth,
      // Add confidence intervals for the forecast
      upperBound: point.netCashFlow + (point.netCashFlow * (1 - (point.confidence || 0.5))),
      lowerBound: point.netCashFlow - (point.netCashFlow * (1 - (point.confidence || 0.5))),
      // Flag to identify forecast vs historical data
      isForecast: historicalData.indexOf(point) === -1
    };
  });

  // Custom tooltip to show detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isForecast = data.isForecast;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-lg mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex justify-between items-center gap-4">
              <span className="font-medium text-green-600 flex items-center">
                <span className="inline-block w-3 h-3 mr-2 bg-green-500"></span>
                Income:
              </span>
              <span className="font-bold text-green-600">
                {formatCurrency(data.income)}
              </span>
            </p>
            <p className="flex justify-between items-center gap-4">
              <span className="font-medium text-red-600 flex items-center">
                <span className="inline-block w-3 h-3 mr-2 bg-red-500"></span>
                Expenses:
              </span>
              <span className="font-bold text-red-600">
                {formatCurrency(data.expenses)}
              </span>
            </p>
            <div className="mt-2 pt-2 border-t">
              <p className="flex justify-between items-center">
                <span className="font-medium">Net Cash Flow:</span>
                <span className={`font-bold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netCashFlow)}
                </span>
              </p>
              {isForecast && (
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {Math.round(data.confidence * 100)}%
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
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
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingBottom: '10px' }}
        />
        <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={1} />
        
        {/* Data lines */}
        <Line 
          type="monotone" 
          dataKey="income" 
          name="Income" 
          stroke="#10B981" 
          strokeWidth={2} 
          dot={{ r: 4, strokeWidth: 1 }} 
          activeDot={{ r: 6, strokeWidth: 1 }}
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          name="Expenses" 
          stroke="#EF4444" 
          strokeWidth={2} 
          dot={{ r: 4, strokeWidth: 1 }} 
          activeDot={{ r: 6, strokeWidth: 1 }}
        />
        <Line 
          type="monotone" 
          dataKey="netCashFlow" 
          name="Net Cash Flow" 
          stroke="#6366F1" 
          strokeWidth={3} 
          dot={{ r: 5, strokeWidth: 1 }} 
          activeDot={{ r: 7, strokeWidth: 1 }}
        />
        
        {/* We've removed the Area components for confidence intervals as requested */}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CashFlowForecastChart;