import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { api } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

// NGX Design System Chart Colors
const CHART_COLORS = {
  primary: "#8B5CF6", // NGX Electric Violet
  secondary: "#5B21B6", // NGX Deep Purple
  tertiary: "#F59E0B", // NGX Prime Gold
  accent: "#10B981",   // NGX Longevity Green
  custom: "#6366F1",   // NGX Custom Indigo
  neutral: "#FFFFFF",  // NGX White for text/axes
  grid: "rgba(139, 92, 246, 0.2)"     // NGX Electric Violet with opacity
};

// Custom Tooltip for charts to match dark theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 ngx-glass border border-ngx-border rounded-ngx-lg shadow-ngx-md">
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
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.analytics.getPipelineStats();
        setStats(data);
        console.log("Pipeline Stats received from API:", data);
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
      <div className="flex justify-center items-center h-screen ngx-glass">
        <Loader2 className="h-12 w-12 animate-spin text-ngx-electric-violet ngx-glow-md" />
        <p className="ml-4 text-lg font-ngx-primary text-ngx-gradient">Loading analytics...</p>
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
    <div className="container-ngx">
      <header className="mb-ngx-8">
        <h1 className="text-ngx-4xl font-ngx-primary font-bold tracking-tight text-ngx-gradient animate-ngx-glow">
          NGX Sales Pipeline Analytics
        </h1>
        <p className="mt-ngx-2 text-ngx-lg font-ngx-secondary text-ngx-text-secondary">
          Insights revolucionarios para optimizar tu pipeline de ventas NGX.
        </p>
      </header>

      {/* Key Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-ngx-6 mb-ngx-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{stats.total_leads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{stats.active_deals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Potential MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{formatCurrency(stats.potential_mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Deal Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{formatPercentage(stats.deal_win_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Won Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{stats.won_deals}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Won MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{formatCurrency(stats.won_mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Avg. Deal Value (Won)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{formatCurrency(stats.average_deal_value)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-ngx-base font-ngx-primary font-medium">Lead to Deal %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ngx-3xl font-ngx-primary font-bold text-ngx-gradient">{formatPercentage(stats.lead_to_deal_conversion_rate)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-ngx-8">
        <h2 className="text-ngx-2xl font-ngx-primary font-semibold mb-ngx-4 text-ngx-gradient">Deal Volume by Stage</h2>
        <Card className="hover-ngx-glow">
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
              <p className="text-ngx-text-secondary font-ngx-secondary text-center py-10">No deal volume data available to display chart.</p>
            )}
          </CardContent>
        </Card>
      </section>
      
      {/* Further sections for Average Time in Stage, Lead Sources, Program Type - Placeholder */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-ngx-6">
        <Card className="md:col-span-2 hover-ngx-glow">
            <CardHeader><CardTitle className="text-ngx-xl font-ngx-primary text-ngx-gradient">Lead Sources Breakdown</CardTitle></CardHeader>
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
                ) : <p className="text-ngx-sm text-ngx-text-secondary font-ngx-secondary text-center py-10">No lead source data available.</p>}
            </CardContent>
        </Card>
        <Card className="hover-ngx-glow">
            <CardHeader><CardTitle className="text-ngx-xl font-ngx-primary text-ngx-gradient">Avg. Time in Stage</CardTitle></CardHeader>
            <CardContent className="pt-4">
                {stats.average_time_in_stage && stats.average_time_in_stage.length > 0 ? (
                    <ul className="space-y-1">
                        {stats.average_time_in_stage.map(s => (
                            <li key={s.stage_name} className="text-ngx-sm flex justify-between text-ngx-text-secondary font-ngx-secondary"><span>{s.stage_name}:</span> <span className="font-medium text-ngx-gradient font-ngx-primary">{s.average_days} days</span></li>
                        ))}
                    </ul>
                ) : <p className="text-ngx-sm text-ngx-text-secondary font-ngx-secondary">N/A</p>}
            </CardContent>
        </Card>
        {/* Moved Program Types to a new row or separate section for better layout if needed */}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-ngx-6 mt-ngx-8">
         <Card className="hover-ngx-glow">
            <CardHeader><CardTitle className="text-ngx-xl font-ngx-primary text-ngx-gradient">Program Types Distribution</CardTitle></CardHeader>
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
                ) : <p className="text-ngx-sm text-ngx-text-secondary font-ngx-secondary text-center py-10">No program type data available.</p>}
            </CardContent>
        </Card>
        {/* Placeholder for other charts or data if needed */}
        <Card className="hover-ngx-glow">
            <CardHeader><CardTitle className="text-ngx-xl font-ngx-primary text-ngx-gradient">Future Chart/Data</CardTitle></CardHeader>
            <CardContent className="pt-4">
                 <p className="text-ngx-sm text-ngx-text-secondary font-ngx-secondary text-center py-10">Placeholder for more analytics.</p>
            </CardContent>
        </Card>
      </section>

    </div>
  );
};

export default AnalyticsPage;
