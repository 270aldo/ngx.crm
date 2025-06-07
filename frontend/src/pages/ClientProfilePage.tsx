import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ContactInfoCard from "components/ContactInfoCard";
import DealsHistory from "components/DealsHistory";
import InteractionTimeline, { Interaction } from "components/InteractionTimeline";
import ClientTasks, { ClientTask } from "components/ClientTasks";
import NotesSection, { ClientNote } from "components/NotesSection";
import ClientMetrics, { ClientMetricsData } from "components/ClientMetrics";
import { supabase } from "../../utils/supabaseClient";
import { toast } from "sonner";

// Define interfaces for the data we expect from Supabase
export interface ContactProfile {
  id: string | number;
  name: string | null;
  email: string | null;
  phone: string | null;
  program: string | null; // e.g., PRIME or LONGEVITY
  // Add other fields from your 'contacts' table as needed
}

export interface DealSummary {
  id: string;
  name: string;
  stage: string;
  value: number;
  closeDate?: string;
}

// Dummy data for other components, will be replaced later
const dummyNotes: ClientNote[] = [{ id: "note1", author: "Aldo Olivas", date: "2024-05-21", content: "Client interested in AI features." }];
const dummyMetrics: ClientMetricsData = { ltv: 12000, activityScore: 85 };

const ClientProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("id");
  const [contact, setContact] = useState<ContactProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // State for Deals
  const [clientDeals, setClientDeals] = useState<DealSummary[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  // State for Interactions
  const [clientInteractions, setClientInteractions] = useState<Interaction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(true);

  // State for Tasks
  const [clientTasks, setClientTasks] = useState<ClientTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!contactId) {
      toast.error("No Contact ID provided in the URL.");
      setLoading(false);
      setDealsLoading(false);
      setInteractionsLoading(false);
      setTasksLoading(false); // Also stop tasks loading
      return;
    }

    const fetchContactData = async () => {
      // ... (fetchContactData implementation remains the same)
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select("id, name, email, phone, program_type, created_at")
          .eq("id", contactId)
          .single();

        if (error) throw error;

        if (data) {
          setContact({ ...data, program: data.program_type });
        } else {
          toast.error(`Contact with ID ${contactId} not found.`);
          setContact(null);
        }
      } catch (error: any) {
        console.error("Error fetching contact data:", error);
        toast.error(`Failed to fetch contact: ${error.message}`);
        setContact(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchClientDeals = async () => {
      // ... (fetchClientDeals implementation remains the same)
      setDealsLoading(true);
      try {
        const { data: dealsData, error: dealsError } = await supabase
          .from("deals")
          .select("id, name, value_amount, deal_stage_id, created_at, closed_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false });

        if (dealsError) throw dealsError;
        
        const transformedDeals = dealsData?.map(d => ({
            id: d.id,
            name: d.name || 'Unnamed Deal',
            stage: d.deal_stage_id, 
            value: d.value_amount || 0,
            closeDate: d.closed_at,
        })) || [];
        setClientDeals(transformedDeals);
      } catch (error: any) {
        console.error("Error fetching client deals:", error);
        toast.error(`Failed to fetch deals: ${error.message}`);
        setClientDeals([]);
      } finally {
        setDealsLoading(false);
      }
    };

    const fetchClientInteractions = async () => {
      // ... (fetchClientInteractions implementation remains the same)
      setInteractionsLoading(true);
      try {
        const { data: interactionsData, error: interactionsError } = await supabase
          .from("interactions") 
          .select("id, type, summary, created_at, channel") 
          .eq("contact_id", contactId) 
          .order("created_at", { ascending: false });

        if (interactionsError) throw interactionsError;

        const mappedInteractions: Interaction[] = interactionsData?.map(i => ({
          id: i.id,
          type: i.type || i.channel || "Interaction", 
          date: i.created_at,
          summary: i.summary || "No summary provided",
        })) || [];
        setClientInteractions(mappedInteractions);

      } catch (error: any) {
        console.error("Error fetching client interactions:", error);
        toast.error(`Failed to fetch interactions: ${error.message}`);
        setClientInteractions([]);
      } finally {
        setInteractionsLoading(false);
      }
    };

    const fetchClientTasks = async () => {
      setTasksLoading(true);
      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks") // Using your table name 'tasks'
          .select("id, title, description, due_date, status, priority, created_at, assigned_to_user_id") // Selected relevant columns from your table structure
          .eq("related_contact_id", contactId) // Using your column 'related_contact_id'
          .order("due_date", { ascending: true, nullsFirst: false }); // Order by due date

        if (tasksError) throw tasksError;

        const mappedTasks: ClientTask[] = tasksData?.map(t => ({
          id: t.id,
          title: t.title || "Untitled Task",
          dueDate: t.due_date,
          status: t.status || "Unknown",
          description: t.description, // Optional, can be null
          priority: t.priority, // Optional, can be null
          // assignedToUserId: t.assigned_to_user_id, // We have this data if needed later
          // createdAt: t.created_at, // We have this data if needed later
        })) || [];
        setClientTasks(mappedTasks);

      } catch (error: any) {
        console.error("Error fetching client tasks:", error);
        toast.error(`Failed to fetch tasks: ${error.message}`);
        setClientTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchContactData();
    fetchClientDeals();
    fetchClientInteractions();
    fetchClientTasks();

  }, [contactId]);

  if (loading) {
    return <div className="p-6 text-slate-300">Loading client profile...</div>;
  }

  if (!contact) {
    return <div className="p-6 text-red-400">Client not found or no ID provided.</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-slate-950 min-h-screen text-slate-100">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50">Client Profile: {contact.name}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column / Main Info */} 
        <div className="lg:col-span-2 space-y-6">
          <ContactInfoCard contact={contact} />
          <DealsHistory deals={clientDeals} contactId={contact.id.toString()} isLoading={dealsLoading} />
          <InteractionTimeline interactions={clientInteractions} contactId={contact.id.toString()} isLoading={interactionsLoading} />
        </div>

        {/* Right Column / Sidebar Info */} 
        <div className="space-y-6">
          <ClientMetrics metrics={dummyMetrics} />
          <ClientTasks tasks={clientTasks} contactId={contact.id.toString()} isLoading={tasksLoading} />
          <NotesSection notes={dummyNotes} contactId={contact.id.toString()} />
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
