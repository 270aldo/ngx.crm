
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export interface Deal {
  id: string | number; // Important: dnd-kit needs a unique ID, ensure it's string or number
  name: string;
  value: number;
  clientName: string;
  contactId?: string | number | null; // Added contactId for navigation
  daysInStage?: number; 
}

export interface DealCardProps {
  deal: Deal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id, // Unique ID for dnd-kit
    data: { deal }, // Optional: pass data with the draggable item
  });
  const navigate = useNavigate(); // Initialize useNavigate

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 100 : undefined, // Elevate while dragging
        opacity: isDragging ? 0.8 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200 bg-slate-800 border-slate-700 cursor-grab">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold text-slate-100">{deal.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm text-slate-300">
          <p
            className="cursor-pointer hover:underline hover:text-blue-400 transition-colors"
            onClick={() => deal.contactId && navigate(`/client-profile?id=${deal.contactId}`)}
            title={deal.contactId ? `View profile of ${deal.clientName}` : "Client name"}
          >
            Client: {deal.clientName}
          </p>
          <p className="mt-1">
            Value: ${deal.value.toLocaleString()}
          </p>
        </CardContent>
        {deal.daysInStage !== undefined && (
          <CardFooter className="p-4 border-t border-slate-700">
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-400">
              {deal.daysInStage} days in stage
            </Badge>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default DealCard;
