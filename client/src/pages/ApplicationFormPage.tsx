import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

const formSchema = z.object({
  applicationType: z.enum(["new-institution", "intake-increase", "new-course", "eoa", "location-change"]),
  institutionName: z.string().min(1, "Institution name is required"),
  address: z.string().min(1, "Address is required"),
  state: z.string().min(1, "State is required"),
  courseName: z.string().optional(),
  intake: z.number().int().positive().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const applicationTypes = [
  { value: "new-institution", label: "New Institution" },
  { value: "intake-increase", label: "Intake Increase" },
  { value: "new-course", label: "New Course" },
  { value: "eoa", label: "Extension of Approval (EOA)" },
  { value: "location-change", label: "Location Change" },
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry",
];

export default function ApplicationFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionName: "",
      address: "",
      state: "",
      courseName: "",
      description: "",
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await api.createApplication(data);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Application created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/institution/applications"] });
      queryClient.invalidateQueries({ queryKey: ["institution-dashboard"] });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createApplicationMutation.mutate(data);
  };

  const showCourseFields = ["new-course", "intake-increase"].includes(selectedType);

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="application-form-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Application</CardTitle>
          <CardDescription>
            Create a new AICTE approval application. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="applicationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Type *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedType(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-application-type">
                          <SelectValue placeholder="Select application type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {applicationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="institutionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter institution name"
                        {...field}
                        data-testid="input-institution-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter complete address"
                        {...field}
                        data-testid="input-address"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showCourseFields && (
                <>
                  <FormField
                    control={form.control}
                    name="courseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Computer Science & Engineering"
                            {...field}
                            data-testid="input-course-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intake Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 60"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                            data-testid="input-intake"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide any additional details about your application"
                        {...field}
                        data-testid="input-description"
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createApplicationMutation.isPending}
                  data-testid="button-save-application"
                  className="flex-1"
                >
                  {createApplicationMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save as Draft
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
