
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import DealCard, { Deal } from "./DealCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface KanbanColumnProps {
  stageId: string | number; // Unique ID for dnd-kit
  stageName: string;
  deals: Deal[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stageId, stageName, deals }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stageId, // Unique ID for this droppable area
  });

  const columnStyle = {
    backgroundColor: isOver ? "rgba(100, 116, 139, 0.2)" : undefined, // Highlight when item is over
    transition: "background-color 0.2s ease-in-out",
  };

  return (
    <div ref={setNodeRef} style={columnStyle} className="w-80 h-full flex flex-col flex-shrink-0 mr-4 last:mr-0">
      <Card className="flex flex-col flex-grow bg-slate-900 border-slate-700">
        <CardHeader className="p-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <CardTitle className="text-xl font-bold text-slate-100">{stageName} ({deals.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-grow overflow-y-auto">
          {deals.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No deals in this stage.</p>
          ) : (
            deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanColumn;
