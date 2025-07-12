
import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  UniqueIdentifier,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import { Deal } from "./DealCard";
import { api } from "../services/api";
import { toast } from "sonner";

export interface Stage {
  id: UniqueIdentifier;
  name: string;
  pipeline_order: number;
}

interface SupabaseDeal {
  id: UniqueIdentifier;
  name: string;
  value_amount: number | null;
  deal_stage_id: UniqueIdentifier;
  contact_id: number | null;
}

interface SupabaseContact {
  id: number;
  name: string;
}

export type DealWithStage = Deal & { stageId: UniqueIdentifier };

const KanbanBoard: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<DealWithStage[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStages(true);
      setLoadingDeals(true);
      setErrorData(null);

      try {
        // Fetch stages
        const stagesData = await api.deals.getStages();
        setStages(stagesData || []);

        // Fetch deals
        const dealsData = await api.deals.list();
        
        // Process deals to get contact names
        const processedDeals: DealWithStage[] = [];
        
        for (const deal of dealsData) {
          let clientName = "No Contact";
          
          if (deal.contact_id) {
            try {
              const contact = await api.contacts.get(deal.contact_id);
              clientName = contact.name || "Unknown Contact";
            } catch (error) {
              console.warn(`Failed to fetch contact ${deal.contact_id}:`, error);
              clientName = "Unknown Contact";
            }
          }

          processedDeals.push({
            id: deal.id,
            name: deal.name,
            value: deal.value_amount || 0,
            clientName,
            stageId: deal.deal_stage_id,
            contactId: deal.contact_id,
          });
        }
        
        setDeals(processedDeals);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setErrorData(err.message || "Failed to fetch data");
        setStages([]);
        setDeals([]);
      }
      setLoadingStages(false);
      setLoadingDeals(false);
    };

    fetchData();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && active.data.current?.deal) {
      const activeDealId = active.id;
      const targetStageId = over.id;
      const originalStageId = active.data.current.deal.stageId;

      // Optimistic UI update
      setDeals((prevDeals) =>
        prevDeals.map((deal) =>
          deal.id === activeDealId ? { ...deal, stageId: targetStageId } : deal
        )
      );

      try {
        await api.deals.moveToStage(activeDealId.toString(), targetStageId.toString());
        console.log(`Deal ${activeDealId} successfully moved to stage ${targetStageId}.`);
      } catch (error: any) {
        console.error("Failed to update deal stage:", error);
        toast.error(`Failed to move deal: ${error.message}`);
        // Revert UI update on error
        setDeals((prevDeals) =>
          prevDeals.map((deal) =>
            deal.id === activeDealId ? { ...deal, stageId: originalStageId } : deal
          )
        );
      }
    } else if (over && active.id === over.id) {
      // Dropped in the same place, do nothing
      console.log("Deal dropped in the same column. No change.");
    } else if (!active.data.current?.deal){
      console.warn("Drag operation ended but active.data.current.deal was not found. This can happen if the component unmounted or data was not correctly passed during drag start.");
    }
  };

  const getDealsForStage = (stageId: UniqueIdentifier) => {
    return deals.filter((deal) => deal.stageId === stageId);
  };

  if (loadingStages || loadingDeals) {
    return <div className="p-4 text-slate-300">Loading pipeline data...</div>;
  }

  if (errorData) {
    return <div className="p-4 text-red-400">Error: {errorData}</div>;
  }

  if (stages.length === 0) {
    return (
      <div className="p-4 text-slate-300">
        No pipeline stages found. Please configure stages in the database.
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-row p-4 space-x-4 overflow-x-auto bg-slate-950 rounded-lg min-h-[calc(100vh-200px)]">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stageId={stage.id}
            stageName={stage.name}
            deals={getDealsForStage(stage.id)}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
