import ApplicationCard from '../ApplicationCard';

export default function ApplicationCardExample() {
  return (
    <div className="p-6 max-w-md">
      <ApplicationCard
        id="APP-2025-001234"
        institutionName="Indian Institute of Technology, Mumbai"
        applicationType="New Institution Approval"
        status="under_evaluation"
        submittedDate="Jan 15, 2025"
        location="Mumbai, Maharashtra"
        courseName="B.Tech in Computer Science"
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  );
}
