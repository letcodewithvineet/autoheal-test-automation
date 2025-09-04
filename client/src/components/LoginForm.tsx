import { useState, useEffect } from "react";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Brain, Cpu } from "lucide-react";

// Animated particles component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{id: number, left: number, delay: number}>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="floating-particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  );
};

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    try {
      await loginMutation.mutateAsync({ username, password });
      toast({
        title: "Success",
        description: "Login successful!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({ username, password });
      toast({
        title: "Success",
        description: result.message || "Account created successfully! Please log in with your credentials.",
      });
      // Clear the form after successful registration
      setUsername("");
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col ai-login-background px-4">
      <FloatingParticles />
      <div className="flex-1 flex items-center justify-center relative z-10">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="ai-icon bg-gradient-to-r from-cyan-400 to-blue-500 p-3 rounded-full">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold gradient-title mb-2">AI Self Healing Test Automation System</CardTitle>
            <CardDescription className="ai-description">
              Next-generation self-healing test automation platform powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 ai-tabs">
                <TabsTrigger value="login" data-testid="tab-login" className="ai-tab">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register" className="ai-tab">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="glass-label flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="login-username"
                      data-testid="input-login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="glass-label flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      data-testid="input-login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="glass-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full neon-button"
                    data-testid="button-login-submit"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Authenticating...' : 'Access System'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="glass-label flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="register-username"
                      data-testid="input-register-username"
                      type="text"
                      placeholder="Choose your AI username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="glass-label flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Security Key
                    </Label>
                    <Input
                      id="register-password"
                      data-testid="input-register-password"
                      type="password"
                      placeholder="Create secure password (min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="glass-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full neon-button"
                    data-testid="button-register-submit"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Initializing...' : 'Initialize Access'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md py-4 px-6 relative z-10">
        <div className="text-center text-sm text-white/60">
          © 2025 AI Self Healing Test Automation System • Made with 🤖 by Vineet
        </div>
      </footer>
    </div>
  );
}