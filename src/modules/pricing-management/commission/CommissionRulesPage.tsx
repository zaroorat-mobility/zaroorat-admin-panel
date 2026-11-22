import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { useCommissionConfigs, useFareRules } from '../hooks'

/// Authoritative Driver Commission view (Rev 5 Phase 5).
/// Central commission rules live in `commission_configurations` (managed via the
/// Commission & Taxation Governance console) and take precedence over legacy per-fare-rule rates.
export const CommissionRulesPage: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('active')
  const centralConfigs = useCommissionConfigs()
  const rules = useFareRules({ page: 1, limit: 100, status })

  const activeCentral = (centralConfigs.data ?? []).filter((c) => c.status === 'ACTIVE')

  return (
    <PageWrapper className="space-y-5 pt-1 pb-6 px-3 sm:px-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1F2B6D] dark:text-white">Driver Commission</h1>
          <p className="text-xs text-muted-foreground">
            Central commission configurations govern Commission-model drivers with deterministic
            scope precedence (Zone+Vehicle &gt; Zone &gt; City+Vehicle &gt; City &gt; Global).
            Changes apply strictly to new rides only; grandfathered subscriptions remain exempt until expiry.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/pricing-management/gst')}
          className="px-3.5 py-2 text-xs font-bold text-white bg-[#1F2B6D] rounded-lg hover:bg-[#172156] cursor-pointer shrink-0"
        >
          Manage Central Commission &amp; GST
        </button>
      </div>

      {/* Central Rev 5 Commission Configurations */}
      <div className="border border-border rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Central Commission Configurations ({activeCentral.length} active)
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Maker-checker approved rules stored in PostgreSQL (`commission_configurations`).
            </p>
          </div>
        </div>
        {centralConfigs.isLoading ? (
          <p className="p-4 text-xs text-muted-foreground">Loading central commission rules…</p>
        ) : centralConfigs.error ? (
          <p role="alert" className="p-4 text-xs text-rose-600">
            Could not load central commission rules: {(centralConfigs.error as Error).message}
          </p>
        ) : (centralConfigs.data ?? []).length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            No central commission configurations created yet. Use &ldquo;Manage Central Commission &amp; GST&rdquo; to add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left text-slate-500">
                <tr>
                  <th className="p-2.5">Rate</th>
                  <th className="p-2.5">Base Rule</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Scopes</th>
                  <th className="p-2.5">Apply To</th>
                  <th className="p-2.5">Version</th>
                </tr>
              </thead>
              <tbody>
                {(centralConfigs.data ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-2.5 font-bold text-[#1F2B6D] dark:text-white">
                      {c.isEnabled ? `${c.commissionRatePct}%` : 'Disabled (0%)'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">{c.baseRule}</td>
                    <td className="p-2.5">{c.status}</td>
                    <td className="p-2.5 text-[11px]">
                      {c.scopes
                        .map(
                          (s) =>
                            `${s.scopeLevel}${s.cityCode ? `:${s.cityCode}` : ''}${s.vehicleTypeId ? `:${s.vehicleTypeId.slice(0, 8)}` : ''} (${s.isEnforced && !s.closedAt ? 'active' : 'closed'})`,
                        )
                        .join(', ')}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">{c.applyTo}</td>
                    <td className="p-2.5">v{c.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legacy Fare-Rule Commission Reference */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Legacy Per-Fare-Rule Commission Overrides (Read Reference)
          </h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="text-xs border border-border rounded-lg p-1.5 bg-white dark:bg-slate-900"
          >
            <option value="active">Active fare rules</option>
            <option value="inactive">Inactive fare rules</option>
            <option value="all">All fare rules</option>
          </select>
        </div>

        {rules.isLoading && <p className="text-xs text-muted-foreground">Loading fare rules…</p>}
        {rules.error && (
          <p role="alert" className="text-xs text-rose-600">
            Could not load fare rules: {(rules.error as Error).message}
          </p>
        )}
        {rules.data && rules.data.data.length === 0 && (
          <p className="text-xs text-muted-foreground">No fare rules match.</p>
        )}

        {rules.data && rules.data.data.length > 0 && (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left text-slate-500">
                <tr>
                  <th className="p-2">City</th>
                  <th className="p-2">Zone</th>
                  <th className="p-2">Vehicle type</th>
                  <th className="p-2">Service</th>
                  <th className="p-2 text-right">Rule Commission</th>
                  <th className="p-2">Effective</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Version</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {rules.data.data.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-2">{r.cityCode}</td>
                    <td className="p-2">{r.serviceZoneName ?? 'Citywide'}</td>
                    <td className="p-2">
                      {r.vehicleTypeName ?? r.vehicleType}
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {r.vehicleType}
                      </div>
                    </td>
                    <td className="p-2">{r.serviceType ?? 'All'}</td>
                    <td className="p-2 text-right font-bold">
                      {r.commissionRatePct != null ? (
                        `${r.commissionRatePct}%`
                      ) : (
                        <span className="font-normal text-muted-foreground">
                          Governed centrally
                        </span>
                      )}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {r.effectiveFrom} → {r.effectiveTo ?? '∞'}
                    </td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">v{r.version}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-primary underline cursor-pointer"
                        onClick={() => navigate(`/pricing-management/fare-rules/${r.id}/edit`)}
                      >
                        Edit rule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rules.data && rules.data.meta && rules.data.meta.totalCount > rules.data.data.length && (
          <p className="text-[11px] text-muted-foreground">
            Showing the first {rules.data.data.length} of {rules.data.meta.totalCount} rules.
          </p>
        )}
      </div>
    </PageWrapper>
  )
}

export default CommissionRulesPage
