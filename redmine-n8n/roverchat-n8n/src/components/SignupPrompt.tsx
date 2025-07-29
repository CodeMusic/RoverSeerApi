import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Lock, ArrowRight } from "lucide-react";

interface SignupPromptProps {
  onClose?: () => void;
}

export const SignupPrompt = ({ onClose }: SignupPromptProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full opacity-20 blur-sm animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Sign Up Coming Soon!
          </CardTitle>
          <CardDescription className="text-lg">
            You've reached the free interaction limit. Sign up to continue chatting with Musai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              We're working on bringing you a full signup experience. Check back later for:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited interactions</li>
              <li>• Advanced features</li>
              <li>• Chat history sync</li>
              <li>• Priority support</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white"
              disabled
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Sign Up (Coming Soon)
            </Button>
            
            {onClose && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onClose}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue with Limited Access
              </Button>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              You can still view and interact with your existing chats
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};