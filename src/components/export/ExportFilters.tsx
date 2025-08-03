
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Settings } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExportFiltersProps {
  exportConfig: {
    type: 'financial-year' | 'custom-range';
    financialYear: number;
    customRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
  };
  setExportConfig: (config: any) => void;
}

const ExportFilters: React.FC<ExportFiltersProps> = ({
  exportConfig,
  setExportConfig,
}) => {
  const currentYear = new Date().getFullYear();
  const financialYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const setQuickDateRange = (range: 'thisMonth' | 'lastMonth' | 'thisYear') => {
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

    setExportConfig({
      ...exportConfig,
      type: 'custom-range',
      customRange: { startDate: start, endDate: end },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Export Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Type */}
        <div className="space-y-2">
          <Label>Export Type</Label>
          <Select
            value={exportConfig.type}
            onValueChange={(value: 'financial-year' | 'custom-range') =>
              setExportConfig({ ...exportConfig, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial-year">Financial Year</SelectItem>
              <SelectItem value="custom-range">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Financial Year Selection */}
        {exportConfig.type === 'financial-year' && (
          <div className="space-y-2">
            <Label>Financial Year</Label>
            <Select
              value={exportConfig.financialYear.toString()}
              onValueChange={(value) =>
                setExportConfig({
                  ...exportConfig,
                  financialYear: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {financialYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    FY {year}-{year + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Financial year runs from April to March
            </p>
          </div>
        )}

        {/* Custom Date Range */}
        {exportConfig.type === 'custom-range' && (
          <div className="space-y-4">
            {/* Quick Range Buttons */}
            <div className="space-y-2">
              <Label>Quick Ranges</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange('thisMonth')}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange('lastMonth')}
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange('thisYear')}
                >
                  This Year
                </Button>
              </div>
            </div>

            {/* Custom Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !exportConfig.customRange.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {exportConfig.customRange.startDate
                      ? format(exportConfig.customRange.startDate, "PPP")
                      : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exportConfig.customRange.startDate || undefined}
                    onSelect={(date) =>
                      setExportConfig({
                        ...exportConfig,
                        customRange: {
                          ...exportConfig.customRange,
                          startDate: date || null,
                        },
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Custom End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !exportConfig.customRange.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {exportConfig.customRange.endDate
                      ? format(exportConfig.customRange.endDate, "PPP")
                      : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exportConfig.customRange.endDate || undefined}
                    onSelect={(date) =>
                      setExportConfig({
                        ...exportConfig,
                        customRange: {
                          ...exportConfig.customRange,
                          endDate: date || null,
                        },
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportFilters;
