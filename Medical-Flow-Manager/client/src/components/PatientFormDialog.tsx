import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePatient, useUpdatePatient } from "@/hooks/use-patients";
import { useGuarantors } from "@/hooks/use-guarantors";
import { insertPatientSchema, type Patient } from "@shared/schema";
import { Plus, Loader2 } from "lucide-react";

// Add validation schema
const formSchema = insertPatientSchema.extend({
  guarantorId: z.coerce.number().optional(), // Coerce select string to number
});

interface PatientFormDialogProps {
  patient?: Patient;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PatientFormDialog({ patient, trigger, open, onOpenChange }: PatientFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const { data: guarantors } = useGuarantors();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();

  const isEditing = !!patient;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: patient?.fullName || "",
      passportNumber: patient?.passportNumber || "",
      medicalReports: patient?.medicalReports || "",
      destination: patient?.destination || "",
      guarantorId: patient?.guarantorId || undefined,
      status: patient?.status || "New",
    },
  });

  // Reset form when dialog opens/closes or patient changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        fullName: patient?.fullName || "",
        passportNumber: patient?.passportNumber || "",
        medicalReports: patient?.medicalReports || "",
        destination: patient?.destination || "",
        guarantorId: patient?.guarantorId || undefined,
        status: patient?.status || "New",
      });
    }
  }, [isOpen, patient, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditing && patient) {
        await updateMutation.mutateAsync({ id: patient.id, ...values });
      } else {
        await createMutation.mutateAsync(values as any);
      }
      setIsOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by hook
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !isControlled && (
        <DialogTrigger asChild>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Patient" : "Add New Patient"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Number</FormLabel>
                    <FormControl>
                      <Input placeholder="A12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="Germany, Turkey..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="guarantorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor (Sponsor)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select guarantor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {guarantors?.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalReports"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of condition..." 
                      className="resize-none"
                      {...field}
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="btn-primary">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Patient"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
