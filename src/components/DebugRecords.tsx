import React from 'react';
import { formatCurrency } from "@/config/currency";
import { useBlockchain } from '@/contexts/BlockchainContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DebugRecords: React.FC = () => {
  const { records } = useBlockchain();

  const getSourceType = (record: any) => {
    if (record.id?.startsWith('pdf-')) return 'PDF Import';
    if (record.id?.startsWith('csv-')) return 'CSV Import';
    if (record.recordType === 'correction') return 'Correction';
    return 'Manual Entry';
  };

  const getCategoryCount = (category: string) => {
    return records.filter(r => r.category.toLowerCase() === category.toLowerCase()).length;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debug Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{records.length}</div>
              <div className="text-sm text-blue-600">Total Records</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getCategoryCount('income')}</div>
              <div className="text-sm text-green-600">Income</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{getCategoryCount('expense')}</div>
              <div className="text-sm text-red-600">Expense</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{getCategoryCount('asset') + getCategoryCount('liability') + getCategoryCount('equity')}</div>
              <div className="text-sm text-gray-600">Other</div>
            </div>
          </div>

          {/* Source Breakdown */}
          <div>
            <h4 className="font-semibold mb-2">Records by Source:</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(records.map(getSourceType))).map(source => {
                const count = records.filter(r => getSourceType(r) === source).length;
                return (
                  <Badge key={source} variant="outline">
                    {source}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Recent Records */}
          <div>
            <h4 className="font-semibold mb-2">Recent Records (Last 5):</h4>
            <div className="space-y-2">
              {records.slice(-5).reverse().map((record, index) => (
                <div key={record.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{record.description}</div>
                    <div className="text-sm text-gray-500">
                      {record.date} • {getSourceType(record)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${parseFloat(record.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(record.amount)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {record.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Data */}
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">Raw Records Data</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(records, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugRecords;