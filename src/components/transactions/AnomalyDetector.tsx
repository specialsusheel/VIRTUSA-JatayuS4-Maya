import React, { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Eye, TrendingUp } from "lucide-react";
import { createAIAnalyzer, AnomalyDetection } from "@/utils/ai";
import { FinancialRecord } from "@/types/financial";

interface AnomalyDetectorProps {
  records: FinancialRecord[];
  currentRecord?: FinancialRecord;
  onAnomalyAction?: (anomaly: AnomalyDetection) => void;
}

const AnomalyDetector: React.FC<AnomalyDetectorProps> = ({ 
  records, 
  currentRecord, 
  onAnomalyAction 
}) => {
  const aiAnalyzer = useMemo(() => createAIAnalyzer(records), [records]);
  
  const anomalies = useMemo(() => {
    if (currentRecord) {
      // Check for anomalies in the current record being entered
      const tempRecords = [...records, currentRecord];
      const tempAnalyzer = createAIAnalyzer(tempRecords);
      return tempAnalyzer.detectAnomalies().filter(
        anomaly => anomaly.recordId === currentRecord.id
      );
    }
    return aiAnalyzer.detectAnomalies();
  }, [records, currentRecord, aiAnalyzer]);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'unusual_amount': return <TrendingUp className="h-4 w-4" />;
      case 'unusual_category': return <Eye className="h-4 w-4" />;
      case 'unusual_timing': return <AlertTriangle className="h-4 w-4" />;
      case 'duplicate_suspicion': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAnomalyColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-red-100 text-red-800 border-red-200';
    if (confidence > 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (anomalies.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            No Anomalies Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            {currentRecord 
              ? "This transaction looks normal based on your spending patterns."
              : "All transactions appear to be within normal patterns."
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Anomaly Detection
          <Badge variant="outline" className="ml-2">
            {anomalies.length} {anomalies.length === 1 ? 'Issue' : 'Issues'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {anomalies.map((anomaly, index) => (
            <Alert 
              key={`${anomaly.recordId}-${index}`} 
              className={`border-l-4 ${getAnomalyColor(anomaly.confidence)}`}
            >
              <div className="flex items-start gap-3">
                {getAnomalyIcon(anomaly.anomalyType)}
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2">
                    {anomaly.anomalyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <Badge variant="outline" className="text-xs">
                      {(anomaly.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    {anomaly.explanation}
                    {anomaly.suggestedAction && onAnomalyAction && (
                      <div className="mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => onAnomalyAction(anomaly)}
                        >
                          {anomaly.suggestedAction}
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnomalyDetector; 