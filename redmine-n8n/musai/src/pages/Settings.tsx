import React from 'react';
import { SettingsPanel } from '@/components/chat/SettingsPanel';

export const Settings: React.FC = () => {
  return (
    <div className="min-h-[100dvh]">
      <SettingsPanel onClose={() => {}} />
    </div>
  );
};

export default Settings;
