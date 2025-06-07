import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import brain from "brain"; // HTTP client
import { PipelineStatsResponse, FunnelStage } from "brain/data-contracts"; // Types
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'; // Added PieChart, Pie

// Define some colors for the dark theme charts
const CHART_COLORS = {
  primary: "#8884d8", // A purple shade, often used as primary
  secondary: "#82ca9d", // A greenish shade
  tertiary: "#ffc658", // Amber/yellow
  accent: "#ff8042",   // Orange
  neutral: "#cccccc",  // Light gray for text/axes in dark mode
  grid: "#444444"     // Darker gray for grid lines
};

// Custom Tooltip for charts to match dark theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-md shadow-lg">
        <p className="label text-sm text-foreground">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.fill }}>
            <p className="text-xs">{`${pld.name}: ${pld.value}`}{pld.dataKey === 'value' ? ' (USD)' : ' deals'}</p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};


const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<PipelineStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // The brain client method might be named differently, e.g., get_pipeline_stats based on FastAPI endpoint name
        // We'll assume a method like `get_pipeline_stats` exists. If not, we'll need to check generated client.
        const response = await brain.get_pipeline_stats({}); // Query parameters like `range` can be added later
        const data: PipelineStatsResponse = await response.json();
        setStats(data);
        console.log("Pipeline Stats received from API:", data); // Log the data received
      } catch (err) {
        console.error("Error fetching pipeline stats:", err);
        let errorMessage = "Failed to fetch analytics data.";
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        } else if (err && typeof err === 'object' && 'detail' in err && typeof err.detail === 'string') {
            errorMessage = err.detail;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <p className="text-center text-muted-foreground">No analytics data available.</p>
      </div>
    );
  }

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  // Helper to format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Sales Pipeline Analytics</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Key metrics and performance indicators for your sales operations.
        </p>
      </header>

      {/* Key Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total_leads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.active_deals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Potential MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(stats.potential_mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Deal Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPercentage(stats.deal_win_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Won Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.won_deals}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Won MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(stats.won_mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Avg. Deal Value (Won)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(stats.average_deal_value)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Lead to Deal %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPercentage(stats.lead_to_deal_conversion_rate)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Deal Volume by Stage</h2>
        <Card className="bg-card">
          <CardContent className="pt-6">
            {stats.deal_volume_by_stage && stats.deal_volume_by_stage.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.deal_volume_by_stage} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="name" stroke={CHART_COLORS.neutral} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke={CHART_COLORS.neutral} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.neutral} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }}/>
                  <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.neutral }} />
                  <Bar yAxisId="left" dataKey="count" name="Deal Count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]}>
                    {stats.deal_volume_by_stage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? CHART_COLORS.primary : index === 1 ? CHART_COLORS.secondary : index === 2 ? CHART_COLORS.tertiary : CHART_COLORS.accent} />
                    ))}
                  </Bar>
                  {stats.deal_volume_by_stage.some(stage => stage.value !== undefined && stage.value !== null) && (
                    <Bar yAxisId="right" dataKey="value" name="Deal Value (USD)" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">No deal volume data available to display chart.</p>
            )}
          </CardContent>
        </Card>
      </section>
      
      {/* Further sections for Average Time in Stage, Lead Sources, Program Type - Placeholder */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card">
            <CardHeader><CardTitle className="text-xl text-foreground">Lead Sources Breakdown</CardTitle></CardHeader>
            <CardContent className="pt-4">
                 {stats.lead_sources_breakdown && stats.lead_sources_breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.lead_sources_breakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="count" // Using count for pie size, tooltip will show percentage
                                nameKey="source_name"
                            >
                                {stats.lead_sources_breakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[Object.keys(CHART_COLORS)[index % Object.keys(CHART_COLORS).length] as keyof typeof CHART_COLORS] || CHART_COLORS.primary} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.neutral, paddingTop: '10px' }} formatter={(value, entry) => {
                                const { color } = entry;
                                const source = stats.lead_sources_breakdown.find(s => s.source_name === value);
                                const percentage = source ? formatPercentage(source.percentage) : "";
                                return <span style={{ color }}>{value} ({percentage})</span>;
                            }}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-10">No lead source data available.</p>}
            </CardContent>
        </Card>
        <Card className="bg-card">
            <CardHeader><CardTitle className="text-xl text-foreground">Avg. Time in Stage</CardTitle></CardHeader>
            <CardContent className="pt-4">
                {stats.average_time_in_stage && stats.average_time_in_stage.length > 0 ? (
                    <ul className="space-y-1">
                        {stats.average_time_in_stage.map(s => (
                            <li key={s.stage_name} className="text-sm flex justify-between text-muted-foreground"><span>{s.stage_name}:</span> <span className="font-medium text-foreground">{s.average_days} days</span></li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground">N/A</p>}
            </CardContent>
        </Card>
        {/* Moved Program Types to a new row or separate section for better layout if needed */}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
         <Card className="bg-card">
            <CardHeader><CardTitle className="text-xl text-foreground">Program Types Distribution</CardTitle></CardHeader>
            <CardContent className="pt-4">
                {stats.program_type_distribution && stats.program_type_distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.program_type_distribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="program_name"
                            >
                                {stats.program_type_distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[Object.keys(CHART_COLORS)[(index + 2) % Object.keys(CHART_COLORS).length] as keyof typeof CHART_COLORS] || CHART_COLORS.secondary} /> // Offset colors a bit
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.neutral, paddingTop: '10px' }} formatter={(value, entry) => {
                                const { color } = entry;
                                const program = stats.program_type_distribution.find(p => p.program_name === value);
                                const percentage = program ? formatPercentage(program.percentage) : "";
                                return <span style={{ color }}>{value} ({percentage})</span>;
                            }}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-10">No program type data available.</p>}
            </CardContent>
        </Card>
        {/* Placeholder for other charts or data if needed */}
        <Card className="bg-card">
            <CardHeader><CardTitle className="text-xl text-foreground">Future Chart/Data</CardTitle></CardHeader>
            <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground text-center py-10">Placeholder for more analytics.</p>
            </CardContent>
        </Card>
      </section>

    </div>
  );
};

export default AnalyticsPage;
