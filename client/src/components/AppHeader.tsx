import { useAuth, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User } from "lucide-react";

export default function AppHeader() {
  const { user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Logout failed",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-foreground" data-testid="app-title">
            AutoHeal Dashboard
          </h1>
          <span className="text-sm text-muted-foreground">
            Self-healing test automation
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span data-testid="text-username">{user?.username}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logout.isPending}
            data-testid="button-logout"
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}