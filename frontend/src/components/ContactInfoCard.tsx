import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactProfile } from "../pages/ClientProfilePage"; // Adjusted path

interface ContactInfoCardProps {
  contact: ContactProfile | null;
}

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ contact }) => {
  if (!contact) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-100">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Contact data not available.</p>
        </CardContent>
      </Card>
    );
  }

  const programBadgeVariant = 
    contact.program?.toUpperCase() === "PRIME" ? "default" : 
    contact.program?.toUpperCase() === "LONGEVITY" ? "secondary" 
    : "outline";
  
  const badgeColorClass = 
    contact.program?.toUpperCase() === "PRIME" ? "bg-blue-600 hover:bg-blue-700 text-slate-50" : 
    contact.program?.toUpperCase() === "LONGEVITY" ? "bg-green-600 hover:bg-green-700 text-slate-50" 
    : "border-slate-500 text-slate-300";

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center pb-2">
        <CardTitle className="text-2xl font-semibold text-slate-50">{contact.name || "N/A"}</CardTitle>
        {contact.program && (
          <Badge variant={programBadgeVariant} className={`px-3 py-1 text-sm ${badgeColorClass}`}>
            {contact.program.toUpperCase()}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-slate-300">
          <div>
            <p className="text-xs text-slate-400">Email</p>
            <p className="font-medium truncate" title={contact.email || undefined}>{contact.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Phone</p>
            <p className="font-medium">{contact.phone || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfoCard;
