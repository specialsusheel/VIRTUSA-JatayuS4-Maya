
import React, { useState, useMemo } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import ExportFilters from "@/components/export/ExportFilters";
import ExportPreview from "@/components/export/ExportPreview";
import ExportButton from "@/components/export/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialRecord } from "@/types/financial";
import { Download } from "lucide-react";

const Export = () => {
  const { records } = useBlockchain();
  const [exportConfig, setExportConfig] = useState<{
    type: 'financial-year' | 'custom-range';
    financialYear: number;
    customRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
  }>({
    type: 'financial-year',
   financialYear: 2025,

    customRange: {
      startDate: null,
      endDate: null,
    },
  });
console.log("Sample record dates (readable):", records.slice(0, 5).map(r =>
  new Date(Number(r.date) * 1000).toISOString()
));

if (exportConfig.type === "financial-year") {
  console.log("Checking FY range:", `${exportConfig.financialYear}-04-01` + " to " + `${exportConfig.financialYear + 1}-03-31`);
}

  // Filter records based on export configuration
  const filteredRecords = useMemo(() => {
  const normalizeDate = (d: Date) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const getDateFromRecord = (record: FinancialRecord) => {
    const timestamp = typeof record.date === "string" || typeof record.date === "number"
      ? Number(record.date) * 1000 // Convert UNIX seconds → milliseconds
      : record.date;
    return normalizeDate(new Date(timestamp));
  };

  if (exportConfig.type === 'financial-year') {
    const fyStart = normalizeDate(new Date(`${exportConfig.financialYear}-04-01`));
    const fyEnd = new Date(`${exportConfig.financialYear + 1}-03-31T23:59:59`);

    return records.filter((record) => {
      const recordDate = getDateFromRecord(record);
      return recordDate >= fyStart && recordDate <= fyEnd;
    });
  } else {
    if (!exportConfig.customRange.startDate || !exportConfig.customRange.endDate) {
      return [];
    }

    const start = normalizeDate(exportConfig.customRange.startDate);
    const end = normalizeDate(exportConfig.customRange.endDate);

    return records.filter((record) => {
      const recordDate = getDateFromRecord(record);
      return recordDate >= start && recordDate <= end;
    });
  }
}, [records, exportConfig]);

console.log("Sample record dates:", records.slice(0, 5).map(r => r.date));


  return (
    <div>
      <div className="container mx-auto">
        
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Export Financial Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Export your financial records to Excel format for reporting, tax filing, or analysis.
                Choose your preferred date range and download a comprehensive report.
              </p>
            </CardContent>
          </Card>

          {/* Export Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filters */}
            <ExportFilters
              exportConfig={exportConfig}
              setExportConfig={setExportConfig}
            />

            {/* Preview */}
            <ExportPreview
              records={filteredRecords}
              exportConfig={exportConfig}
            />
          </div>

          {/* Export Button */}
          <ExportButton
            records={filteredRecords}
            exportConfig={exportConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default Export;
