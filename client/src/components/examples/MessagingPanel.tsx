import MessagingPanel from '../MessagingPanel';

export default function MessagingPanelExample() {
  const messages = [
    {
      id: "1",
      sender: "Dr. Rajesh Kumar",
      senderRole: "Evaluator",
      content: "I have reviewed the infrastructure documents. Could you please provide additional photos of the laboratory equipment?",
      timestamp: "Jan 18, 2025, 10:30 AM",
      isCurrentUser: false
    },
    {
      id: "2",
      sender: "Current User",
      senderRole: "Institution",
      content: "Thank you for the feedback. I will upload the additional laboratory photos by end of day today.",
      timestamp: "Jan 18, 2025, 11:15 AM",
      isCurrentUser: true
    },
    {
      id: "3",
      sender: "AICTE Admin",
      senderRole: "Administrator",
      content: "Please ensure all documents are submitted by Jan 20, 2025 to avoid delays in processing.",
      timestamp: "Jan 18, 2025, 2:45 PM",
      isCurrentUser: false
    }
  ];

  return (
    <div className="h-[600px] max-w-3xl border rounded-lg">
      <MessagingPanel
        applicationId="APP-2025-001234"
        messages={messages}
      />
    </div>
  );
}
