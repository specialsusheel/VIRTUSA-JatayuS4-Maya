import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Building2, 
  TrendingUp, 
  Shield,
  DollarSign,
  BarChart3
} from "lucide-react";

interface ContextSelectorProps {
  context: 'individual' | 'organization';
  onContextChange: (context: 'individual' | 'organization') => void;
  recordCount: number;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({ 
  context, 
  onContextChange, 
  recordCount 
}) => {
  const isIndividual = context === 'individual';

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analysis Context
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Individual Context */}
          <div className={`border-2 rounded-lg p-4 transition-all ${
            isIndividual 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Individual Finance</h3>
                {isIndividual && (
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>• Personal income, expenses, and savings</p>
              <p>• Debt-to-income ratio analysis</p>
              <p>• Emergency fund assessment</p>
              <p>• Personal financial health scoring</p>
            </div>
            
            <Button
              variant={isIndividual ? "default" : "outline"}
              onClick={() => onContextChange('individual')}
              className="w-full"
            >
              {isIndividual ? 'Currently Active' : 'Switch to Individual'}
            </Button>
          </div>

          {/* Organizational Context */}
          <div className={`border-2 rounded-lg p-4 transition-all ${
            !isIndividual 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Organizational Finance</h3>
                {!isIndividual && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>• Revenue, costs, and profit margins</p>
              <p>• Cash flow and working capital</p>
              <p>• Operational efficiency metrics</p>
              <p>• Business financial health analysis</p>
            </div>
            
            <Button
              variant={!isIndividual ? "default" : "outline"}
              onClick={() => onContextChange('organization')}
              className="w-full"
            >
              {!isIndividual ? 'Currently Active' : 'Switch to Organization'}
            </Button>
          </div>
        </div>

        {/* Context Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">Current Context: {isIndividual ? 'Individual' : 'Organizational'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Records Analyzed</p>
              <p className="font-semibold">{recordCount} transactions</p>
            </div>
            <div>
              <p className="text-muted-foreground">Analysis Type</p>
              <p className="font-semibold">
                {isIndividual ? 'Personal Finance' : 'Business Finance'}
              </p>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground">
            <p>
              {isIndividual 
                ? 'AI will analyze personal spending patterns, savings rates, and individual financial health metrics.'
                : 'AI will analyze business performance, profit margins, cash flow, and organizational financial metrics.'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContextSelector; 