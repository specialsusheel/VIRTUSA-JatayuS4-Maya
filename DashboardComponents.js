import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "./UIComponents";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Download, Home, ChevronDown, ChevronUp, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useLocation, Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger, Calendar, Switch, Label } from "./UIComponents";
import ConnectWalletButton from "./UIComponents";
import { cn } from "./utils";
import { useTheme } from "./theme-provider";

// Gradient colors for different categories
const GRADIENTS = {
  Asset: 'bg-gradient-to-r from-blue-500 to-blue-600',
  Liability: 'bg-gradient-to-r from-red-500 to-red-600',
  Income: 'bg-gradient-to-r from-green-500 to-green-600',
  Expense: 'bg-gradient-to-r from-amber-500 to-amber-600',
  Equity: 'bg-gradient-to-r from-purple-500 to-purple-600'
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

// --- CategoryPieChart ---
function CategoryPieChart({ records }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const { theme } = useTheme();
  
  // Only include the 5 specified categories
  const allowedCategories = ['expense', 'income', 'equity', 'liability', 'asset'];
  
  const categoryTotals = records.reduce((acc, record) => {
    const category = record.category.toLowerCase();
    const amount = parseFloat(record.amount);
    
    // Only include allowed categories
    if (allowedCategories.includes(category)) {
      if (!acc[category]) acc[category] = 0;
      acc[category] += amount;
    }
    return acc;
  }, {});

  // Ensure all allowed categories are represented, even with 0 values
  allowedCategories.forEach(category => {
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
  });

  const totalAmount = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  
  const chartData = Object.entries(categoryTotals)
    .filter(([category, amount]) => amount > 0) // Only show categories with data
    .map(([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: amount,
      percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0,
    }));

  const COLORS = {
    Asset: '#3B82F6', Liability: '#EF4444', Income: '#10B981', Expense: '#F59E0B', Equity: '#8B5CF6',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background p-3 border rounded-lg shadow-xl backdrop-blur-sm"
        >
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Value: ${data.value.toFixed(2)}</p>
          <p className="text-sm">Percentage: {data.payload.percentage}%</p>
        </motion.div>
      );
    }
    return null;
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  if (records.length === 0) {
    return (
      <motion.div variants={cardVariants}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${GRADIENTS['Asset']}`} />
              Category Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 mb-2 animate-spin" />
              <p>No data available for the selected period</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cardVariants}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${GRADIENTS['Asset']}`} />
            Category Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={(props) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                    return (
                      <g>
                        <path 
                          d={`M${cx},${cy}L${cx + outerRadius * Math.cos(-startAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-startAngle * Math.PI / 180)}`} 
                          stroke={fill} 
                          strokeWidth={2}
                        />
                        <path 
                          d={`M${cx},${cy}L${cx + outerRadius * Math.cos(-endAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-endAngle * Math.PI / 180)}`} 
                          stroke={fill} 
                          strokeWidth={2}
                        />
                        <path 
                          d={`M${cx + innerRadius * Math.cos(-startAngle * Math.PI / 180)},${cy + innerRadius * Math.sin(-startAngle * Math.PI / 180)}
                              A${innerRadius},${innerRadius} 0 0,1 ${cx + innerRadius * Math.cos(-endAngle * Math.PI / 180)},${cy + innerRadius * Math.sin(-endAngle * Math.PI / 180)}
                              L${cx + outerRadius * Math.cos(-endAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-endAngle * Math.PI / 180)}
                              A${outerRadius},${outerRadius} 0 0,0 ${cx + outerRadius * Math.cos(-startAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-startAngle * Math.PI / 180)} Z`} 
                          fill={fill} 
                          onMouseEnter={() => onPieEnter(null, props.index)}
                          onMouseLeave={onPieLeave}
                        />
                      </g>
                    );
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name] || '#8884d8'} 
                      stroke={theme === 'dark' ? '#1e1e1e' : '#fff'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right" 
                  wrapperStyle={{ right: -20 }}
                  formatter={(value, entry, index) => (
                    <span className="text-sm">
                      {value} ({chartData[index].percentage}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">CATEGORY SUMMARY</h4>
            <div className="space-y-2">
              {chartData.map((item) => (
                <motion.div 
                  key={item.name}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${GRADIENTS[item.name] || 'bg-gray-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">${item.value.toFixed(2)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- ComparisonCards ---
function ComparisonCards({ period1Data, period2Data, period1Label, period2Label }) {
  const calculateMetrics = (data) => {
    const totals = { income: 0, expenses: 0, assets: 0, liabilities: 0 };
    data.forEach((record) => {
      const amount = parseFloat(record.amount);
      switch (record.category.toLowerCase()) {
        case 'income': totals.income += amount; break;
        case 'expense': totals.expenses += amount; break;
        case 'asset': totals.assets += amount; break;
        case 'liability': totals.liabilities += amount; break;
      }
    });
    return { ...totals, balance: totals.assets + totals.income - totals.liabilities - totals.expenses, activity: data.length };
  };

  const period1Metrics = calculateMetrics(period1Data);
  const period2Metrics = calculateMetrics(period2Data);

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const comparisonData = [
    { title: "Income", period1: period1Metrics.income, period2: period2Metrics.income, change: getPercentageChange(period1Metrics.income, period2Metrics.income), icon: TrendingUp },
    { title: "Expenses", period1: period1Metrics.expenses, period2: period2Metrics.expenses, change: getPercentageChange(period1Metrics.expenses, period2Metrics.expenses), icon: TrendingDown },
    { title: "Balance", period1: period1Metrics.balance, period2: period2Metrics.balance, change: getPercentageChange(period1Metrics.balance, period2Metrics.balance), icon: DollarSign },
    { title: "Activity", period1: period1Metrics.activity, period2: period2Metrics.activity, change: getPercentageChange(period1Metrics.activity, period2Metrics.activity), icon: Activity },
  ];

  return (
    <motion.div variants={cardVariants}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Period Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {comparisonData.map((item, index) => {
              const isPositive = item.change >= 0;
              const isActivityOrIncome = item.title === 'Activity' || item.title === 'Income';
              const changeColor = isActivityOrIncome 
                ? (isPositive ? 'text-green-500' : 'text-red-500')
                : (item.title === 'Expenses' 
                    ? (isPositive ? 'text-red-500' : 'text-green-500')
                    : (isPositive ? 'text-green-500' : 'text-red-500'));
              
              const Icon = item.icon;

              return (
                <motion.div 
                  key={index} 
                  whileHover={{ y: -2 }}
                  className="border rounded-xl p-4 bg-gradient-to-b from-background to-muted/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-2 ${changeColor}`} />
                      <h4 className="font-medium">{item.title}</h4>
                    </div>
                    <div className={`flex items-center ${changeColor}`}>
                      {isPositive ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                      <span className="font-medium">{Math.abs(item.change).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Badge variant="outline" className="mb-1 text-xs">{period1Label}</Badge>
                      <p className="font-medium text-lg">
                        {item.title === 'Activity' ? item.period1 : formatCurrency(item.period1)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="secondary" className="mb-1 text-xs">{period2Label}</Badge>
                      <p className="font-medium text-lg">
                        {item.title === 'Activity' ? item.period2 : formatCurrency(item.period2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- DateRangeFilter ---
function DateRangeFilter({ dateRange, setDateRange, comparisonMode, setComparisonMode, comparisonPeriods, setComparisonPeriods }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const clearFilters = () => {
    setDateRange({ startDate: null, endDate: null });
    setComparisonMode(false);
    setComparisonPeriods({ 
      period1: { start: null, end: null, label: "This Month" }, 
      period2: { start: null, end: null, label: "Last Month" } 
    });
  };

  const setQuickRange = (range) => {
    const now = new Date();
    let start, end, label = "";
    
    switch (range) {
      case 'thisMonth': 
        start = new Date(now.getFullYear(), now.getMonth(), 1); 
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        label = "This Month";
        break;
      case 'lastMonth': 
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1); 
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        label = "Last Month";
        break;
      case 'thisYear': 
        start = new Date(now.getFullYear(), 0, 1); 
        end = new Date(now.getFullYear(), 11, 31);
        label = "This Year";
        break;
      case 'lastYear': 
        start = new Date(now.getFullYear() - 1, 0, 1); 
        end = new Date(now.getFullYear() - 1, 11, 31);
        label = "Last Year";
        break;
    }
    
    setDateRange({ startDate: start, endDate: end, label });
    setComparisonMode(false);
  };

  const setComparisonRange = () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    setComparisonPeriods({ 
      period1: { start: thisMonthStart, end: thisMonthEnd, label: "This Month" }, 
      period2: { start: lastMonthStart, end: lastMonthEnd, label: "Last Month" } 
    });
    setComparisonMode(true);
  };

  const formatDate = (date) => {
    if (!date) return "Select date";
    return format(date, "MMM dd, yyyy");
  };

  return (
    <motion.div variants={fadeIn} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setQuickRange('thisMonth')}
          className="hover:bg-primary/10 transition-colors"
        >
          This Month
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setQuickRange('lastMonth')}
          className="hover:bg-primary/10 transition-colors"
        >
          Last Month
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setQuickRange('thisYear')}
          className="hover:bg-primary/10 transition-colors"
        >
          This Year
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setQuickRange('lastYear')}
          className="hover:bg-primary/10 transition-colors"
        >
          Last Year
        </Button>
        <Button 
          variant={comparisonMode ? "default" : "outline"} 
          size="sm" 
          onClick={setComparisonRange}
          className="hover:bg-primary/10 transition-colors"
        >
          Compare Months
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-[300px] justify-start text-left font-normal",
                !dateRange.startDate && "text-muted-foreground"
              )}
            >
              {dateRange.startDate ? (
                formatDate(dateRange.startDate)
              ) : (
                <span>Start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.startDate}
              onSelect={(date) => {
                setDateRange(prev => ({ ...prev, startDate: date }));
                setIsOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-[300px] justify-start text-left font-normal",
                !dateRange.endDate && "text-muted-foreground"
              )}
            >
              {dateRange.endDate ? (
                formatDate(dateRange.endDate)
              ) : (
                <span>End date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.endDate}
              onSelect={(date) => {
                setDateRange(prev => ({ ...prev, endDate: date }));
                setIsOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {comparisonMode && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 border rounded-lg bg-muted/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Comparison Periods</h4>
            <div className="flex items-center space-x-2">
              <Label htmlFor="comparison-mode">Comparison Mode</Label>
              <Switch
                id="comparison-mode"
                checked={comparisonMode}
                onCheckedChange={setComparisonMode}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period 1</Label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      {comparisonPeriods.period1.start ? format(comparisonPeriods.period1.start, "MMM dd") : "Start"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={comparisonPeriods.period1.start}
                      onSelect={(date) => setComparisonPeriods(prev => ({
                        ...prev,
                        period1: { ...prev.period1, start: date }
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span>to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      {comparisonPeriods.period1.end ? format(comparisonPeriods.period1.end, "MMM dd") : "End"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={comparisonPeriods.period1.end}
                      onSelect={(date) => setComparisonPeriods(prev => ({
                        ...prev,
                        period1: { ...prev.period1, end: date }
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Period 2</Label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      {comparisonPeriods.period2.start ? format(comparisonPeriods.period2.start, "MMM dd") : "Start"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={comparisonPeriods.period2.start}
                      onSelect={(date) => setComparisonPeriods(prev => ({
                        ...prev,
                        period2: { ...prev.period2, start: date }
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span>to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      {comparisonPeriods.period2.end ? format(comparisonPeriods.period2.end, "MMM dd") : "End"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={comparisonPeriods.period2.end}
                      onSelect={(date) => setComparisonPeriods(prev => ({
                        ...prev,
                        period2: { ...prev.period2, end: date }
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// --- KPICards ---
function KPICards({ records, comparisonData, comparisonPeriods }) {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading for smooth animations
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [records]);

  const calculateTotals = (data) => {
    const totals = { assets: 0, liabilities: 0, income: 0, expenses: 0 };
    data.forEach((record) => {
      const amount = parseFloat(record.amount);
      switch (record.category.toLowerCase()) {
        case 'asset': totals.assets += amount; break;
        case 'liability': totals.liabilities += amount; break;
        case 'income': totals.income += amount; break;
        case 'expense': totals.expenses += amount; break;
      }
    });
    return { ...totals, balance: totals.assets + totals.income - totals.liabilities - totals.expenses };
  };

  const currentTotals = calculateTotals(records);

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  let comparisonTotals = null;
  if (comparisonData) {
    const period1Totals = calculateTotals(comparisonData.period1);
    const period2Totals = calculateTotals(comparisonData.period2);
    comparisonTotals = {
      balance: getPercentageChange(period1Totals.balance, period2Totals.balance),
      income: getPercentageChange(period1Totals.income, period2Totals.income),
      expenses: getPercentageChange(period1Totals.expenses, period2Totals.expenses),
      activity: getPercentageChange(comparisonData.period1.length, comparisonData.period2.length),
    };
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatPercentage = (percentage) => {
    const isPositive = percentage >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
        <span>{Math.abs(percentage).toFixed(1)}%</span>
      </div>
    );
  };

  const kpiData = [
    { 
      title: "Total Balance", 
      value: formatCurrency(currentTotals.balance), 
      icon: DollarSign, 
      change: comparisonTotals?.balance, 
      color: "text-blue-500",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    { 
      title: "Total Income", 
      value: formatCurrency(currentTotals.income), 
      icon: TrendingUp, 
      change: comparisonTotals?.income, 
      color: "text-green-500",
      gradient: "bg-gradient-to-br from-green-500 to-green-600"
    },
    { 
      title: "Total Expenses", 
      value: formatCurrency(currentTotals.expenses), 
      icon: TrendingDown, 
      change: comparisonTotals?.expenses, 
      color: "text-red-500",
      gradient: "bg-gradient-to-br from-red-500 to-red-600"
    },
    { 
      title: "Total Activity", 
      value: records.length.toString(), 
      icon: Activity, 
      change: comparisonTotals?.activity, 
      color: "text-purple-500",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        
        return (
          <motion.div
            key={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.gradient}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={kpi.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl font-bold"
                    >
                      {kpi.value}
                    </motion.div>
                  </AnimatePresence>
                )}
                
                {kpi.change !== undefined && (
                  <div className="flex items-center justify-between mt-4">
                    {isLoading ? (
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                    ) : (
                      <>
                        {formatPercentage(kpi.change)}
                        {comparisonPeriods && (
                          <Badge variant="outline" className="text-xs">
                            vs {comparisonPeriods.period2.label}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// --- DashboardHeader ---
function DashboardHeader() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/transactions", label: "Transactions", icon: Activity },
    { path: "/export", label: "Export", icon: Download },
  ];

  return (
    <motion.div 
      className={`sticky top-0 z-10 flex flex-col md:flex-row items-center justify-between py-4 px-6 space-y-4 md:space-y-0 transition-all duration-300 ${isScrolled ? 'bg-background/90 backdrop-blur-md border-b shadow-sm' : 'bg-background'}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/" className="flex items-center group">
        <motion.div 
          whileHover={{ rotate: 10 }}
          className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 mr-3 group-hover:shadow-lg transition-shadow"
        >
          <BarChart3 className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
          >
            VIRTUSA LEDGER
          </motion.h1>
          <p className="text-sm text-muted-foreground">Blockchain-Powered Financial Assistant</p>
        </div>
      </Link>
      
      <div className="flex items-center space-x-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.div 
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                asChild 
                variant={isActive ? "default" : "ghost"} 
                size="sm"
                className={`relative ${isActive ? 'shadow-md' : ''}`}
              >
                <Link to={item.path} className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {isActive && (
                    <motion.span 
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              </Button>
            </motion.div>
          );
        })}
        
        <ConnectWalletButton />
      </div>
    </motion.div>
  );
}

// --- TransactionChart ---
function TransactionChart({ records }) {
  const [timeframe, setTimeframe] = useState('monthly');
  const [activeBar, setActiveBar] = useState(null);
  
  // Process data for the chart based on timeframe
  const processChartData = () => {
    if (!records || records.length === 0) return [];
    
    const now = new Date();
    const data = [];
    
    if (timeframe === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = format(date, 'MMM');
        const year = date.getFullYear();
        
        const monthRecords = records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.getFullYear() === year && recordDate.getMonth() === date.getMonth();
        });
        
        const categoryTotals = {
          income: 0,
          expense: 0,
          asset: 0,
          liability: 0,
          equity: 0
        };
        
        monthRecords.forEach(record => {
          const category = record.category.toLowerCase();
          const amount = parseFloat(record.amount);
          if (categoryTotals.hasOwnProperty(category)) {
            categoryTotals[category] += amount;
          }
        });
        
        data.push({
          name: `${monthName} '${year.toString().slice(-2)}`,
          income: categoryTotals.income,
          expense: categoryTotals.expense,
          asset: categoryTotals.asset,
          liability: categoryTotals.liability,
          equity: categoryTotals.equity,
          balance: categoryTotals.income + categoryTotals.asset - categoryTotals.expense - categoryTotals.liability
        });
      }
    } else {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayName = format(date, 'd MMM');
        
        const dayRecords = records.filter(record => {
          const recordDate = new Date(record.date);
          return (
            recordDate.getFullYear() === date.getFullYear() &&
            recordDate.getMonth() === date.getMonth() &&
            recordDate.getDate() === date.getDate()
          );
        });
        
        const categoryTotals = {
          income: 0,
          expense: 0,
          asset: 0,
          liability: 0,
          equity: 0
        };
        
        dayRecords.forEach(record => {
          const category = record.category.toLowerCase();
          const amount = parseFloat(record.amount);
          if (categoryTotals.hasOwnProperty(category)) {
            categoryTotals[category] += amount;
          }
        });
        
        data.push({
          name: dayName,
          income: categoryTotals.income,
          expense: categoryTotals.expense,
          asset: categoryTotals.asset,
          liability: categoryTotals.liability,
          equity: categoryTotals.equity,
          balance: categoryTotals.income + categoryTotals.asset - categoryTotals.expense - categoryTotals.liability
        });
      }
    }
    
    return data;
  };
  
  const chartData = processChartData();
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const colors = {
        income: 'bg-green-500',
        expense: 'bg-amber-500',
        asset: 'bg-blue-500',
        liability: 'bg-red-500',
        equity: 'bg-purple-500'
      };
      
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-background p-3 border rounded-lg shadow-xl"
        >
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => {
              if (entry.dataKey === 'balance') return null;
              return (
                <div key={entry.dataKey} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${colors[entry.dataKey] || 'bg-gray-500'}`}></div>
                    <span>{entry.name}:</span>
                  </div>
                  <span className="font-medium">${entry.value.toFixed(2)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t mt-2">
              <span>Net Balance:</span>
              <span className={`font-medium ${payload.find(p => p.dataKey === 'balance')?.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${payload.find(p => p.dataKey === 'balance')?.value?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };
  
  return (
    <motion.div variants={cardVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction  f History</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={timeframe === 'monthly' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeframe('monthly')}
              >
                Monthly
              </Button>
              <Button 
                variant={timeframe === 'daily' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeframe('daily')}
              >
                Daily
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {records.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No transaction data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  onMouseMove={(state) => {
                    if (state.isTooltipActive) {
                      setActiveBar(state.activeTooltipIndex);
                    } else {
                      setActiveBar(null);
                    }
                  }}
                  onMouseLeave={() => setActiveBar(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => (
                      <span className="text-muted-foreground text-sm">{value}</span>
                    )}
                  />
                  <Bar 
                    dataKey="income" 
                    name="Income" 
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    isAnimationActive={true}
                  >
                    {chartData.map((entry, index) => (
                      <motion.cell
                        key={`income-${index}`}
                        initial={{ height: 0 }}
                        animate={{ 
                          height: '100%',
                          transition: { 
                            duration: 0.8, 
                            delay: index * 0.05,
                            ease: [0.16, 1, 0.3, 1]
                          }
                        }}
                        className={activeBar === index ? 'opacity-100' : 'opacity-90'}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="expense" 
                    name="Expense" 
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    isAnimationActive={true}
                  >
                    {chartData.map((entry, index) => (
                      <motion.cell
                        key={`expense-${index}`}
                        initial={{ height: 0 }}
                        animate={{ 
                          height: '100%',
                          transition: { 
                            duration: 0.8, 
                            delay: index * 0.05,
                            ease: [0.16, 1, 0.3, 1]
                          }
                        }}
                        className={activeBar === index ? 'opacity-100' : 'opacity-90'}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="asset" 
                    name="Asset" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    isAnimationActive={true}
                  >
                    {chartData.map((entry, index) => (
                      <motion.cell
                        key={`asset-${index}`}
                        initial={{ height: 0 }}
                        animate={{ 
                          height: '100%',
                          transition: { 
                            duration: 0.8, 
                            delay: index * 0.05,
                            ease: [0.16, 1, 0.3, 1]
                          }
                        }}
                        className={activeBar === index ? 'opacity-100' : 'opacity-90'}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="liability" 
                    name="Liability" 
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    isAnimationActive={true}
                  >
                    {chartData.map((entry, index) => (
                      <motion.cell
                        key={`liability-${index}`}
                        initial={{ height: 0 }}
                        animate={{ 
                          height: '100%',
                          transition: { 
                            duration: 0.8, 
                            delay: index * 0.05,
                            ease: [0.16, 1, 0.3, 1]
                          }
                        }}
                        className={activeBar === index ? 'opacity-100' : 'opacity-90'}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="equity" 
                    name="Equity" 
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    isAnimationActive={true}
                  >
                    {chartData.map((entry, index) => (
                      <motion.cell
                        key={`equity-${index}`}
                        initial={{ height: 0 }}
                        animate={{ 
                          height: '100%',
                          transition: { 
                            duration: 0.8, 
                            delay: index * 0.05,
                            ease: [0.16, 1, 0.3, 1]
                          }
                        }}
                        className={activeBar === index ? 'opacity-100' : 'opacity-90'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Export all dashboard components
export { 
  CategoryPieChart, 
  ComparisonCards, 
  DateRangeFilter, 
  KPICards, 
  DashboardHeader,
  TransactionChart
};

// Default export for Dashboard page
export default function Dashboard() {
  // Example data - in a real app, this would come from your state management
  const [records, setRecords] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriods, setComparisonPeriods] = useState({ 
    period1: { start: null, end: null, label: "This Month" }, 
    period2: { start: null, end: null, label: "Last Month" } 
  });

  // Filter records based on date range
  const filteredRecords = records.filter(r => {
  const amt = parseFloat(r.amount);
  return !isNaN(amt) && Math.abs(amt) > 0.009;
});


  // Get comparison data if in comparison mode
  let comparisonData = null;
  if (comparisonMode && comparisonPeriods.period1.start && comparisonPeriods.period1.end && 
      comparisonPeriods.period2.start && comparisonPeriods.period2.end) {
    comparisonData = {
      period1: records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= comparisonPeriods.period1.start && recordDate <= comparisonPeriods.period1.end;
      }),
      period2: records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= comparisonPeriods.period2.start && recordDate <= comparisonPeriods.period2.end;
      })
    };
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <DateRangeFilter 
          dateRange={dateRange}
          setDateRange={setDateRange}
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
          comparisonPeriods={comparisonPeriods}
          setComparisonPeriods={setComparisonPeriods}
        />
        
        <KPICards 
          records={filteredRecords} 
          comparisonData={comparisonData}
          comparisonPeriods={comparisonMode ? comparisonPeriods : null}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TransactionChart records={filteredRecords} />
            
            {comparisonMode && comparisonData && (
              <ComparisonCards 
                period1Data={comparisonData.period1}
                period2Data={comparisonData.period2}
                period1Label={comparisonPeriods.period1.label}
                period2Label={comparisonPeriods.period2.label}
              />
            )}
          </div>
          
          <div className="space-y-6">
            <CategoryPieChart records={filteredRecords} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}