import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BlockchainProvider } from "@/contexts/BlockchainContext";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Export from "./pages/Export";
import Analytics from "./pages/Analytics";
import FileImportPage from "./pages/FileImport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component to provide page titles
const PageWithLayout = ({ element, title }: { element: React.ReactNode, title?: string }) => {
  return (
    <Layout title={title}>
      {element}
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BlockchainProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PageWithLayout element={<Dashboard />} title="Dashboard" />} />
            <Route path="/transactions" element={<PageWithLayout element={<Transactions />} title="Transactions" />} />
            <Route path="/export" element={<PageWithLayout element={<Export />} title="Export" />} />
            <Route path="/analytics" element={<PageWithLayout element={<Analytics />} title="Analytics" />} />
            <Route path="/file-import" element={<PageWithLayout element={<FileImportPage />} title="File Import" />} />
            <Route path="*" element={<PageWithLayout element={<NotFound />} title="Page Not Found" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BlockchainProvider>
  </QueryClientProvider>
);

export default App;
