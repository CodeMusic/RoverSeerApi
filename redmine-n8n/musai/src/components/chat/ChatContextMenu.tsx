import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Flag, Copy, BookOpen, Code, Heart, Download } from 'lucide-react';

interface ChatContextMenuProps {
  messageId: string;
  x: number;
  y: number;
  module: string;
  onClose: () => void;
  onFlag: () => void;
}

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  messageId,
  x,
  y,
  module,
  onClose,
  onFlag
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleCopy = () => {
    // Copy message content to clipboard
    console.log('Copy message:', messageId);
    onClose();
  };

  const handleExportToTale = () => {
    // Signal export; the container page can listen and open the narrative panel
    const event = new CustomEvent('musai-export-to-narrative', { detail: { messageId, mode: module } });
    window.dispatchEvent(event);
    onClose();
  };

  const handleCopyToCode = () => {
    // Copy to CodeMusai
    console.log('Copy to code:', messageId);
    onClose();
  };

  const handleWellnessAction = () => {
    // Therapy-specific wellness action
    console.log('Wellness action:', messageId);
    onClose();
  };

  const getModuleActions = () => {
    const baseActions = [
      {
        icon: Copy,
        label: 'Copy',
        action: handleCopy
      },
      {
        icon: Flag,
        label: 'Flag',
        action: onFlag
      }
    ];

    switch (module) {
      case 'therapy':
        return [
          ...baseActions,
          {
            icon: BookOpen,
            label: 'Export to Tale',
            action: handleExportToTale
          },
          {
            icon: Heart,
            label: 'Wellness Reflection',
            action: handleWellnessAction
          }
        ];
      
      case 'code':
        return [
          ...baseActions,
          {
            icon: Code,
            label: 'Copy to Playground',
            action: handleCopyToCode
          }
        ];
      
      case 'university':
        return [
          ...baseActions,
          {
            icon: Download,
            label: 'Save as Note',
            action: () => {
              console.log('Save as note:', messageId);
              onClose();
            }
          }
        ];
      
      default:
        return baseActions;
    }
  };

  const actions = getModuleActions();

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[150px]"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          className="w-full justify-start px-3 py-2 h-auto text-left hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={action.action}
        >
          <action.icon className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      ))}
    </div>
  );
};
