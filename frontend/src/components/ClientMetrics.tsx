import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define an interface for Client Metrics
export interface ClientMetricsData {
  ltv?: number; // Lifetime Value
  activityScore?: number; // Engagement or activity score
  averageDealSize?: number;
  conversionRate?: number; // If applicable at client level
  // Add other relevant metrics
}

interface ClientMetricsProps {
  metrics: ClientMetricsData | null;
  isLoading?: boolean;
}

const ClientMetrics: React.FC<ClientMetricsProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Key Metrics</CardTitle>
          <CardDescription className="text-slate-400">
            Loading key client metrics...
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse"></div>
              <div className="h-6 bg-slate-700 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Key Metrics</CardTitle>
          <CardDescription className="text-slate-400">
            Relevant performance indicators for this client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">No specific metrics available for this client at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  const MetricDisplay: React.FC<{ label: string; value?: number | string; unit?: string }> = ({ label, value, unit }) => (
    <div className="p-4 bg-slate-750 rounded-lg">
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      {value !== undefined && value !== null ? (
        <p className="text-2xl font-semibold text-slate-50">
          {unit === "$" && value}
          {value.toLocaleString()}
          {unit && unit !== "$" && ` ${unit}`}
        </p>
      ) : (
        <p className="text-2xl font-semibold text-slate-500">N/A</p>
      )}
    </div>
  );

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-100">Key Metrics</CardTitle>
        <CardDescription className="text-slate-400">
          Relevant performance indicators for this client.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.ltv !== undefined && (
            <MetricDisplay label="Lifetime Value (LTV)" value={metrics.ltv} unit="$" />
        )}
        {metrics.activityScore !== undefined && (
            <MetricDisplay label="Activity Score" value={metrics.activityScore} />
        )}
        {metrics.averageDealSize !== undefined && (
            <MetricDisplay label="Avg. Deal Size" value={metrics.averageDealSize} unit="$" />
        )}
        {metrics.conversionRate !== undefined && (
            <MetricDisplay label="Conversion Rate" value={metrics.conversionRate} unit="%" />
        )}
        {/* Add more metrics as they become available */}
      </CardContent>
    </Card>
  );
};

export default ClientMetrics;
