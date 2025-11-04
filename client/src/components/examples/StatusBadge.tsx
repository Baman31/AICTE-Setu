import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-3">
        <StatusBadge status="draft" />
        <StatusBadge status="submitted" />
        <StatusBadge status="in_scrutiny" />
        <StatusBadge status="document_verification" />
        <StatusBadge status="evaluator_assigned" />
        <StatusBadge status="under_evaluation" />
        <StatusBadge status="approved" />
        <StatusBadge status="rejected" />
        <StatusBadge status="conditional" />
      </div>
    </div>
  );
}
