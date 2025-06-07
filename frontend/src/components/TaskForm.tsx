import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskRead } from "brain/data-contracts"; // Import TaskRead

// Use Partial<TaskRead> for form data to cover all fields from TaskRead
// This makes it compatible with what TasksPage expects for editing/creating.
export type TaskFormData = Partial<TaskRead>;

interface TaskFormProps {
  initialData?: TaskFormData | null; 
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

const TaskFormStatusOptions = ["To Do", "In Progress", "Blocked", "Completed"];
const TaskFormPriorityOptions = ["Low", "Medium", "High", "Urgent"];

export const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TaskFormData>({});

  useEffect(() => {
    // When initialData changes, update the form.
    // If initialData is null/undefined, reset to an empty form (for creation mode).
    // Ensure all fields from TaskRead are potentially handled.
    const defaults: TaskFormData = {
      title: "",
      description: "",
      status: "To Do", // Default status
      priority: "Medium", // Default priority
      due_date: "",
      assigned_to_user_id: "",
      related_lead_id: "",
      related_contact_id: "",
      related_deal_id: "",
      completed_at: "",
      // id, created_at, updated_at, created_by_user_id are not typically set by user in form
    };
    
    let effectiveInitialData = { ...defaults, ...(initialData || {}) };

    // Format due_date for input type="date" if present
    if (effectiveInitialData.due_date) {
      try {
        effectiveInitialData.due_date = new Date(effectiveInitialData.due_date).toISOString().split('T')[0];
      } catch (e) {
        console.warn("Invalid due_date format in initialData:", effectiveInitialData.due_date);
        effectiveInitialData.due_date = ""; // Reset if invalid
      }
    }
    // Similarly for completed_at if it were editable (it's usually not directly set in a form)
    // if (effectiveInitialData.completed_at) { ... }

    setFormData(effectiveInitialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      // Consider using a more robust validation library or inline messages
      alert("Title is required."); 
      return;
    }
    // Before submitting, convert date string back to ISO string or null if empty
    const dataToSubmit: TaskFormData = { ...formData };
    
    // Handle due_date
    if (dataToSubmit.due_date) {
      try {
        dataToSubmit.due_date = new Date(dataToSubmit.due_date).toISOString();
      } catch (error) {
        console.error("Invalid due_date for submission:", dataToSubmit.due_date, error);
        dataToSubmit.due_date = null; // Or handle error appropriately
      }
    } else {
      dataToSubmit.due_date = null; 
    }

    // Handle completed_at (assuming it can be set from the form, though typically not)
    if (dataToSubmit.completed_at) {
      try {
        dataToSubmit.completed_at = new Date(dataToSubmit.completed_at).toISOString();
      } catch (error) {
        console.error("Invalid completed_at for submission:", dataToSubmit.completed_at, error);
        dataToSubmit.completed_at = null;
      }
    } else {
      dataToSubmit.completed_at = null;
    }

    // Handle optional UUID fields: if empty string, convert to null
    const uuidFields: (keyof TaskFormData)[] = [
      "assigned_to_user_id", 
      "related_lead_id", 
      "related_contact_id", 
      "related_deal_id"
    ];

    uuidFields.forEach(field => {
      if (dataToSubmit[field] === "") {
        dataToSubmit[field] = null;
      }
    });

    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            name="title"
            value={formData.title || ""}
            onChange={handleChange}
            placeholder="Enter task title"
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" value={formData.status || "To Do"} onValueChange={(value) => handleSelectChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {TaskFormStatusOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Enter task description"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" value={formData.priority || "Medium"} onValueChange={(value) => handleSelectChange("priority", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {TaskFormPriorityOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            value={formData.due_date || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      <h3 className="text-md font-semibold pt-2 border-b pb-1">Relations (Optional IDs)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assigned_to_user_id">Assigned To User ID</Label>
          <Input
            id="assigned_to_user_id"
            name="assigned_to_user_id"
            value={formData.assigned_to_user_id || ""}
            onChange={handleChange}
            placeholder="Enter User ID"
          />
        </div>
         <div>
          <Label htmlFor="related_lead_id">Related Lead ID</Label>
          <Input
            id="related_lead_id"
            name="related_lead_id"
            value={formData.related_lead_id || ""}
            onChange={handleChange}
            placeholder="Enter Lead ID"
          />
        </div>
        <div>
          <Label htmlFor="related_contact_id">Related Contact ID</Label>
          <Input
            id="related_contact_id"
            name="related_contact_id"
            value={formData.related_contact_id || ""}
            onChange={handleChange}
            placeholder="Enter Contact ID"
          />
        </div>
        <div>
          <Label htmlFor="related_deal_id">Related Deal ID</Label>
          <Input
            id="related_deal_id"
            name="related_deal_id"
            value={formData.related_deal_id || ""}
            onChange={handleChange}
            placeholder="Enter Deal ID"
          />
        </div>
      </div>

      {/* Fields like completed_at, created_at, updated_at, id, created_by_user_id are generally not user-editable */}
      {/* We could display them if initialData is present and it makes sense for context */}
      {initialData?.id && (
        <div className="pt-4 space-y-1 text-xs text-gray-500">
            <p>Task ID: {initialData.id}</p>
            {initialData.created_at && <p>Created: {new Date(initialData.created_at).toLocaleString()}</p>}
            {initialData.updated_at && <p>Last Updated: {new Date(initialData.updated_at).toLocaleString()}</p>}
            {initialData.created_by_user_id && <p>Creator ID: {initialData.created_by_user_id}</p>}
            {initialData.completed_at && <p>Completed: {new Date(initialData.completed_at).toLocaleString()}</p>}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData?.id ? "Save Changes" : "Create Task"}</Button>
      </div>
    </form>
  );
};
