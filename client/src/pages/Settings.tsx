import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="p-6" data-testid="settings-page">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>
      
      <div className="grid gap-6 max-w-2xl">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">General</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Organization Name
              </label>
              <Input 
                placeholder="Your organization" 
                defaultValue="AutoHeal Demo"
                data-testid="org-name-input"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Default Repository
              </label>
              <Select defaultValue="e-commerce-app" data-testid="default-repo-select">
                <SelectTrigger>
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e-commerce-app">e-commerce-app</SelectItem>
                  <SelectItem value="frontend-app">frontend-app</SelectItem>
                  <SelectItem value="api-service">api-service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">AI Configuration</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Enable AI Suggestions</p>
                <p className="text-sm text-slate-500">Automatically generate selector suggestions</p>
              </div>
              <Switch defaultChecked data-testid="ai-enabled-switch" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Auto-approve High Confidence</p>
                <p className="text-sm text-slate-500">Auto-approve suggestions above 95% confidence</p>
              </div>
              <Switch data-testid="auto-approve-switch" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Confidence Threshold
              </label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                defaultValue="80" 
                data-testid="confidence-threshold-input"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum confidence required for suggestions</p>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Integration */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">GitHub Integration</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Auto-create Pull Requests</p>
                <p className="text-sm text-slate-500">Automatically create PRs for approved fixes</p>
              </div>
              <Switch defaultChecked data-testid="auto-pr-switch" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                GitHub Token
              </label>
              <Input 
                type="password" 
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                data-testid="github-token-input"
              />
              <p className="text-xs text-slate-500 mt-1">Personal access token for GitHub API</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Base Branch
              </label>
              <Select defaultValue="main" data-testid="base-branch-select">
                <SelectTrigger>
                  <SelectValue placeholder="Select base branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="master">master</SelectItem>
                  <SelectItem value="develop">develop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Email Notifications</p>
                <p className="text-sm text-slate-500">Get notified about test failures</p>
              </div>
              <Switch defaultChecked data-testid="email-notifications-switch" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Slack Integration</p>
                <p className="text-sm text-slate-500">Send alerts to Slack channel</p>
              </div>
              <Switch data-testid="slack-notifications-switch" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Notification Email
              </label>
              <Input 
                type="email" 
                placeholder="notifications@yourcompany.com" 
                data-testid="notification-email-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="save-settings-btn">
            <i className="fas fa-save mr-2"></i>
            Save Settings
          </Button>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}