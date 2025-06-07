import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Define an interface for a single Task
export interface ClientTask {
  id: string | number;
  title: string;
  dueDate: string | null; // Can be ISO string or null
  status: string;
  description?: string | null;
  priority?: string | null;
  // assignedToUserId?: string | null; // Optional: if you plan to show who is assigned
  // createdAt?: string | null; // Optional: if you plan to show creation date
}

interface ClientTasksProps {
  tasks: ClientTask[];
  contactId: string;
  isLoading?: boolean;
}

const ClientTasks: React.FC<ClientTasksProps> = ({ tasks, contactId, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Tasks & Reminders</CardTitle>
          <CardDescription className="text-slate-400">
            Loading tasks for this client...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Tasks & Reminders</CardTitle>
          <CardDescription className="text-slate-400">
            No tasks or reminders found for this client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">No pending or completed tasks for this client.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: ClientTask["status"]) => {
    switch (status) {
      case "Completed":
        return "success";
      case "InProgress":
        return "default"; // Or another color like yellow/orange
      case "Pending":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };
   const getStatusColor = (status: ClientTask["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-600 hover:bg-green-700 text-slate-50";
      case "InProgress":
        return "bg-yellow-500 hover:bg-yellow-600 text-slate-900"; 
      case "Pending":
        return "border-slate-500 text-slate-300";
      case "Cancelled":
        return "bg-red-700 hover:bg-red-800 text-slate-50";
      default:
        return "border-slate-600 text-slate-400";
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-100">Tasks & Reminders</CardTitle>
        <CardDescription className="text-slate-400">
          Stay on top of client-related activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-750 transition-colors">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id={`task-${task.id}`} 
                  checked={task.status === "Completed"} 
                  className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  // onCheckedChange={(checked) => console.log(`Task ${task.id} checked: ${checked}`)}
                />
                <label htmlFor={`task-${task.id}`} className={`text-sm font-medium ${task.status === "Completed" ? "line-through text-slate-500" : "text-slate-200"}`}>
                  {task.title}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                {task.dueDate && (
                  <span className="text-xs text-slate-400">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <Badge variant={getStatusBadgeVariant(task.status) as any} className={`px-2 py-0.5 text-xs ${getStatusColor(task.status)}`}>
                  {task.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300">+ Add Task</button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientTasks;
