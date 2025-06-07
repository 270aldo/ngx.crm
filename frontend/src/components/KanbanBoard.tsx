
import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  UniqueIdentifier,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import { Deal } from "./DealCard";
import { supabase } from "../utils/supabaseClient";
import { toast } from "sonner"; // Import toast for notifications

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
      // ... (fetchData implementation remains the same)
      setLoadingStages(true);
      setLoadingDeals(true);
      setErrorData(null);

      try {
        const { data: stagesData, error: stagesError } = await supabase
          .from("deal_stages")
          .select("id, name, pipeline_order")
          .order("pipeline_order", { ascending: true });

        if (stagesError) throw new Error(`Stages Error: ${stagesError.message}`);
        setStages((stagesData as Stage[]) || []);

        const { data: dealsData, error: dealsError } = await supabase
          .from("deals")
          .select("id, name, value_amount, deal_stage_id, contact_id");

        if (dealsError) throw new Error(`Deals Error: ${dealsError.message}`);
        const fetchedSupabaseDeals: SupabaseDeal[] = (dealsData as SupabaseDeal[]) || [];

        let processedDeals: DealWithStage[] = [];

        if (fetchedSupabaseDeals.length > 0) {
          const contactIds = [
            ...new Set(
              fetchedSupabaseDeals
                .map((deal) => deal.contact_id)
                .filter((id): id is number => id !== null)
            ),
          ];

          let contactsMap: Record<number, string> = {};
          if (contactIds.length > 0) {
            const { data: contactsData, error: contactsError } = await supabase
              .from("contacts")
              .select("id, name")
              .in_("id", contactIds);

            if (contactsError) throw new Error(`Contacts Error: ${contactsError.message}`);
            (contactsData as SupabaseContact[])?.forEach((contact) => {
              contactsMap[contact.id] = contact.name;
            });
          }

          processedDeals = fetchedSupabaseDeals.map((deal) => ({
            id: deal.id,
            name: deal.name,
            value: deal.value_amount || 0,
            clientName:
              deal.contact_id
                ? contactsMap[deal.contact_id] || "Unknown Contact"
                : "No Contact",
            stageId: deal.deal_stage_id,
            contactId: deal.contact_id, // Pass contactId
          }));
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
        const { error: updateError } = await supabase
          .from("deals")
          .update({ deal_stage_id: targetStageId })
          .eq("id", activeDealId);

        if (updateError) {
          throw updateError;
        }
        // toast.success(`Deal "${active.data.current.deal.name}" moved successfully.`); // Optional success toast
        console.log(`Deal ${activeDealId} successfully moved to stage ${targetStageId} in Supabase.`);
      } catch (error: any) {
        console.error("Failed to update deal stage in Supabase:", error);
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
