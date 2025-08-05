import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Settings, Palette, Bell, Shield, HelpCircle, Info, Navigation, User, Bot, Image, Trash2, Plus } from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useMusaiMood } from "@/contexts/MusaiMoodContext";
import { useState } from "react";

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const { preferences, setAutoSelectFirstItem, setUserPhoto, clearUserPhoto, setShowUserPhoto } = useUserPreferences();
  const { moodPhrase, setMoodPhrase } = useMusaiMood();
  const [activeTab, setActiveTab] = useState("general");
  
  // Musee (User) settings
  const [userName, setUserName] = useState("Musee");
  const [userMemories, setUserMemories] = useState<string[]>([]);
  
  // Musai settings
  const [musaiName, setMusaiName] = useState("Musai");
  const [musaiPhoto, setMusaiPhoto] = useState<string | null>(null);
  const [baseSystemMessage, setBaseSystemMessage] = useState("You are Musai, an AI companion designed to help and inspire.");

  const handlePhotoUpload = (isUser: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (isUser) {
            setUserPhoto(result);
          } else {
            setMusaiPhoto(result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addMemory = () => {
    const newMemory = prompt("Enter a new memory:");
    if (newMemory) {
      setUserMemories([...userMemories, newMemory]);
    }
  };

  const deleteMemory = (index: number) => {
    setUserMemories(userMemories.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="musai">Musai</TabsTrigger>
              <TabsTrigger value="musee">Musee</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6 mt-6">
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
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Musai Settings Tab */}
            <TabsContent value="musai" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Musai Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure Musai's personality and appearance. Musai is your AI companion designed to help and inspire.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Musai Photo */}
                  <div className="space-y-4">
                    <Label>Musai Photo</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={musaiPhoto || undefined} />
                        <AvatarFallback className="text-lg">
                          {musaiName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Button 
                        variant="outline" 
                        onClick={() => handlePhotoUpload(false)}
                        className="flex items-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        Upload Photo
                      </Button>
                    </div>
                  </div>

                  {/* Musai Name */}
                  <div className="space-y-2">
                    <Label htmlFor="musai-name">Name</Label>
                    <Input
                      id="musai-name"
                      value={musaiName}
                      onChange={(e) => setMusaiName(e.target.value)}
                      placeholder="Enter Musai's name"
                    />
                  </div>

                  {/* Base System Message */}
                  <div className="space-y-2">
                    <Label htmlFor="base-system-message">Base System Message</Label>
                    <Textarea
                      id="base-system-message"
                      value={baseSystemMessage}
                      onChange={(e) => setBaseSystemMessage(e.target.value)}
                      placeholder="Enter the base system message that will be prepended to all conversations"
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      This message will be prepended to all system messages in conversations.
                    </p>
                  </div>

                  {/* Mood Phrase */}
                  <div className="space-y-2">
                    <Label htmlFor="mood-phrase">Mood Phrase</Label>
                    <Input
                      id="mood-phrase"
                      value={moodPhrase}
                      onChange={(e) => setMoodPhrase(e.target.value)}
                      placeholder="Enter a mood phrase (e.g., 'feeling creative and energetic')"
                    />
                    <p className="text-sm text-muted-foreground">
                      This phrase will be processed by n8n to determine Musai's mood and color.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Musee Settings Tab */}
            <TabsContent value="musee" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Musee Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your personal settings. Musee means "the one who is taught" - you are Musai's student and companion.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Photo */}
                  <div className="space-y-4">
                    <Label>Your Photo</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={preferences.userPhotoUrl || undefined} />
                        <AvatarFallback className="text-lg">
                          {userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Button 
                        variant="outline" 
                        onClick={() => handlePhotoUpload(true)}
                        className="flex items-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        Upload Photo
                      </Button>
                    </div>
                  </div>

                  {/* User Name */}
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Your Name</Label>
                    <Input
                      id="user-name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Personal Memories */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Personal Memories</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addMemory}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Memory
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {userMemories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No memories stored yet. Add memories to help Musai understand you better.
                        </p>
                      ) : (
                        userMemories.map((memory, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm">{memory}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMemory(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 