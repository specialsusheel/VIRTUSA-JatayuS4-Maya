
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  setDateRange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  comparisonMode: boolean;
  setComparisonMode: (mode: boolean) => void;
  comparisonPeriods: {
    period1: { start: Date | null; end: Date | null; label: string };
    period2: { start: Date | null; end: Date | null; label: string };
  };
  setComparisonPeriods: (periods: any) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  setDateRange,
  comparisonMode,
  setComparisonMode,
  comparisonPeriods,
  setComparisonPeriods,
}) => {
  const clearFilters = () => {
    setDateRange({ startDate: null, endDate: null });
    setComparisonMode(false);
    setComparisonPeriods({
      period1: { start: null, end: null, label: "This Month" },
      period2: { start: null, end: null, label: "Last Month" },
    });
  };

  const setQuickRange = (range: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date();
    let start: Date, end: Date;

    switch (range) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setDateRange({ startDate: start, endDate: end });
  };

  const setComparisonRange = () => {
    const now = new Date();
    
    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    setComparisonPeriods({
      period1: { start: thisMonthStart, end: thisMonthEnd, label: "This Month" },
      period2: { start: lastMonthStart, end: lastMonthEnd, label: "Last Month" },
    });
    setComparisonMode(true);
  };

  return (
    <div className="space-y-4">
      {/* Quick Range Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setQuickRange('thisMonth')}>
          This Month
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickRange('lastMonth')}>
          Last Month
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickRange('thisYear')}>
          This Year
        </Button>
        <Button variant="outline" size="sm" onClick={setComparisonRange}>
          Compare Months
        </Button>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
      </div>

      {/* Custom Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.startDate ? format(dateRange.startDate, "PPP") : "Select start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.startDate || undefined}
                onSelect={(date) => setDateRange({ ...dateRange, startDate: date || null })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.endDate ? format(dateRange.endDate, "PPP") : "Select end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.endDate || undefined}
                onSelect={(date) => setDateRange({ ...dateRange, endDate: date || null })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Comparison Mode Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="comparison-mode"
          checked={comparisonMode}
          onCheckedChange={setComparisonMode}
        />
        <Label htmlFor="comparison-mode">Enable Period Comparison</Label>
      </div>

      {/* Active Filters Display */}
      {(dateRange.startDate || dateRange.endDate || comparisonMode) && (
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm space-y-1">
              <p className="font-medium">Active Filters:</p>
              {dateRange.startDate && dateRange.endDate && (
                <p>Date Range: {format(dateRange.startDate, "MMM dd, yyyy")} - {format(dateRange.endDate, "MMM dd, yyyy")}</p>
              )}
              {comparisonMode && comparisonPeriods.period1.start && comparisonPeriods.period2.start && (
                <p>Comparing: {comparisonPeriods.period1.label} vs {comparisonPeriods.period2.label}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DateRangeFilter;
