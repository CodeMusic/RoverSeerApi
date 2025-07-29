import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Lock, ArrowRight, Key, CheckCircle } from "lucide-react";

interface SignupPromptProps {
  onClose?: () => void;
  onUnlock?: (code: string) => boolean;
  isUnlocked?: boolean;
}

export const SignupPrompt = ({ onClose, onUnlock, isUnlocked = false }: SignupPromptProps) => {
  const [secretCode, setSecretCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (!onUnlock) return;
    
    setIsUnlocking(true);
    const success = onUnlock(secretCode);
    
    if (success) {
      setSecretCode("");
      setShowCodeInput(false);
    } else {
      setSecretCode("");
    }
    
    setIsUnlocking(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  };

  if (isUnlocked) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full opacity-20 blur-sm animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Access Unlocked!
            </CardTitle>
            <CardDescription className="text-lg">
              You now have unlimited interactions with Musai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Welcome to the test period! You can now:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Send unlimited messages</li>
                <li>• Create new chat sessions</li>
                <li>• Access all features</li>
                <li>• Test the full experience</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                onClick={onClose}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Continue to Musai
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Test Period Active
          </CardTitle>
          <CardDescription className="text-lg">
            You've reached the free interaction limit. Try again later or enter a secret code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              This is a test period for Musai. We're working on bringing you a full signup experience. Check back later for:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited interactions</li>
              <li>• Advanced features</li>
              <li>• Chat history sync</li>
              <li>• Priority support</li>
            </ul>
          </div>
          
          {!showCodeInput ? (
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white"
                disabled
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Sign Up (Coming Soon)
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowCodeInput(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Enter Secret Code
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
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret Code</label>
                <Input
                  type="password"
                  placeholder="Enter secret code..."
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white"
                  onClick={handleUnlock}
                  disabled={isUnlocking || !secretCode.trim()}
                >
                  {isUnlocking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  {isUnlocking ? "Unlocking..." : "Unlock Access"}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCodeInput(false);
                    setSecretCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
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