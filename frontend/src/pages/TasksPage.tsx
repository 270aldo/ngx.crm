import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TaskList } from "components/TaskList";
import { TaskForm } from "components/TaskForm";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import brain from "brain"; // Import brain client
import { TaskRead, TaskCreate, TaskUpdate } from "brain/data-contracts"; // Import types

// Mock data for initial display - to be replaced by API call
const mockTasks: TaskRead[] = [
  {
    id: "1",
    title: "Follow up with Client X",
    description: "Discuss new proposal and gather feedback.",
    due_date: "2024-05-25T10:00:00Z",
    status: "In Progress",
    priority: "High",
    created_at: "2024-05-20T09:00:00Z",
    updated_at: "2024-05-20T11:00:00Z",
    created_by_user_id: "user-123",
  },
  {
    id: "2",
    title: "Prepare Q3 Report",
    description: "Compile sales data and generate report.",
    due_date: "2024-06-15T17:00:00Z",
    status: "To Do",
    priority: "Medium",
    created_at: "2024-05-18T14:00:00Z",
    updated_at: "2024-05-18T14:00:00Z",
    assigned_to_user_id: "user-456",
  },
  {
    id: "3",
    title: "Team Meeting",
    description: "Weekly sync-up and project updates.",
    due_date: "2024-05-22T11:00:00Z",
    status: "Completed",
    priority: "Low",
    created_at: "2024-05-15T10:00:00Z",
    updated_at: "2024-05-22T12:00:00Z",
    completed_at: "2024-05-22T12:00:00Z",
  },
];

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskRead[]>([]); // Use TaskRead, initialize empty
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null); // For error messages
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRead | null>(null); // Use TaskRead

  // useEffect to fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Attempting to fetch tasks from API...");
        const response = await brain.list_tasks({}); // Pass empty object for no filters
        const data: TaskRead[] = await response.json(); // Type assertion for the data
        console.log("Tasks fetched from API:", data);
        setTasks(data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        let errorMessage = "Failed to fetch tasks.";
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        } else if (err && typeof err === 'object' && 'detail' in err && typeof err.detail === 'string') {
            errorMessage = err.detail; // Handle FastAPI HTTPValidationErrors
        }
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleFormSubmit = async (formData: Partial<TaskRead>) => {
    setIsLoading(true); 
    setError(null);
    try {
      if (formData.id) {
        // Update existing task
        const { id, created_at, updated_at, created_by_user_id, ...updatePayloadRest } = formData;
        
        // Construct TaskUpdate payload carefully, only including fields present in TaskUpdate interface
        const updatePayload: TaskUpdate = {
          title: updatePayloadRest.title,
          description: updatePayloadRest.description,
          due_date: updatePayloadRest.due_date,
          status: updatePayloadRest.status,
          priority: updatePayloadRest.priority,
          assigned_to_user_id: updatePayloadRest.assigned_to_user_id,
          related_lead_id: updatePayloadRest.related_lead_id,
          related_contact_id: updatePayloadRest.related_contact_id,
          related_deal_id: updatePayloadRest.related_deal_id,
          completed_at: updatePayloadRest.completed_at,
        };

        // Remove undefined properties to send a clean payload
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key as keyof TaskUpdate] === undefined) {
            delete updatePayload[key as keyof TaskUpdate];
          }
        });

        const response = await brain.update_task({ taskId: id }, updatePayload); 
        const updatedTask = await response.json();
        setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
        toast.success(`Task "${updatedTask.title}" updated successfully!`);
      } else {
        // Add new task
        // Construct TaskCreate payload. created_by_user_id is optional in TaskCreate.
        // For now, we are not setting created_by_user_id from frontend explicitly.
        // It might be set by backend based on auth, or be truly optional.
        const createPayload: TaskCreate = {
          title: formData.title || "Untitled Task", // Ensure title is present
          description: formData.description,
          due_date: formData.due_date,
          status: formData.status,
          priority: formData.priority,
          assigned_to_user_id: formData.assigned_to_user_id,
          related_lead_id: formData.related_lead_id,
          related_contact_id: formData.related_contact_id,
          related_deal_id: formData.related_deal_id,
          completed_at: formData.completed_at,
          // created_by_user_id: formData.created_by_user_id, // If you want to send it from FE
        };

        // Remove undefined properties to send a clean payload
        Object.keys(createPayload).forEach(key => {
          if (createPayload[key as keyof TaskCreate] === undefined) {
            delete createPayload[key as keyof TaskCreate];
          }
        });

        const response = await brain.create_task(createPayload);
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        toast.success(`Task "${newTask.title}" created successfully!`);
      }
      setIsDialogOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error("Error submitting task:", err);
      let errorMessage = "Failed to save task.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'detail' in err) {
        if (Array.isArray(err.detail)) { // Handle FastAPI HTTPValidationErrors array
            errorMessage = err.detail.map(e => `${e.loc.join('.')} - ${e.msg}`).join("; ");
        } else if (typeof err.detail === 'string') {
            errorMessage = err.detail;
        }
      }
      toast.error(errorMessage);
      setError(errorMessage); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = (task: TaskRead) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setIsLoading(true); // Optional: set loading state for delete
      try {
        await brain.delete_task({ taskId });
        setTasks(tasks.filter((task) => task.id !== taskId));
        toast.info("Task deleted successfully!");
      } catch (err) {
        console.error("Error deleting task:", err);
        let errorMessage = "Failed to delete task.";
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        } else if (err && typeof err === 'object' && 'detail' in err && typeof err.detail === 'string') {
            errorMessage = err.detail;
        }
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const openNewTaskDialog = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-background text-foreground">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTask(null); // Reset editing task when dialog closes
        }}>
          <DialogTrigger asChild>
            <Button onClick={openNewTaskDialog}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Update the details of your task." : "Fill in the details to create a new task."}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmit={handleFormSubmit}
              initialData={editingTask}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingTask(null);
              }}
            />
            {/* TaskForm will have its own submit/cancel buttons now, or DialogFooter can be used */}
          </DialogContent>
        </Dialog>
      </div>

      <p className="mb-6 text-muted-foreground">
        View, create, and manage all your project tasks and to-dos.
      </p>

      {isLoading && <p>Loading tasks...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && tasks.length > 0 ? (
        <TaskList
          tasks={tasks}
          onEditTask={handleEditTask} // Corrected prop name
          onDeleteTask={handleDeleteTask} // Corrected prop name
        />
      ) : !isLoading && !error && (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No tasks yet.</p>
          <p className="text-sm text-muted-foreground mb-4">Click "Add Task" to get started.</p>
           <Button variant="outline" onClick={openNewTaskDialog}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Your First Task
            </Button>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
