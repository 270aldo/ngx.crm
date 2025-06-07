import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define an interface for a single Note
export interface ClientNote {
  id: string | number;
  author: string; // Could be user name or agent ID
  authorInitials?: string; // For avatar fallback
  authorAvatarUrl?: string; // Optional URL for avatar image
  date: string; // ISO string for date/time
  content: string;
}

interface NotesSectionProps {
  notes: ClientNote[];
  contactId: string;
  isLoading?: boolean;
  // onAddNote: (contactId: string, content: string) => Promise<void>; // Future function to add a note
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, contactId, isLoading }) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    console.log(`Adding note for contact ${contactId}: ${newNote}`);
    // await onAddNote(contactId, newNote);
    // For now, just simulate a delay and clear
    await new Promise(resolve => setTimeout(resolve, 1000));
    setNewNote("");
    setIsSubmitting(false);
    // Potentially trigger a refetch of notes here
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Notes</CardTitle>
          <CardDescription className="text-slate-400">Loading notes for this client...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-16 bg-slate-700 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-700 rounded w-1/4 ml-auto animate-pulse"></div> 
          {[...Array(2)].map((_, i) => (
            <div key={i} className="pt-3 border-t border-slate-700">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-100">Notes</CardTitle>
        <CardDescription className="text-slate-400">
          Internal team notes and observations about the client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <Textarea
            placeholder="Add a new note... (Ctrl+Enter to submit)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleAddNote();
              }
            }}
            className="bg-slate-750 border-slate-600 text-slate-200 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
            disabled={isSubmitting}
          />
          <Button onClick={handleAddNote} disabled={!newNote.trim() || isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-slate-50">
            {isSubmitting ? "Adding Note..." : "Add Note"}
          </Button>
        </div>

        {(!notes || notes.length === 0) && !isLoading && (
          <p className="text-slate-500 text-center py-4">No notes recorded for this client yet.</p>
        )}

        {notes && notes.length > 0 && (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li key={note.id} className="flex items-start space-x-3 pb-4 border-b border-slate-700 last:border-b-0">
                <Avatar className="h-9 w-9 mt-1">
                  {note.authorAvatarUrl && <AvatarImage src={note.authorAvatarUrl} alt={note.author} />}
                  <AvatarFallback className="bg-slate-600 text-slate-200 text-xs">
                    {note.authorInitials || note.author?.substring(0, 2).toUpperCase() || "--"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-slate-200">{note.author}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(note.date).toLocaleDateString()} {new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default NotesSection;
