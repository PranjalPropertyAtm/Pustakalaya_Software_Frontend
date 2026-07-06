import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/features/enquiries/EnquiryForm";
import { useAuthStore } from "@/stores/authStore";

export default function EnquiryCreatePage() {
  const navigate = useNavigate();
  const counsellorName = useAuthStore((s) => s.user?.fullName ?? "Counsellor");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/enquiries">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title="New Enquiry"
        description={`Record a walk-in or prospective student enquiry. Assigned counsellor: ${counsellorName}`}
      />
      <SectionCard title="Enquiry details">
        <EnquiryForm
          submitLabel="Create enquiry"
          onSuccess={() => navigate("/enquiries")}
        />
      </SectionCard>
    </div>
  );
}
