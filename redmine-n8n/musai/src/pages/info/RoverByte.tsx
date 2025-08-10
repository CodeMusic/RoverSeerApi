import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';

const RoverByte = () =>
{
  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CHAT} />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Musai x RoverByte
          </h1>
          <p className="text-muted-foreground text-lg">
            Where the Musai mind becomes embodied—real-world interaction with memory and reflection.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What is RoverByte?</CardTitle>
            <CardDescription>A hands-on robotics platform powered by Musai.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            RoverByte is an embodied assistant that inherits Musai’s cognitive architecture—dual agents, memory,
            and nightly reflection—so it can remember, adapt, and become genuinely helpful over time.
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a href="https://roverbyte.codemusic.ca" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
            Visit RoverByte <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <InfoFooterNav />
      </div>
    </div>
  );
};

export default RoverByte;



