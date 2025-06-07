
import React from "react";
import KanbanBoard from "../components/KanbanBoard"; // Adjust path as necessary

const PipelinePage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">Deal Pipeline</h1>
      <KanbanBoard />
    </div>
  );
};

export default PipelinePage;
