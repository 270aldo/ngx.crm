import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // For interaction type if needed

// Define an interface for a single Interaction
export interface Interaction {
  id: string | number;
  type: string; // e.g., "Email", "Call", "Meeting", "WhatsApp"
  date: string; // ISO string for date/time
  summary: string;
  // Optional fields like: outcome, next_action_date, agent_id
}

interface InteractionTimelineProps {
  interactions: Interaction[];
  contactId: string;
  isLoading?: boolean;
}

const InteractionTimeline: React.FC<InteractionTimelineProps> = ({ interactions, contactId, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Interaction Timeline</CardTitle>
          <CardDescription className="text-slate-400">
            Loading client interaction history...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-12 h-12 bg-slate-700 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!interactions || interactions.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Interaction Timeline</CardTitle>
          <CardDescription className="text-slate-400">
            No interactions recorded for this client yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">This client has no interaction history.</p>
        </CardContent>
      </Card>
    );
  }

  // A simple list for now. A more visual timeline can be implemented later.
  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-100">Interaction Timeline</CardTitle>
        <CardDescription className="text-slate-400">
          Chronological record of communications and touchpoints.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {interactions.map((interaction) => (
            <li key={interaction.id} className="pb-4 border-b border-slate-700 last:border-b-0">
              <div className="flex justify-between items-center mb-1">
                <p className="font-semibold text-slate-200">{interaction.type}</p>
                <p className="text-xs text-slate-400">
                  {new Date(interaction.date).toLocaleDateString()} {new Date(interaction.date).toLocaleTimeString()}
                </p>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{interaction.summary}</p>
            </li>
          ))}
        </ul>
        {/* Placeholder for adding a new interaction */}
        <div className="mt-6 text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300">+ Add Interaction</button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractionTimeline;
