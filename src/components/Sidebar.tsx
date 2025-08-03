import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BarChart3, Activity, Download, Home, LineChart, Upload, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/transactions", label: "Transactions", icon: Activity },
    { path: "/file-import", label: "File Import", icon: Upload },
    { path: "/export", label: "Export", icon: Download },
    { path: "/analytics", label: "Analytics", icon: LineChart },
  ];

  const NavItems = () => (
    <>
      <div className="flex items-center mb-8 pl-4">
        <BarChart3 className="h-8 w-8 mr-2 text-blockchain-primary" />
        <div>
          <h1 className="text-xl font-bold">VIRTUSA LEDGER</h1>
          <p className="text-xs text-muted-foreground">
            Blockchain-Powered Financial Assistant
          </p>
        </div>
      </div>
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive ? "bg-muted font-medium" : "font-normal"
              )}
            >
              <Link to={item.path} className="flex items-center">
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden md:flex md:flex-col h-screen w-64 border-r p-4", className)}>
        <NavItems />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <NavItems />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;