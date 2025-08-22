import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface SelectorData {
  id: string;
  selector: string;
  type: 'data-testid' | 'class' | 'id' | 'xpath' | 'css' | 'aria';
  usage: number;
  successRate: number;
  lastUsed: string;
  repo: string;
  status: 'active' | 'deprecated' | 'broken';
}

export default function Selectors() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: selectors = [], isLoading } = useQuery<SelectorData[]>({
    queryKey: ['/api/selectors'],
  });

  const filteredSelectors = selectors.filter(selector => 
    selector.selector.toLowerCase().includes(searchTerm.toLowerCase()) ||
    selector.repo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'data-testid': return 'bg-green-100 text-green-700';
      case 'aria': return 'bg-blue-100 text-blue-700';
      case 'class': return 'bg-yellow-100 text-yellow-700';
      case 'id': return 'bg-purple-100 text-purple-700';
      case 'xpath': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'deprecated': return 'bg-yellow-100 text-yellow-700';
      case 'broken': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Selector Library</h2>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 bg-slate-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6" data-testid="selectors-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Selector Library</h2>
        <Badge variant="secondary" data-testid="selectors-count">
          {selectors.length} selectors
        </Badge>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search selectors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
          data-testid="selector-search"
        />
      </div>

      <div className="grid gap-4">
        {filteredSelectors.map((selector) => (
          <Card key={selector.id} className="border border-slate-200" data-testid={`selector-${selector.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded truncate">
                    {selector.selector}
                  </code>
                  <Badge className={getTypeColor(selector.type)} data-testid={`type-${selector.type}`}>
                    {selector.type}
                  </Badge>
                </div>
                <Badge className={getStatusColor(selector.status)} data-testid={`status-${selector.status}`}>
                  {selector.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Repository</h4>
                  <p className="text-sm text-slate-700">{selector.repo}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Usage Count</h4>
                  <p className="text-sm text-slate-700">{selector.usage} times</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Success Rate</h4>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-slate-700">{Math.round(selector.successRate * 100)}%</p>
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selector.successRate * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Last Used</h4>
                  <p className="text-sm text-slate-700">
                    {new Date(selector.lastUsed).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 pt-3 border-t border-slate-200">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" data-testid={`copy-selector-${selector.id}`}>
                    <i className="fas fa-copy mr-2"></i>
                    Copy
                  </Button>
                  {selector.status === 'broken' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" data-testid={`fix-selector-${selector.id}`}>
                      <i className="fas fa-wrench mr-2"></i>
                      Auto-Fix
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredSelectors.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <i className="fas fa-crosshairs text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No selectors found</h3>
              <p className="text-slate-500">
                {searchTerm ? 'Try adjusting your search terms' : 'Selector data will appear here as tests are analyzed'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}