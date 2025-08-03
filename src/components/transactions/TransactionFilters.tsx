
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
  filters: {
    category: string;
    dateRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
    searchTerm: string;
  };
  setFilters: (filters: any) => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({ filters, setFilters }) => {
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'equity', label: 'Equity' },
  ];

  const clearFilters = () => {
    setFilters({
      category: 'all',
      dateRange: { startDate: null, endDate: null },
      searchTerm: '',
    });
  };

  const hasActiveFilters = 
    filters.category !== 'all' || 
    filters.dateRange.startDate || 
    filters.dateRange.endDate || 
    filters.searchTerm;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search description, notes..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({
                ...filters,
                searchTerm: e.target.value,
              })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({
              ...filters,
              category: value,
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.startDate ? 
                  format(filters.dateRange.startDate, "MMM dd, yyyy") : 
                  "Select date"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange.startDate || undefined}
                onSelect={(date) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, startDate: date || null },
                })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.endDate ? 
                  format(filters.dateRange.endDate, "MMM dd, yyyy") : 
                  "Select date"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange.endDate || undefined}
                onSelect={(date) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, endDate: date || null },
                })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
