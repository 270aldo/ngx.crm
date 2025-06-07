import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, CalendarDays, UserCircle, Zap, Paperclip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskRead } from "brain/data-contracts"; // Import TaskRead
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // For tooltips

interface TaskListProps {
  tasks: TaskRead[];
  onEditTask: (task: TaskRead) => void;
  onDeleteTask: (taskId: string) => void;
  isLoading?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onEditTask, onDeleteTask, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading tasks...</p> {/* Replace with Skeleton later if needed */}
      </div>
    );
  }
  if (tasks.length === 0) {
    return <div className="text-center py-10"><p className="text-gray-500">No tasks available. Create one to get started!</p></div>;
  }

  const getStatusBadgeVariant = (status?: string | null): "outline" | "secondary" | "default" | "destructive" => {
    switch (status?.toLowerCase()) {
      case "to do":
        return "outline";
      case "in progress":
        return "secondary";
      case "completed":
        return "default";
      case "blocked":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityTextAndColor = (priority?: string | null): { text: string; color: string } => {
    switch (priority?.toLowerCase()) {
      case "low":
        return { text: "Low", color: "text-green-600" };
      case "medium":
        return { text: "Medium", color: "text-yellow-600" };
      case "high":
        return { text: "High", color: "text-orange-600" };
      case "urgent":
        return { text: "Urgent!", color: "text-red-600 font-semibold" };
      default:
        return { text: priority || "N/A", color: "" };
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="rounded-md border bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead className="w-[15%]">Status</TableHead>
            <TableHead className="w-[15%] hidden md:table-cell">Priority</TableHead>
            <TableHead className="w-[15%] hidden md:table-cell">Due Date</TableHead>
            <TableHead className="w-[15%] hidden lg:table-cell">Assigned To</TableHead>
            {/* <TableHead className="w-[10%] hidden lg:table-cell">Relations</TableHead> */}
            <TableHead className="text-right w-[10%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const priorityStyle = getPriorityTextAndColor(task.priority);
            return (
              <TableRow key={task.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="truncate" title={task.title}>{task.title}</span>
                    {task.description && <small className="text-xs text-gray-500 truncate" title={task.description}>{task.description}</small>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                    {task.status || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className={`hidden md:table-cell font-medium ${priorityStyle.color}`}>
                  {priorityStyle.text}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {task.due_date ? (
                    <span className="flex items-center space-x-1 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                      <span>{formatDate(task.due_date)}</span>
                    </span>
                  ) : <span className="text-gray-400 text-sm">N/A</span>}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {task.assigned_to_user_id ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center space-x-1 text-sm">
                            <UserCircle className="h-4 w-4 text-gray-500" />
                            <span className="truncate">{task.assigned_to_user_id}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Assigned to: {task.assigned_to_user_id}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : <span className="text-gray-400 text-sm">Unassigned</span>}
                </TableCell>
                {/* 
                <TableCell className="hidden lg:table-cell">
                  <div className="flex space-x-1">
                    {task.related_lead_id && <Zap className="h-3.5 w-3.5 text-blue-500" title={`Lead: ${task.related_lead_id}`} />}
                    {task.related_contact_id && <UserCircle className="h-3.5 w-3.5 text-green-500" title={`Contact: ${task.related_contact_id}`} />}
                    {task.related_deal_id && <Paperclip className="h-3.5 w-3.5 text-purple-500" title={`Deal: ${task.related_deal_id}`} />}
                  </div>
                </TableCell> 
                */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEditTask(task)}>
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-red-600 hover:!text-red-600 hover:!bg-red-50">
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
