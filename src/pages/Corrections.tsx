import React, { useState } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import DashboardHeader from "@/components/DashboardHeader";
import CorrectionForm from "@/components/CorrectionForm";
import CorrectionHistory from "@/components/CorrectionHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, History, Plus } from "lucide-react";

const Corrections = () => {
  const { corrections, getCorrectedRecords } = useBlockchain();
  const [activeTab, setActiveTab] = useState("create");

  const correctedRecords = getCorrectedRecords();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader />
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Corrections</h1>
              <p className="text-muted-foreground">
                Manage and track corrections to your financial records
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                {corrections.length} corrections made
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Corrections</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{corrections.length}</div>
                <p className="text-xs text-muted-foreground">
                  Corrections made to date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corrected Records</CardTitle>
                <History className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{correctedRecords.length}</div>
                <p className="text-xs text-muted-foreground">
                  Records with corrections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {corrections.length > 0 
                    ? Math.round(((correctedRecords.length / corrections.length) * 100)) 
                    : 100}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Records with corrections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Create Correction
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Correction History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                    Create New Correction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CorrectionForm 
                    onCorrectionComplete={() => setActiveTab("history")}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <CorrectionHistory />
            </TabsContent>
          </Tabs>

          {/* Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-blue-500" />
                About Corrections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">How Corrections Work</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Original records are never deleted or modified</li>
                    <li>• Corrections are stored as new blockchain transactions</li>
                    <li>• Each correction references the original transaction</li>
                    <li>• Full audit trail is maintained for transparency</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Correction Types</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Amount:</strong> Correct wrong amounts</li>
                    <li>• <strong>Category:</strong> Fix category assignments</li>
                    <li>• <strong>Description:</strong> Update descriptions</li>
                    <li>• <strong>Date:</strong> Correct transaction dates</li>
                    <li>• <strong>Multiple:</strong> Fix multiple fields at once</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Corrections; 