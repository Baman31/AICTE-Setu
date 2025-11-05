import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);

  const { data: sessionData } = useQuery<any>({
    queryKey: ["/api/auth/session"],
  });

  const userRole = sessionData?.user?.role;

  const { data: applicationsData, isLoading: applicationsLoading } = useQuery<any>({
    queryKey: userRole === "institution" 
      ? ["/api/institution/applications"]
      : userRole === "admin"
      ? ["/api/admin/applications"]
      : ["/api/evaluator/applications"],
    enabled: !!userRole,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedApplication],
    enabled: !!selectedApplication,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { applicationId: string; content: string }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedApplication] });
      setNewMessage("");
    },
  });

  const handleSendMessage = () => {
    if (!selectedApplication || !newMessage.trim()) return;
    sendMessageMutation.mutate({
      applicationId: selectedApplication,
      content: newMessage,
    });
  };

  if (applicationsLoading || !userRole) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const apps = userRole === "admin" 
    ? (applicationsData?.applications || [])
    : (applicationsData || []);
  const msgs = messages || [];

  return (
    <div className="h-full" data-testid="messages-page">
      <div className="mb-6">
        <h1 className="text-4xl font-medium tracking-tight mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with evaluators and administrators
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-2 p-4">
                {apps.map((app: any) => (
                  <Button
                    key={app.id}
                    variant={selectedApplication === app.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedApplication(app.id)}
                    data-testid={`button-application-${app.id}`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{app.applicationNumber}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {app.institutionName}
                      </div>
                    </div>
                  </Button>
                ))}
                {apps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No applications yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedApplication ? "Conversation" : "Select an application"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedApplication ? (
              <div className="flex items-center justify-center h-[calc(100vh-24rem)] text-muted-foreground">
                Select an application to view messages
              </div>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="h-[calc(100vh-28rem)] pr-4">
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="text-center text-muted-foreground">Loading messages...</div>
                    ) : msgs.length === 0 ? (
                      <div className="text-center text-muted-foreground">No messages yet</div>
                    ) : (
                      msgs.map((msg) => (
                        <div key={msg.id} className="flex gap-3" data-testid={`message-${msg.id}`}>
                          <Avatar>
                            <AvatarFallback>
                              {msg.senderName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {msg.senderName || "User"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
