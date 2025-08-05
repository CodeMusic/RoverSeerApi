import React, { useState } from 'react';
import { Calendar, Clock, Mail, ArrowLeft, Plus, Trash2, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScheduledSearch {
  id: string;
  query: string;
  presentation: string;
  email?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time?: string;
  isActive: boolean;
}

interface CareerSchedulerProps {
  scheduledSearches: ScheduledSearch[];
  onScheduleSearch: (config: {
    query: string;
    presentation: string;
    email?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
  }) => void;
  onBack: () => void;
}

export const CareerScheduler: React.FC<CareerSchedulerProps> = ({
  scheduledSearches,
  onScheduleSearch,
  onBack
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSearch, setNewSearch] = useState({
    query: '',
    presentation: '',
    email: '',
    frequency: 'daily' as const,
    time: '09:00'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScheduleSearch({
      query: newSearch.query,
      presentation: newSearch.presentation,
      email: newSearch.email || undefined,
      frequency: newSearch.frequency,
      time: newSearch.time
    });
    setNewSearch({
      query: '',
      presentation: '',
      email: '',
      frequency: 'daily',
      time: '09:00'
    });
    setIsAdding(false);
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'monthly': return '🗓️';
      default: return '📅';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'weekly': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'monthly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Career Search Scheduler</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Add New Search */}
        {!isAdding ? (
          <Button 
            onClick={() => setIsAdding(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Search
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Scheduled Search
              </CardTitle>
              <CardDescription>
                Configure automated career searches that will run periodically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Query</label>
                  <Input
                    placeholder="e.g., React developer jobs in San Francisco"
                    value={newSearch.query}
                    onChange={(e) => setNewSearch(prev => ({ ...prev, query: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Presentation Format</label>
                  <Textarea
                    placeholder="e.g., Summarize top 5 opportunities with salary ranges and company details"
                    value={newSearch.presentation}
                    onChange={(e) => setNewSearch(prev => ({ ...prev, presentation: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                    <Select
                      value={newSearch.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                        setNewSearch(prev => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={newSearch.time}
                      onChange={(e) => setNewSearch(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email (Optional)</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={newSearch.email}
                    onChange={(e) => setNewSearch(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to show results in CareerMusai alerts
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Schedule Search
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Searches List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Active Scheduled Searches ({scheduledSearches.length})
          </h3>
          
          {scheduledSearches.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No scheduled searches yet</p>
                <p className="text-xs">Create your first scheduled search to get started</p>
              </CardContent>
            </Card>
          ) : (
            scheduledSearches.map((search) => (
              <Card key={search.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">{search.query}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={cn("px-2 py-1 rounded-full text-xs", getFrequencyColor(search.frequency))}>
                          {getFrequencyIcon(search.frequency)} {search.frequency}
                        </span>
                        <Clock className="h-3 w-3" />
                        <span>{search.time}</span>
                        {search.email && (
                          <>
                            <Mail className="h-3 w-3" />
                            <span>{search.email}</span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {search.presentation}
                      </p>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 