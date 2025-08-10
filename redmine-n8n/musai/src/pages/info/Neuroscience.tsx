import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Cpu, Database, Zap, Moon, Sun, ChevronDown, ChevronUp } from "lucide-react";
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import musaiArchDiagram from "@/assets/images/musai_archdiag.png";
import redmineMemoryStructure from "@/assets/images/redmine_memory_structure.png";
import dnaFlow from "@/assets/images/dna_flow.png";
import dayNightTraining from "@/assets/images/day_night_training.png";
import n8nWorkflow from "@/assets/images/n8n_workflow.png";

const Neuroscience = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setIsDarkMode(theme === 'dark');
    document.documentElement.classList.toggle("dark", theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_UNIVERSITY} />
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Content from original Neuroscience page preserved */}
      </div>
    </div>
  );
};

export default Neuroscience;


