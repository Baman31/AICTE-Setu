import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import StatusBadge from "@/components/StatusBadge";
import { Users, Calendar } from "lucide-react";

export default function AdminApplicationsPage() {
  const { toast } = useToast();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [assignData, setAssignData] = useState({
    evaluatorId: "",
    priority: "medium",
    deadline: "",
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/admin/applications"],
    queryFn: () => api.getAllApplications(),
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const evaluators = users?.filter((u: any) => u.role === "evaluator") || [];

  const assignEvaluatorMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.assignEvaluator(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Evaluator assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      setAssignDialogOpen(false);
      setAssignData({ evaluatorId: "", priority: "medium", deadline: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign evaluator",
        variant: "destructive",
      });
    },
  });

  const handleAssignEvaluator = () => {
    if (!assignData.evaluatorId || !selectedApplication) {
      toast({
        title: "Error",
        description: "Please select an evaluator",
        variant: "destructive",
      });
      return;
    }

    assignEvaluatorMutation.mutate({
      applicationId: selectedApplication.id,
      evaluatorId: assignData.evaluatorId,
      priority: assignData.priority,
      deadline: assignData.deadline || undefined,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-applications-page">
      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Manage Applications</h1>
        <p className="text-muted-foreground">
          View and assign evaluators to applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {applications?.map((app: any) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`application-${app.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{app.institutionName}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Application ID: {app.applicationNumber}</p>
                    <p>Type: {app.applicationType} • State: {app.state}</p>
                  </div>
                </div>
                <Dialog open={assignDialogOpen && selectedApplication?.id === app.id} onOpenChange={(open) => {
                  setAssignDialogOpen(open);
                  if (open) setSelectedApplication(app);
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid={`button-assign-evaluator-${app.id}`}>
                      <Users className="w-4 h-4 mr-2" />
                      Assign Evaluator
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Evaluator</DialogTitle>
                      <DialogDescription>
                        Assign an evaluator to review application {app.applicationNumber}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="evaluator">Evaluator *</Label>
                        <Select
                          value={assignData.evaluatorId}
                          onValueChange={(value) => setAssignData({ ...assignData, evaluatorId: value })}
                        >
                          <SelectTrigger id="evaluator" data-testid="select-evaluator">
                            <SelectValue placeholder="Select evaluator" />
                          </SelectTrigger>
                          <SelectContent>
                            {evaluators.map((evaluator: any) => (
                              <SelectItem key={evaluator.id} value={evaluator.id}>
                                {evaluator.name} ({evaluator.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={assignData.priority}
                          onValueChange={(value) => setAssignData({ ...assignData, priority: value })}
                        >
                          <SelectTrigger id="priority" data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input
                          id="deadline"
                          type="datetime-local"
                          value={assignData.deadline}
                          onChange={(e) => setAssignData({ ...assignData, deadline: e.target.value })}
                          data-testid="input-deadline"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAssignEvaluator}
                          disabled={assignEvaluatorMutation.isPending}
                          data-testid="button-confirm-assign"
                        >
                          {assignEvaluatorMutation.isPending ? "Assigning..." : "Assign"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setAssignDialogOpen(false)}
                          data-testid="button-cancel-assign"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
