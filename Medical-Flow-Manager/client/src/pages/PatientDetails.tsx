import { usePatient, useUpdatePatient } from "@/hooks/use-patients";
import { useUploadDocument, useDeleteDocument } from "@/hooks/use-documents";
import { useRoute } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { PatientFormDialog } from "@/components/PatientFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Lock, 
  Unlock,
  Loader2,
  Calendar,
  MapPin,
  Building
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS } from "@shared/schema";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function PatientDetails() {
  const [, params] = useRoute("/patients/:id");
  const id = parseInt(params?.id || "0");
  const { data: patient, isLoading } = usePatient(id);
  const updateMutation = useUpdatePatient();
  const uploadMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth(); // In real app, check role here

  // Simplified Admin check logic - in a real app, check user.role or claims
  // For this demo, we'll assume any logged-in user can edit unless locked
  // But strictly speaking, locked files should only be editable by Admin
  // We'll simulate admin power if user email contains "admin"
  const isAdmin = user?.email?.includes("admin"); 

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold">Patient Not Found</h2>
        <Link href="/patients">
          <Button>Return to List</Button>
        </Link>
      </div>
    );
  }

  const isLocked = patient.isLocked;
  // If locked, disable editing unless admin
  const canEdit = !isLocked || isAdmin;

  const handleStatusChange = (newStatus: string) => {
    // If changing to Paid, warn or automatically lock on backend
    if (newStatus === "Paid" && !isLocked) {
      if (!confirm("Changing status to 'Paid' will LOCK this file. Continue?")) return;
    }
    updateMutation.mutate({ id, status: newStatus });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Error", description: "File size too large (max 5MB)", variant: "destructive" });
        return;
      }
      uploadMutation.mutate({ patientId: id, file });
    }
  };

  const toggleLock = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins can unlock files", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id, isLocked: !isLocked });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{patient.fullName}</h1>
              {isLocked && <Lock className="w-5 h-5 text-orange-500" />}
            </div>
            <p className="text-muted-foreground font-mono mt-1">{patient.passportNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="outline" onClick={toggleLock} className="gap-2">
              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isLocked ? "Unlock File" : "Lock File"}
            </Button>
          )}
          
          <PatientFormDialog 
            patient={patient} 
            trigger={
              <Button disabled={!canEdit} variant="secondary">Edit Details</Button>
            }
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Destination
                  </div>
                  <div className="font-medium">{patient.destination || "Not specified"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="w-3 h-3" /> Guarantor
                  </div>
                  <div className="font-medium text-primary">
                    {patient.guarantor ? patient.guarantor.name : "None assigned"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created
                  </div>
                  <div className="font-medium">
                    {patient.createdAt ? format(new Date(patient.createdAt), "PPP") : "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Current Status</label>
                  <Select 
                    value={patient.status} 
                    onValueChange={handleStatusChange}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-[140px] h-8 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Medical Reports / Notes</h4>
                <div className="bg-muted/30 p-4 rounded-lg text-sm whitespace-pre-wrap min-h-[100px]">
                  {patient.medicalReports || "No medical notes recorded."}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <div className="flex gap-2">
                 <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                />
                <Button 
                  size="sm" 
                  disabled={!canEdit || uploadMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Scan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patient.documents.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/10 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patient.documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="group flex items-start gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors bg-card"
                    >
                      <div className="p-2 bg-primary/10 rounded-md text-primary">
                        {doc.fileType === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm" title={doc.fileName}>
                          {doc.fileName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy") : "Unknown date"}
                        </div>
                      </div>
                      <div className="flex gap-1">
                         <a 
                           href={`/${doc.filePath}`} // Assuming filePath is relative to public or handled by backend static serve
                           target="_blank" 
                           rel="noreferrer"
                           className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted"
                         >
                           <Eye className="w-4 h-4" />
                         </a>
                         {canEdit && (
                           <button 
                             onClick={() => deleteDocMutation.mutate({ id: doc.id, patientId: id })}
                             className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Timeline/Status Flow (Visual) */}
        <div className="space-y-6">
           <Card className="shadow-sm">
             <CardHeader>
               <CardTitle>Case Timeline</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="relative border-l-2 border-muted ml-3 space-y-6 pb-2">
                 {STATUS_OPTIONS.map((status, idx) => {
                   const currentStatusIdx = STATUS_OPTIONS.indexOf(patient.status);
                   const isCompleted = idx <= currentStatusIdx;
                   const isCurrent = idx === currentStatusIdx;

                   return (
                     <div key={status} className="relative pl-6">
                       <div 
                         className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 
                           ${isCompleted ? "bg-primary border-primary" : "bg-background border-muted"}
                           ${isCurrent ? "ring-4 ring-primary/20" : ""}
                         `} 
                       />
                       <div className={`text-sm font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                         {status}
                       </div>
                       {isCurrent && <div className="text-xs text-muted-foreground mt-0.5">Current Stage</div>}
                     </div>
                   );
                 })}
               </div>
               
               {isLocked && (
                 <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800 flex items-start gap-2">
                   <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                   <div>
                     <strong>File Locked</strong>
                     <p className="text-xs mt-1">Modifications restricted to Admins only because the case is closed/paid.</p>
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
