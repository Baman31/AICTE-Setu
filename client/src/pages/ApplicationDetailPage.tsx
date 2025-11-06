import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import TimelineView from "@/components/TimelineView";
import MessagingPanel from "@/components/MessagingPanel";
import { ArrowLeft, Download, FileText, Upload, Trash2, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const documentCategories = [
  "Academic Records",
  "Infrastructure Documents",
  "Faculty Details",
  "Financial Documents",
  "Affiliation Certificate",
  "Land Documents",
  "Other",
];

export default function ApplicationDetailPage() {
  const [, params] = useRoute("/application/:id");
  const [, setLocation] = useLocation();
  const applicationId = params?.id || "";
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    category: "",
    fileName: "",
    file: null as File | null,
  });
  const [reviewData, setReviewData] = useState({
    score: "",
    recommendation: "",
    comments: "",
    siteVisitNotes: "",
  });
  const { toast } = useToast();
  const userRole = localStorage.getItem("userRole");

  const { data: applicationData, isLoading } = useQuery({
    queryKey: ["/api/applications", applicationId],
    queryFn: () => api.getApplication(applicationId),
    enabled: !!applicationId,
  });

  const { data: assignmentData } = useQuery({
    queryKey: ["/api/evaluator/assignment", applicationData?.application?.id],
    queryFn: async () => {
      const response = await fetch(`/api/evaluator/assignment/${applicationData?.application?.id}`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!applicationData?.application?.id && userRole === "evaluator",
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { category: string; fileName: string; fileSize: string; fileUrl: string }) => {
      if (!applicationData?.application?.id) throw new Error("Application ID not found");
      return await api.uploadDocument(applicationData.application.id, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId] });
      setUploadDialogOpen(false);
      setUploadData({ category: "", fileName: "", file: null });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return await api.deleteDocument(documentId);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleUploadDocument = () => {
    if (!uploadData.category || !uploadData.file) {
      toast({
        title: "Error",
        description: "Please select a category and file",
        variant: "destructive",
      });
      return;
    }

    const fileSizeKB = (uploadData.file.size / 1024).toFixed(2);
    const fileSize = uploadData.file.size < 1024 * 1024 
      ? `${fileSizeKB} KB` 
      : `${(uploadData.file.size / (1024 * 1024)).toFixed(2)} MB`;

    uploadDocumentMutation.mutate({
      category: uploadData.category,
      fileName: uploadData.file.name,
      fileSize: fileSize,
      fileUrl: `https://storage.example.com/documents/${uploadData.file.name}`,
    });
  };

  const submitReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.submitEvaluation(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId] });
      setReviewData({ score: "", recommendation: "", comments: "", siteVisitNotes: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!reviewData.score || !reviewData.recommendation) {
      toast({
        title: "Error",
        description: "Score and recommendation are required",
        variant: "destructive",
      });
      return;
    }

    if (userRole === "evaluator" && !assignmentData?.assignment?.id) {
      toast({
        title: "Error",
        description: "No assignment found for this application. Please contact admin.",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate({
      assignmentId: assignmentData?.assignment?.id || "admin-review",
      applicationId: applicationData?.application?.id,
      score: parseInt(reviewData.score),
      recommendation: reviewData.recommendation,
      comments: reviewData.comments || undefined,
      siteVisitNotes: reviewData.siteVisitNotes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!applicationData?.application) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl font-medium mb-2">Application not found</p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const application = applicationData.application;
  const documents = applicationData.documents || [];
  const messages = applicationData.messages || [];
  const timelineStages = applicationData.timeline || [];

  // Format timeline stages for the TimelineView component
  const formattedTimeline = timelineStages.map((stage: any) => ({
    id: stage.id,
    title: stage.title,
    description: stage.description,
    date: stage.completedAt ? new Date(stage.completedAt).toLocaleDateString() : undefined,
    assignedTo: stage.assignedTo,
    status: stage.status
  }));

  // Format messages for MessagingPanel
  const formattedMessages = messages.map((msg: any) => ({
    id: msg.id,
    sender: msg.senderName,
    senderRole: msg.senderRole,
    content: msg.content,
    timestamp: new Date(msg.createdAt).toLocaleString(),
    isCurrentUser: false
  }));

  return (
    <div className="space-y-6" data-testid="application-detail-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-medium tracking-tight mb-2">{application.institutionName}</h1>
          <p className="text-muted-foreground">Application ID: {application.id}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Application Type</p>
              <p className="font-medium">{application.applicationType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Course Name</p>
              <p className="font-medium">{application.courseName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Proposed Intake</p>
              <p className="font-medium">{application.intake} students</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <p className="font-medium">{application.location}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Submitted Date</p>
              <p className="font-medium">{application.submittedDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              <StatusBadge status={application.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className={`grid w-full ${userRole === "evaluator" || userRole === "admin" ? "grid-cols-4" : "grid-cols-3"}`}>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
          {(userRole === "evaluator" || userRole === "admin") && (
            <TabsTrigger value="review" data-testid="tab-review">Review</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineView stages={formattedTimeline} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Uploaded Documents</CardTitle>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-upload-document">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Upload a new document for your application
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category">Document Category *</Label>
                      <Select
                        value={uploadData.category}
                        onValueChange={(value) => setUploadData({ ...uploadData, category: value })}
                      >
                        <SelectTrigger id="category" data-testid="select-document-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="file">Select File *</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setUploadData({ 
                            ...uploadData, 
                            file,
                            fileName: file?.name || ""
                          });
                        }}
                        data-testid="input-file"
                      />
                      {uploadData.file && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Selected: {uploadData.file.name} ({(uploadData.file.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Note: File metadata is captured. In production, the file would be uploaded to cloud storage.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUploadDocument}
                        disabled={uploadDocumentMutation.isPending}
                        data-testid="button-confirm-upload"
                      >
                        {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setUploadDialogOpen(false)}
                        data-testid="button-cancel-upload"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.category} • {doc.fileSize} • {doc.status || 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-download-${doc.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                          disabled={deleteDocumentMutation.isPending}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card className="h-[600px] flex flex-col">
            <MessagingPanel applicationId={application.id} messages={formattedMessages} />
          </Card>
        </TabsContent>

        {(userRole === "evaluator" || userRole === "admin") && (
          <TabsContent value="review" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="score">Score (0-100) *</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g., 85"
                        value={reviewData.score}
                        onChange={(e) => setReviewData({ ...reviewData, score: e.target.value })}
                        data-testid="input-review-score"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recommendation">Recommendation *</Label>
                      <Select
                        value={reviewData.recommendation}
                        onValueChange={(value) => setReviewData({ ...reviewData, recommendation: value })}
                      >
                        <SelectTrigger id="recommendation" data-testid="select-recommendation">
                          <SelectValue placeholder="Select recommendation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Approve">Approve</SelectItem>
                          <SelectItem value="Reject">Reject</SelectItem>
                          <SelectItem value="Conditional Approval">Conditional Approval</SelectItem>
                          <SelectItem value="Site Visit Required">Site Visit Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      placeholder="Provide detailed comments on your evaluation..."
                      value={reviewData.comments}
                      onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                      rows={5}
                      data-testid="input-review-comments"
                    />
                  </div>

                  <div>
                    <Label htmlFor="siteVisitNotes">Site Visit Notes (Optional)</Label>
                    <Textarea
                      id="siteVisitNotes"
                      placeholder="Notes from site visit..."
                      value={reviewData.siteVisitNotes}
                      onChange={(e) => setReviewData({ ...reviewData, siteVisitNotes: e.target.value })}
                      rows={3}
                      data-testid="input-site-visit-notes"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending}
                    data-testid="button-submit-review"
                    className="w-full md:w-auto"
                  >
                    {submitReviewMutation.isPending ? (
                      "Submitting..."
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Evaluation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
