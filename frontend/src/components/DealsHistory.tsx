import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define an interface for a single Deal, similar to what might come from Supabase or an API
export interface DealSummary {
  id: string | number;
  name: string;
  stage: string; // This will be deal_stage_id for now, needs mapping to name
  value: number;
  closeDate?: string | null; // Optional, can be an ISO string
  // Add other relevant fields like probability, created_at, etc.
}

interface DealsHistoryProps {
  deals: DealSummary[];
  contactId: string; // To potentially fetch more details or link actions
  isLoading?: boolean;
}

const DealsHistory: React.FC<DealsHistoryProps> = ({ deals, contactId, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Deals History</CardTitle>
          <CardDescription className="text-slate-400">
            Loading deals associated with this client...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deals || deals.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Deals History</CardTitle>
          <CardDescription className="text-slate-400">
            No deals found for this client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">This client currently has no associated deals.</p>
        </CardContent>
      </Card>
    );
  }

  const getStageBadgeVariant = (stage: string) => {
    if (stage?.toLowerCase().includes("won")) return "success";
    if (stage?.toLowerCase().includes("lost")) return "destructive";
    if (stage?.toLowerCase().includes("proposal")) return "default"; 
    if (stage?.toLowerCase().includes("negotiation")) return "secondary";
    return "outline";
  };

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-100">Deals History</CardTitle>
        <CardDescription className="text-slate-400">
          A summary of past and current deals associated with this client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-750">
              <TableHead className="text-slate-300">Deal Name</TableHead>
              <TableHead className="text-slate-300">Stage</TableHead>
              <TableHead className="text-slate-300 text-right">Value</TableHead>
              <TableHead className="text-slate-300">Close Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((deal) => (
              <TableRow key={deal.id} className="border-slate-700 hover:bg-slate-750">
                <TableCell className="font-medium text-slate-200">{deal.name}</TableCell>
                <TableCell>
                  <Badge variant={getStageBadgeVariant(deal.stage) as any} className={
                    `${getStageBadgeVariant(deal.stage) === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                      getStageBadgeVariant(deal.stage) === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 
                      getStageBadgeVariant(deal.stage) === 'default' ? 'bg-blue-600 hover:bg-blue-700' : 
                      getStageBadgeVariant(deal.stage) === 'secondary' ? 'bg-yellow-500 hover:bg-yellow-600' : 'border-slate-500'}
                     text-slate-50 px-2 py-0.5 text-xs`
                  }>
                    {deal.stage}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-slate-200">${deal.value.toLocaleString()}</TableCell>
                <TableCell className="text-slate-300">
                  {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DealsHistory;
