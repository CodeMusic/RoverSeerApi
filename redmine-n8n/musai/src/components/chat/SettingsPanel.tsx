import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Settings, Palette, Bell, Shield, HelpCircle, Info, Navigation } from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const { preferences, setAutoSelectFirstItem } = useUserPreferences();

  return (
    <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Navigation
              </CardTitle>
              <CardDescription>
                Control how the app behaves when opening tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-select First Item</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically select the first course/narrative instead of showing the intro screen
                  </p>
                </div>
                <Switch
                  checked={preferences.autoSelectFirstItem}
                  onCheckedChange={setAutoSelectFirstItem}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Message Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous usage data collection
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Chats</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save chat sessions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                About
              </CardTitle>
              <CardDescription>
                Information about the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Version</span>
                  <span className="text-sm text-muted-foreground">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Build</span>
                  <span className="text-sm text-muted-foreground">2024.1.0</span>
                </div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Help & Support
                </Button>
                <Button variant="outline" size="sm">
                  Terms of Service
                </Button>
                <Button variant="outline" size="sm">
                  Privacy Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 