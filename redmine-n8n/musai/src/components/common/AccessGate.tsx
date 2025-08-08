import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function two(n: number) {
  return n.toString().padStart(2, '0');
}

function generateAccessCode(date = new Date()): { codeWithHour: string; codeNoHour: string; hourKey: string } {
  const dd = two(date.getDate());
  const mm = two(date.getMonth() + 1);
  const yy = two(date.getFullYear() % 100);
  const hh = two(date.getHours());
  const base = `r0v3r8y73_${dd}${mm}${yy}`;
  return { codeWithHour: `${base}${hh}`, codeNoHour: base, hourKey: `${date.getFullYear()}-${mm}-${dd}-${hh}` };
}

export const AccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const { codeWithHour, codeNoHour, hourKey } = useMemo(() => generateAccessCode(now), [now]);

  // Rotate state hourly to invalidate old access
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(i);
  }, []);

  // Check stored access for this hour
  const isAuthorized = useMemo(() => {
    const stored = localStorage.getItem('musai_access_hour');
    return stored === hourKey;
  }, [hourKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = input.trim().toLowerCase();
    if (val === codeWithHour.toLowerCase() || val === codeNoHour.toLowerCase()) {
      localStorage.setItem('musai_access_hour', hourKey);
      setError(null);
      // Force rerender to show children
      setNow(new Date());
    } else {
      setError('Invalid access code.');
    }
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-background to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Musai Access</CardTitle>
          <CardDescription>Musai is not quite ready. Please enter your access code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Enter access code"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full">Unlock</Button>
            <div className="text-xs text-muted-foreground mt-2">
              Hint: format is r0v3r8y73_DDMMYYHH (rotates hourly).
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessGate;
