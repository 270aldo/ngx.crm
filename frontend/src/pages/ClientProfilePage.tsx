import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ContactInfoCard from "components/ContactInfoCard";
import DealsHistory from "components/DealsHistory";
import InteractionTimeline, { Interaction } from "components/InteractionTimeline";
import ClientTasks, { ClientTask } from "components/ClientTasks";
import NotesSection, { ClientNote } from "components/NotesSection";
import ClientMetrics, { ClientMetricsData } from "components/ClientMetrics";
import NGXMCPIntegration from "../components/NGXMCPIntegration";\nimport AutoTierDetectionWidget from "../components/AutoTierDetectionWidget";
import { api } from "../services/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap } from "lucide-react";

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
      setLoading(true);
      try {
        const data = await api.contacts.get(contactId);
        if (data) {
          setContact({ 
            ...data, 
            program: data.program_type,
            id: data.id 
          });
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
      setDealsLoading(true);
      try {
        const dealsData = await api.contacts.getDeals(contactId);
        const transformedDeals = dealsData?.map(d => ({
          id: d.id,
          name: d.name || 'Unnamed Deal',
          stage: d.deal_stages?.name || d.deal_stage_id || 'Unknown', 
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
      setInteractionsLoading(true);
      try {
        const interactionsData = await api.contacts.getInteractions(contactId);
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
        const tasksData = await api.contacts.getTasks(contactId);
        const mappedTasks: ClientTask[] = tasksData?.map(t => ({
          id: t.id,
          title: t.title || "Untitled Task",
          dueDate: t.due_date,
          status: t.status || "Unknown",
          description: t.description,
          priority: t.priority,
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
    return (
      <div className="flex items-center justify-center min-h-screen ngx-glass">
        <div className="text-center">
          <div className="ngx-spinner mb-4 mx-auto"></div>
          <p className="text-ngx-gradient font-ngx-primary font-semibold">Cargando perfil del cliente...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-400 font-ngx-primary">Cliente no encontrado o ID no proporcionado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-ngx min-h-screen">
      {/* NGX Header */}
      <header className="mb-ngx-8 text-center py-ngx-6">
        <div className="flex items-center justify-center space-x-ngx-4 mb-ngx-4">
          <div className="w-12 h-12 rounded-ngx-full ngx-gradient-primary flex items-center justify-center animate-ngx-glow">
            <Brain className="w-6 h-6 text-ngx-white" />
          </div>
          <h1 className="text-ngx-4xl font-ngx-primary font-bold text-ngx-gradient">
            Perfil Inteligente: {contact.name}
          </h1>
          <div className="w-12 h-12 rounded-ngx-full ngx-gradient-primary flex items-center justify-center animate-ngx-glow">
            <Zap className="w-6 h-6 text-ngx-white" />
          </div>
        </div>
        <p className="text-ngx-lg font-ngx-secondary text-ngx-text-secondary">
          Análisis completo potenciado por NGX_Closer.Agent
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-ngx-8">
        {/* Left Column / Main Info */} 
        <div className="xl:col-span-2 space-y-ngx-6">
          <ContactInfoCard contact={contact} />
          <DealsHistory deals={clientDeals} contactId={contact.id.toString()} isLoading={dealsLoading} />
          <InteractionTimeline interactions={clientInteractions} contactId={contact.id.toString()} isLoading={interactionsLoading} />
        </div>

        {/* Right Column / NGX AI Sidebar */} 
        <div className="space-y-ngx-6">
          {/* Auto Tier Detection Widget */}
          <AutoTierDetectionWidget 
            contactId={contact.id.toString()}
            autoDetect={true}
            showInsights={true}
            showRecommendations={true}
          />
          
          {/* NGX MCP Integration - AI Features */}
          <Card className="border-l-4 border-l-ngx-electric-violet">
            <CardHeader>
              <CardTitle className="flex items-center text-ngx-gradient">
                <Brain className="w-5 h-5 mr-2" />
                NGX Intelligence Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NGXMCPIntegration 
                contactId={contact.id.toString()}
                className="space-y-4"
              />
            </CardContent>
          </Card>
          
          {/* Traditional Components */}
          <ClientMetrics metrics={dummyMetrics} />
          <ClientTasks tasks={clientTasks} contactId={contact.id.toString()} isLoading={tasksLoading} />
          <NotesSection notes={dummyNotes} contactId={contact.id.toString()} />
        </div>
      </div>
    </div>
  );}
};

export default ClientProfilePage;
