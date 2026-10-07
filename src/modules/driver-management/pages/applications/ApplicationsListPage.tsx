import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApplications, useApplicationStats, useDeleteApplication } from "../../hooks"
import { PageWrapper } from "@/app/layouts/PageWrapper"
import { PageHeader } from "@/shared/components/PageHeader"
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable"
import { StatusBadge } from "@/shared/components/StatusBadge"
import { InfoCard, InfoCardGrid } from "@/shared/components/InfoCard"
import { Button } from "@/shared/components/ui/Button"
import { ConfirmationModal } from "@/shared/components/ConfirmationModal"
import { useToast } from "@/shared/context/toast"
import { ClipboardList, ShieldCheck, ShieldAlert, Plus, Trash2, Eye, Edit, AlertOctagon, Clock, UserCheck } from "lucide-react"
import { ApplicationSourceBadge, ActionDropdown } from "../../components"
import type { DriverApplicationEntity } from "../../types"

export const ApplicationsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { error: showError } = useToast()

  const { data, isLoading, isError, refetch } = useApplications()
  const { data: statsData, isLoading: isStatsLoading } = useApplicationStats()
  const { mutate: deleteApp, isPending: isDeleting } = useDeleteApplication()

  const columns: DataTableColumn<DriverApplicationEntity>[] = [
    {
      key: "applicationId",
      label: "Application ID",
      sortable: true,
      align: "left",
      render: (value) => (
        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{value}</span>
      ),
    },
    {
      key: "driverName",
      label: "Driver Name",
      sortable: true,
      align: "left",
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-[10px] text-muted-foreground">{row.mobileNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: "vehicleType",
      label: "Vehicle Category",
      sortable: true,
      render: (value) => (
        <span className="capitalize font-semibold text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded dark:bg-slate-800 dark:text-slate-400">
          {value}
        </span>
      ),
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (value) => <ApplicationSourceBadge source={value} />,
    },
    {
      key: "submittedAt",
      label: "Submission Date",
      sortable: true,
      render: (value) => (
        <span className="text-xs text-muted-foreground">
          {new Date(value).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "applicationStatus",
      label: "Review Status",
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (_, row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <ActionDropdown
            actions={[
              {
                label: "Review Details",
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => navigate(`/driver-management/applications/${row.id}`),
              },
              {
                label: "Edit Application",
                icon: <Edit className="h-3.5 w-3.5" />,
                onClick: () => navigate(`/driver-management/applications/${row.id}/edit`),
              },
              {
                label: "Delete Record",
                icon: <Trash2 className="h-3.5 w-3.5 text-rose-500" />,
                onClick: () => setDeleteId(row.id),
                variant: "danger",
              },
            ]}
          />
        </div>
      ),
    },
  ]

  const activeData = data?.data ?? []

  // Server authoritative funnel metrics (fallback to active page only if stats pending)
  const totalApps = statsData?.total ?? activeData.length
  const pendingReview = statsData?.pendingReview ?? activeData.filter((v) => v.applicationStatus === "pending_review").length
  const underReview = statsData?.underReview ?? activeData.filter((v) => v.applicationStatus === "under_review").length
  const approved = statsData?.approved ?? activeData.filter((v) => v.applicationStatus === "approved").length
  const rejected = statsData?.rejected ?? activeData.filter((v) => v.applicationStatus === "rejected").length

  const recentRejections = statsData?.recentRejections ?? []

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteApp(deleteId, {
        onSuccess: () => {
          setDeleteId(null)
          refetch()
        },
        onError: (err: unknown) => {
          setDeleteId(null)
          showError(
            "Delete unavailable",
            err instanceof Error ? err.message : "Could not delete this application",
          )
        },
      })
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Driver Applications"
        description="Verify driver partner applications, KYC compliance files, and transport permits."
        actions={
          <Button
            variant="primary"
            className="gap-2 text-xs font-semibold h-9 rounded-lg"
            onClick={() => navigate("/driver-management/applications/new")}
          >
            <Plus className="h-4 w-4" />
            <span>Manual Registration</span>
          </Button>
        }
      />

      <div className="space-y-6">
        <InfoCardGrid cols={5}>
          <InfoCard
            label="Total Applications"
            value={totalApps}
            icon={<ClipboardList className="w-5 h-5" />}
            variant="blue"
            subtitle="Database aggregate"
            loading={isLoading || isStatsLoading}
          />
          <InfoCard
            label="Pending Review"
            value={pendingReview}
            icon={<ShieldAlert className="w-5 h-5" />}
            variant="blue"
            subtitle="Awaiting initial audit"
            loading={isLoading || isStatsLoading}
          />
          <InfoCard
            label="Under Review"
            value={underReview}
            icon={<ShieldAlert className="w-5 h-5" />}
            variant="blue"
            subtitle="In document verification"
            loading={isLoading || isStatsLoading}
          />
          <InfoCard
            label="Approved"
            value={approved}
            icon={<ShieldCheck className="w-5 h-5" />}
            variant="blue"
            subtitle="Ready for onboarding"
            loading={isLoading || isStatsLoading}
          />
          <InfoCard
            label="Rejected"
            value={rejected}
            icon={<ShieldAlert className="w-5 h-5" />}
            variant="red"
            subtitle="Needs attention"
            loading={isLoading || isStatsLoading}
          />
        </InfoCardGrid>

        {recentRejections.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Recent Application Rejections (Authoritative Audit Log)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentRejections.slice(0, 6).map((rej) => (
                <div
                  key={rej.driverId}
                  className="rounded-lg bg-white p-3 shadow-xs border border-rose-100 dark:bg-slate-900 dark:border-rose-950"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {rej.driverName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {rej.driverCode}
                    </span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mb-2">
                    Reason: {rej.reason || "Documents failed verification standards"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {rej.reviewerName || "Reviewer"}
                    </span>
                    {rej.timestamp && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(rej.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DataTable
          data={activeData}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by Driver name, Mobile or Application ID..."
          onRowClick={(row) => navigate(`/driver-management/applications/${row.id}`)}
        />
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Registration Record"
        description="Are you absolutely sure you want to purge this driver registration log? This operation is permanent."
        confirmText="Purge Record"
        variant="danger"
        loading={isDeleting}
      />
    </PageWrapper>
  )
}

export default ApplicationsListPage
