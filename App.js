import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BlockchainProvider } from "./BlockchainContext";
import Dashboard from "./DashboardComponents";
import Transactions from "./TransactionComponents";
import ExportPage from "./ExportComponents";
import NotFound from "./NotFound";
import { Toaster } from "./UIComponents";

// Main app entry
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlockchainProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BlockchainProvider>
    </QueryClientProvider>
  );
}

export default App; 