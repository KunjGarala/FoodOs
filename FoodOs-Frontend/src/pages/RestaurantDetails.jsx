import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { restaurantAPI } from '../services/api';
import { setActiveRestaurant } from '../store/authSlice';
import { PageHeader, Panel, Pill, BtnPrimary, BtnGhost } from '../components/ui/kit';
import { cn } from '../utils/cn';
import {
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  Building2,
  Copy,
  History,
  Store,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

const RestaurantDetails = () => {
  const { restaurantUuid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeRestaurantId } = useSelector((state) => state.auth);

  // Track previous active restaurant to detect external changes (like Topbar dropdown)
  const prevActiveRef = useRef(activeRestaurantId);

  const [restaurant, setRestaurant] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync URL -> Global State on mount or when URL changes
  useEffect(() => {
    if (restaurantUuid && activeRestaurantId !== restaurantUuid) {
        dispatch(setActiveRestaurant(restaurantUuid));
    }
  }, [restaurantUuid, dispatch]); // activeRestaurantId removed to prevent loops

  // Sync Global State -> URL (only when Global State changes externally)
  useEffect(() => {
    // If activeRestaurantId changed (user selected from dropdown) AND it's different from current URL
    if (prevActiveRef.current !== activeRestaurantId) {
        if (activeRestaurantId && activeRestaurantId !== restaurantUuid) {
            navigate(`/app/restaurant/${activeRestaurantId}`);
        }
    }
    prevActiveRef.current = activeRestaurantId;
  }, [activeRestaurantId, restaurantUuid, navigate]);


  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        setLoading(true);
        // If restaurantUuid is not in params, check if we can get it from somewhere else
        // essentially satisfying "Route params OR Selected state" requirement
        // For now, relying on Route Params as primary.
        if (!restaurantUuid) {
            throw new Error("No Restaurant UUID provided");
        }

        const response = await restaurantAPI.getRestaurantDetail(restaurantUuid);
        setRestaurant(response.data);
        setError(null);

        // Per-outlet live KPIs (owner-scoped); ignore failures gracefully.
        restaurantAPI.getHierarchySummary(restaurantUuid)
          .then((r) => setSummary(r.data))
          .catch(() => setSummary(null));
      } catch (err) {
        console.error('Failed to fetch restaurant details:', err);
        setError('Failed to load restaurant details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [restaurantUuid]);

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      // Could add a toast notification here
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false; // Or handle as per requirement
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-28 rounded-card bg-paper-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-card bg-paper-3" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-danger/[0.12] p-4 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-danger-deep" />
        </div>
        <h2 className="font-display font-bold text-xl text-ink-text mb-2">Error Loading Details</h2>
        <p className="text-sm text-txt-muted mb-6">{error}</p>
        <BtnPrimary onClick={() => window.location.reload()}>Retry</BtnPrimary>
      </div>
    );
  }

  if (!restaurant) {
     return (
       <div className="flex flex-col items-center justify-center py-20 text-center">
         <div className="bg-paper-3 p-4 rounded-full mb-4">
           <Store className="h-8 w-8 text-txt-faint" />
         </div>
         <h2 className="font-display font-bold text-xl text-ink-text mb-2">Restaurant Not Found</h2>
         <p className="text-sm text-txt-muted mb-6">The requested restaurant details could not be found.</p>
         <BtnGhost onClick={() => navigate(-1)}>Go Back</BtnGhost>
       </div>
     );
  }

  const {
    restaurantUuid: id,
    name,
    businessName,
    ownerName,
    phoneNumber,
    email,
    address,
    city,
    state,
    postalCode,
    gstNumber,
    fssaiLicense,
    panNumber,
    licenseType,
    licenseExpiry,
    licenseKey,
    restaurantType,
    logoUrl,
    isMultiOutlet,
    isActive,
    parentRestaurantUuid,
    childRestaurantUuids,
    createdAt,
    updatedAt
  } = restaurant;

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));

  // Initials for logo fallback
  const initials = (name || businessName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // Outlet cards come from /hierarchy/summary (live sales/covers/tables). We
  // exclude the brand/HQ record itself (shown in the banner) and fall back to
  // the bare child-UUID list if the rollup feed isn't available.
  const rootUuid = parentRestaurantUuid || id;
  const outlets = summary?.outlets
    ? summary.outlets
        .filter((o) => o.restaurantUuid !== rootUuid)
        .map((o) => ({
          uuid: o.restaurantUuid,
          name: o.name,
          city: o.city,
          isActive: o.status ? o.status === 'ACTIVE' : undefined,
          salesToday: o.salesToday,
          covers: o.coversToday,
          tableCount: o.tableCount,
        }))
    : (childRestaurantUuids || []).map((entry) =>
        entry && typeof entry === 'object'
          ? {
              uuid: entry.restaurantUuid || entry.uuid || entry.id,
              name: entry.name,
              city: entry.city,
              isActive: entry.isActive,
            }
          : { uuid: entry });

  const groupSales = summary?.groupSalesToday;
  const groupCovers = summary?.groupCoversToday;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Restaurant Hierarchy"
        title={name}
        subtitle={businessName}
        actions={
          <BtnPrimary onClick={() => navigate('/create-outlet')}>
            <Plus className="h-4 w-4" /> Add Outlet
          </BtnPrimary>
        }
      />

      {/* HQ banner — ink card */}
      <div className="bg-ink text-txt-light rounded-card border border-ink-line p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-tile bg-ink-card border border-ink-line flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="font-display font-bold text-2xl text-marigold">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-white truncate">{name}</h2>
                <Pill tone="marigold">Parent · HQ</Pill>
              </div>
              <p className="text-sm text-txt-mutedDark mt-1 truncate">{businessName}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Pill tone={isActive ? 'success' : 'danger'}>{isActive ? 'Active' : 'Inactive'}</Pill>
                {restaurantType && <Pill tone="neutral">{restaurantType.replace('_', ' ')}</Pill>}
                {isMultiOutlet && <Pill tone="gold">Multi-outlet</Pill>}
              </div>
            </div>
          </div>

          {/* Compliance trio */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 shrink-0">
            <ComplianceItem label="GST" value={gstNumber} ok={!!gstNumber} />
            <ComplianceItem
              label="FSSAI"
              value={fssaiLicense}
              sub={licenseExpiry ? `exp ${new Date(licenseExpiry).getFullYear()}` : null}
              ok={!!fssaiLicense}
            />
            <ComplianceItem
              label="License"
              value={licenseType}
              ok={!!licenseType && !isLicenseExpired(licenseExpiry)}
            />
          </div>
        </div>
      </div>

      {/* Outlets */}
      <div>
        <div className="flex items-end justify-between gap-3 mb-3">
          <p className="eyebrow text-[11px] text-txt-faint">Outlets · {outlets.length}</p>
          {(groupSales != null || groupCovers != null) && (
            <p className="text-xs text-txt-muted">
              <span className="text-txt-faint">Group today</span>{' '}
              <span className="font-mono font-semibold text-ink-text">{formatCurrency(groupSales)}</span>
              {groupCovers != null && (
                <>
                  {' '}·{' '}
                  <span className="font-mono font-semibold text-ink-text">
                    {Number(groupCovers).toLocaleString('en-IN')}
                  </span>{' '}covers
                </>
              )}
            </p>
          )}
        </div>
        {outlets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {outlets.map((outlet) => {
              const isCurrent = outlet.uuid && outlet.uuid === activeRestaurantId;
              const active = outlet.isActive !== false;
              const meta = [outlet.city, outlet.tableCount != null ? `${outlet.tableCount} tables` : null]
                .filter(Boolean)
                .join(' · ');
              return (
                <div
                  key={outlet.uuid}
                  className={cn(
                    'flex flex-col bg-paper-card rounded-card p-4 border-2',
                    isCurrent ? 'border-marigold' : 'border-line-light',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink-text truncate">{outlet.name || 'Outlet'}</p>
                      <p className="text-xs text-txt-muted mt-0.5 truncate">{meta || '—'}</p>
                    </div>
                    {isCurrent && <Pill tone="marigold">Current</Pill>}
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-xs">
                    <span className={cn('h-2 w-2 rounded-full', active ? 'bg-success' : 'bg-txt-faint')} />
                    <span className={active ? 'text-success-deep font-medium' : 'text-txt-muted'}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="font-display font-bold text-2xl text-ink-text mt-2 leading-none">
                    {outlet.salesToday != null ? formatCurrency(outlet.salesToday) : '—'}
                  </p>
                  <p className="text-xs text-txt-muted font-mono mt-1.5">
                    {outlet.covers != null
                      ? `${Number(outlet.covers).toLocaleString('en-IN')} covers today`
                      : 'No covers yet'}
                  </p>

                  <div className="mt-4">
                    {isCurrent ? (
                      <button
                        onClick={() => navigate('/app')}
                        className="w-full h-10 rounded-input bg-ink text-txt-light text-sm font-semibold hover:brightness-110 transition"
                      >
                        Manage
                      </button>
                    ) : (
                      <button
                        onClick={() => outlet.uuid && dispatch(setActiveRestaurant(outlet.uuid))}
                        className="w-full h-10 rounded-input bg-paper-2 border border-line-input text-txt-dark text-sm font-medium hover:bg-paper-3 transition"
                      >
                        Switch to outlet
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add-outlet tile */}
            <button
              type="button"
              onClick={() => navigate('/create-outlet')}
              className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-input bg-paper-2 p-4 text-txt-muted hover:border-marigold hover:text-ink-text transition min-h-[180px]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add Outlet</span>
            </button>
          </div>
        ) : (
          <Panel className="flex flex-col items-center justify-center text-center p-10 border-dashed">
            <div className="bg-paper-3 p-3 rounded-full mb-3">
              <Store className="h-7 w-7 text-txt-faint" />
            </div>
            <p className="font-display font-semibold text-ink-text">No outlets yet</p>
            <p className="text-sm text-txt-muted mt-1 mb-5">Add your first outlet to start building the hierarchy.</p>
            <BtnPrimary onClick={() => navigate('/create-outlet')}>
              <Plus className="h-4 w-4" /> Add Outlet
            </BtnPrimary>
          </Panel>
        )}
      </div>

      {/* Detail panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Information */}
        <Panel className="p-5 md:col-span-2 lg:col-span-1">
          <PanelHeading icon={<Building2 className="h-5 w-5" />} title="Basic Information" />
          <div className="space-y-4 mt-4">
            <Field label="Owner Name" value={ownerName} />
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Phone Number</p>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-txt-faint" />
                <p className="text-sm text-ink-text">{phoneNumber || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Email</p>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-txt-faint" />
                <p className="text-sm text-ink-text break-all">{email || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Restaurant UUID</p>
              <div className="flex items-center justify-between gap-2 mt-1 bg-paper-2 p-2 rounded-input border border-line-light">
                <code className="font-mono text-xs text-txt-muted truncate">{id}</code>
                <button onClick={() => copyToClipboard(id)} className="text-txt-faint hover:text-marigold shrink-0">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </Panel>

        {/* Address */}
        <Panel className="p-5">
          <PanelHeading icon={<MapPin className="h-5 w-5" />} title="Address Details" />
          <div className="space-y-1 mt-4">
            <p className="text-sm text-ink-text leading-relaxed font-medium">
              {address || 'Address not provided'}
            </p>
            {city && state && <p className="text-sm text-txt-muted">{city}, {state}</p>}
            {postalCode && <p className="text-sm text-txt-muted">{postalCode}</p>}
            {!address && !city && !state && !postalCode && (
              <p className="text-sm text-txt-faint italic">No address information available</p>
            )}
          </div>
        </Panel>

        {/* Legal & Compliance */}
        <Panel className="p-5">
          <PanelHeading icon={<ShieldCheck className="h-5 w-5" />} title="Legal & Compliance" />
          <div className="space-y-3 mt-4">
            <ComplianceRow label="GST Number" value={gstNumber} />
            <ComplianceRow label="PAN Number" value={panNumber} />
            <ComplianceRow label="FSSAI License" value={fssaiLicense} last />
          </div>
        </Panel>

        {/* License Information */}
        <Panel className="p-5">
          <PanelHeading icon={<FileText className="h-5 w-5" />} title="License Information" />
          <div className="space-y-4 mt-4">
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">License Type</p>
              <p className="text-base font-display font-semibold text-[#9a6500] mt-0.5">{licenseType || 'N/A'}</p>
            </div>
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">License Key</p>
              <p className="font-mono text-xs bg-paper-2 p-2 rounded-input border border-line-light text-txt-muted mt-1 break-all">
                {licenseKey || 'N/A'}
              </p>
            </div>
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Expiry Date</p>
              <div className="flex items-center gap-2 mt-1">
                {isLicenseExpired(licenseExpiry) ? (
                  <Pill tone="danger"><AlertCircle className="h-3 w-3" /> Expired</Pill>
                ) : (
                  <Pill tone="success"><CheckCircle2 className="h-3 w-3" /> Valid</Pill>
                )}
                <span className="text-sm text-ink-text font-medium">{formatDate(licenseExpiry)}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Franchise & Outlets */}
        <Panel className="p-5">
          <PanelHeading icon={<Store className="h-5 w-5" />} title="Franchise & Outlets" />
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-txt-muted">Multi-Outlet Mode</span>
              <Pill tone={isMultiOutlet ? 'marigold' : 'neutral'}>{isMultiOutlet ? 'Yes' : 'No'}</Pill>
            </div>
            <div>
              <span className="text-xs text-txt-faint">Parent Restaurant</span>
              <div className="mt-1">
                {parentRestaurantUuid ? (
                  <div className="flex items-center justify-between gap-2 bg-paper-2 p-2 rounded-input border border-line-light text-sm">
                    <span className="font-mono text-xs text-txt-muted truncate">{parentRestaurantUuid}</span>
                    <button onClick={() => copyToClipboard(parentRestaurantUuid)} className="text-txt-faint hover:text-marigold shrink-0">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Pill tone="gold">Main Restaurant</Pill>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-txt-faint">Child Outlets</span>
                <Pill tone="neutral">{childRestaurantUuids?.length || 0}</Pill>
              </div>
              {childRestaurantUuids && childRestaurantUuids.length > 0 ? (
                <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                  {outlets.map((o) => (
                    <div key={o.uuid} className="flex items-center justify-between gap-2 bg-paper-2 p-2 rounded-input border border-line-light text-xs">
                      <span className="font-mono truncate text-txt-muted">{o.name || o.uuid}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-paper-2 rounded-input border border-dashed border-line-input text-txt-faint text-sm">
                  No child outlets linked
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* Metadata */}
      <div className="text-xs text-txt-faint flex flex-col md:flex-row gap-4 items-center justify-center pt-4 border-t border-line-light">
        <div className="flex items-center gap-1">
          <History className="h-3 w-3" /> Created: {formatDateTime(createdAt)}
        </div>
        <div className="flex items-center gap-1">
          <History className="h-3 w-3" /> Last Updated: {formatDateTime(updatedAt)}
        </div>
      </div>
    </div>
  );
};

/* ── Small presentational helpers ─────────────────────────────────────── */

const PanelHeading = ({ icon, title }) => (
  <div className="flex items-center gap-2">
    <span className="text-[#9a6500]">{icon}</span>
    <h3 className="font-display font-semibold text-ink-text">{title}</h3>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p className="eyebrow text-[10px] text-txt-faint">{label}</p>
    <p className="text-sm text-ink-text font-medium mt-0.5">{value || 'N/A'}</p>
  </div>
);

const ComplianceRow = ({ label, value, last }) => (
  <div className={cn('flex justify-between items-center', !last && 'border-b border-line-light pb-3')}>
    <span className="text-sm text-txt-muted">{label}</span>
    <span className="text-sm font-medium text-ink-text">{value || 'Not Provided'}</span>
  </div>
);

const ComplianceChip = ({ label, value, ok }) => {
  const present = ok === undefined ? !!value : ok;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
        present ? 'bg-success/[0.16] text-success-bright' : 'bg-ink-card text-txt-mutedDark',
      )}
    >
      {present ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {label}
    </div>
  );
};

const RollupStat = ({ label, value }) => (
  <div>
    <p className="eyebrow text-[10px] text-txt-faint">{label}</p>
    <p className="font-display font-bold text-xl text-ink-text mt-0.5">{value}</p>
  </div>
);

// HQ-banner compliance entry: mono label + value (green when present/valid).
const ComplianceItem = ({ label, value, sub, ok }) => (
  <div className="min-w-[90px]">
    <p className="eyebrow text-[9px] text-txt-faintDark">{label}</p>
    <p className={cn('font-mono text-sm mt-1 flex items-center gap-1', ok ? 'text-success-bright' : 'text-txt-mutedDark')}>
      <span className="truncate">{value || '—'}</span>
      {ok && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
    </p>
    {sub && <p className="font-mono text-[10px] text-txt-faintDark mt-0.5">{sub}</p>}
  </div>
);

export default RestaurantDetails;
