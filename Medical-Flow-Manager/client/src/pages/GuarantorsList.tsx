import { useGuarantors } from "@/hooks/use-guarantors";
import { GuarantorFormDialog } from "@/components/GuarantorFormDialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Loader2, Mail, Phone, MapPin, Building2 } from "lucide-react";

export default function GuarantorsList() {
  const { data: guarantors, isLoading } = useGuarantors();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guarantors</h1>
          <p className="text-muted-foreground mt-1">Manage sponsoring organizations and entities.</p>
        </div>
        <GuarantorFormDialog />
      </div>

      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Financial Requirement</TableHead>
              <TableHead className="text-right">Patients</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : guarantors?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No guarantors added yet.
                </TableCell>
              </TableRow>
            ) : (
              guarantors?.map((guarantor) => (
                <TableRow key={guarantor.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary/50" />
                    {guarantor.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {guarantor.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {guarantor.email}
                        </div>
                      )}
                      {guarantor.contactInfo && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {guarantor.contactInfo}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {/* Display aggregated financials */}
                    <div className="font-medium text-green-600">
                      ${(guarantor as any).totalFinancials?.toLocaleString() || 0}
                    </div>
                    {guarantor.address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" /> {guarantor.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(guarantor as any).patientCount || 0}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
