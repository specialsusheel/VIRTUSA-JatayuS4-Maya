import React from "react";
import { Link, useLocation } from "react-router-dom";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { Button } from "@/components/ui/button";
import { BarChart3, Activity, Download, Home, LineChart, Upload } from "lucide-react";

const DashboardHeader: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/transactions", label: "Transactions", icon: Activity },
    { path: "/file-import", label: "File Import", icon: Upload },
    { path: "/export", label: "Export", icon: Download },
    { path: "/analytics", label: "Analytics", icon: LineChart },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 py-4 border-b space-y-4 md:space-y-0">
      <div className="flex items-center">
        <BarChart3 className="h-8 w-8 mr-2 text-blockchain-primary" />
        <div>
          <h1 className="text-2xl font-bold">VIRTUSA LEDGER</h1>
          <p className="text-sm text-muted-foreground">
            Blockchain-Powered Financial Assistant
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center space-x-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              asChild
              variant={isActive ? "default" : "ghost"}
              size="sm"
            >
              <Link to={item.path} className="flex items-center">
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            </Button>
          );
        })}
        
        <ConnectWalletButton />
      </div>
    </div>
  );
};

export default DashboardHeader;
