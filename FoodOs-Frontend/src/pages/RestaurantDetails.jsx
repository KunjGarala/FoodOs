import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { restaurantAPI } from '../services/api';
import { setActiveRestaurant } from '../store/authSlice';
import { PageHeader, Panel, Pill, BtnPrimary, BtnGhost } from '../components/ui/kit';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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
  Plus,
  RefreshCw,
  Edit3,
  Save,
  Loader2,
  Upload
} from 'lucide-react';

const RestaurantDetails = () => {
  const { restaurantUuid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeRestaurantId, role } = useSelector((state) => state.auth);
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  // Track previous active restaurant to detect external changes (like Topbar dropdown)
  const prevActiveRef = useRef(activeRestaurantId);

  const [restaurant, setRestaurant] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Outlet State
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    businessName: '',
    phoneNumber: '',
    email: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    gstNumber: '',
    fssaiLicense: '',
    panNumber: '',
    restaurantType: 'FINE_DINING',
  });

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


  const fetchRestaurantDetails = useCallback(async () => {
    try {
      setLoading(true);
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
      const data = err.response?.data;
      let message = 'Failed to load restaurant details. Please try again later.';
      if (data) {
        if (typeof data.message === 'string' && data.message.trim()) {
          message = data.message;
        } else if (typeof data.error === 'string' && data.error.trim()) {
          message = data.error.replace(/_/g, ' ');
        } else if (typeof data === 'string' && data.trim()) {
          message = data;
        }
      } else if (err.code === 'ERR_NETWORK') {
        message = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.code === 'ECONNABORTED') {
        message = 'The request timed out. The server might be busy — please try again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [restaurantUuid]);

  useEffect(() => {
    fetchRestaurantDetails();
  }, [fetchRestaurantDetails]);

  const handleOpenEdit = () => {
    if (!restaurant) return;
    setEditFormData({
      name: restaurant.name || '',
      businessName: restaurant.businessName || '',
      phoneNumber: restaurant.phoneNumber || '',
      email: restaurant.email || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      city: restaurant.city || '',
      state: restaurant.state || '',
      postalCode: restaurant.postalCode || '',
      gstNumber: restaurant.gstNumber || '',
      fssaiLicense: restaurant.fssaiLicense || '',
      panNumber: restaurant.panNumber || '',
      restaurantType: restaurant.restaurantType || 'FINE_DINING',
    });
    setEditImageFile(null);
    setEditImagePreview(restaurant.logoUrl || null);
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveOutlet = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      const targetUuid = restaurantUuid || restaurant?.restaurantUuid;
      if (editImageFile) {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(editFormData)], { type: 'application/json' }));
        formData.append('image', editImageFile);
        await restaurantAPI.updateRestaurant(targetUuid, formData);
      } else {
        await restaurantAPI.updateRestaurant(targetUuid, editFormData);
      }
      setShowEditModal(false);
      fetchRestaurantDetails();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update outlet details';
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const [copied, setCopied] = useState(null);
  const copyToClipboard = (text, id) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
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
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="bg-danger/[0.12] p-5 rounded-full mb-5">
          <AlertCircle className="h-10 w-10 text-danger-deep" />
        </div>
        <h2 className="font-display font-bold text-xl text-ink-text mb-3">Unable to Load Restaurant</h2>
        <p className="text-sm text-txt-muted mb-2 leading-relaxed">{error}</p>
        <p className="text-xs text-txt-faint mb-6">If this issue persists, please contact support or try selecting a different restaurant.</p>
        <div className="flex items-center gap-3">
          <BtnPrimary onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </BtnPrimary>
          <BtnGhost onClick={() => navigate(-1)}>Go Back</BtnGhost>
        </div>
      </div>
    );
  }

  if (!restaurant) {
     return (
       <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
         <div className="bg-paper-3 p-5 rounded-full mb-5">
           <Store className="h-10 w-10 text-txt-faint" />
         </div>
         <h2 className="font-display font-bold text-xl text-ink-text mb-3">Restaurant Not Found</h2>
         <p className="text-sm text-txt-muted mb-6 leading-relaxed">The requested restaurant could not be found. It may have been removed or you may not have access to it.</p>
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Restaurant Hierarchy"
        title={name}
        subtitle={businessName}
        actions={
          <div className="flex items-center gap-2">
            {isOwnerOrAdmin && (
              <Button
                onClick={handleOpenEdit}
                className="bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 h-10 px-4"
              >
                <Edit3 className="h-4 w-4" /> Edit Outlet Details
              </Button>
            )}
            {isOwnerOrAdmin && (
              <BtnPrimary onClick={() => navigate('/create-outlet')}>
                <Plus className="h-4 w-4" /> Add Outlet
              </BtnPrimary>
            )}
          </div>
        }
      />

      {/* HQ banner — modern slate card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-md">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="font-display font-bold text-2xl text-amber-400">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-white truncate">{name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Parent · HQ</span>
              </div>
              <p className="text-sm text-slate-300 mt-1.5 truncate">{businessName}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border tracking-wide shadow-sm',
                  isActive ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' : 'bg-red-500/25 text-red-300 border-red-500/40'
                )}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                {restaurantType && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white border border-slate-600 uppercase tracking-wide shadow-sm">
                    {restaurantType.replace('_', ' ')}
                  </span>
                )}
                {isMultiOutlet && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 tracking-wide shadow-sm">
                    Multi-outlet
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compliance trio */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 shrink-0 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
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

      {/* Outlets (Visible only to OWNER and ADMIN, hidden from MANAGER) */}
      {isOwnerOrAdmin && (
        <div>
          <div className="flex items-end justify-between gap-3 mb-4">
            <p className="eyebrow text-[12px] font-semibold text-txt-muted tracking-wider">OUTLETS · {outlets.length}</p>
            {(groupSales != null || groupCovers != null) && (
              <p className="text-sm text-txt-muted">
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
                      'flex flex-col bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md',
                      isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-slate-900 truncate text-base">{outlet.name || 'Outlet'}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{meta || '—'}</p>
                      </div>
                      {isCurrent && <Pill tone="marigold">Current</Pill>}
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 text-xs">
                      <span className={cn('h-2 w-2 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400')} />
                      <span className={active ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="font-display font-black text-2xl text-slate-900 mt-2.5 leading-none">
                      {outlet.salesToday != null ? formatCurrency(outlet.salesToday) : '—'}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-1.5">
                      {outlet.covers != null
                        ? `${Number(outlet.covers).toLocaleString('en-IN')} covers today`
                        : 'No covers yet'}
                    </p>

                    <div className="mt-4">
                      {isCurrent ? (
                        <button
                          onClick={() => navigate('/app')}
                          className="w-full h-10 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
                        >
                          Manage
                        </button>
                      ) : (
                        <button
                          onClick={() => outlet.uuid && dispatch(setActiveRestaurant(outlet.uuid))}
                          className="w-full h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-200 transition"
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
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:bg-amber-50/30 hover:border-amber-500 text-slate-500 hover:text-amber-700 p-4 transition min-h-[180px]"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-semibold">Add Outlet</span>
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
      )}

      {/* Detail panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Basic Information */}
        <Panel className="p-5 md:col-span-2 lg:col-span-1">
          <PanelHeading icon={<Building2 className="h-5 w-5" />} title="Basic Information" />
          <div className="space-y-4 mt-5">
            <Field label="Owner Name" value={ownerName} />
            <div>
              <p className="eyebrow text-[11px] text-txt-muted font-medium">Phone Number</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Phone className="h-4 w-4 text-txt-faint" />
                <p className="text-sm text-ink-text">{phoneNumber || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="eyebrow text-[11px] text-txt-muted font-medium">Email</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Mail className="h-4 w-4 text-txt-faint" />
                <p className="text-sm text-ink-text break-all">{email || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="eyebrow text-[11px] text-txt-muted font-medium">Restaurant UUID</p>
              <div className="flex items-center justify-between gap-2 mt-1.5 bg-paper-2 p-2.5 rounded-input border border-line-light">
                <code className="font-mono text-xs text-txt-muted break-all">{id}</code>
                <button
                  onClick={() => copyToClipboard(id, 'uuid')}
                  className={cn('shrink-0 transition-colors', copied === 'uuid' ? 'text-success' : 'text-txt-faint hover:text-marigold')}
                  title="Copy UUID"
                >
                  {copied === 'uuid' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </Panel>

        {/* Address */}
        <Panel className="p-5">
          <PanelHeading icon={<MapPin className="h-5 w-5" />} title="Address Details" />
          <div className="space-y-1.5 mt-5">
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
          <div className="space-y-3.5 mt-5">
            <ComplianceRow label="GST Number" value={gstNumber} />
            <ComplianceRow label="PAN Number" value={panNumber} />
            <ComplianceRow label="FSSAI License" value={fssaiLicense} last />
          </div>
        </Panel>

        {/* License Information */}
        <Panel className="p-5">
          <PanelHeading icon={<FileText className="h-5 w-5" />} title="License Information" />
          <div className="space-y-4 mt-5">
            <div>
              <p className="eyebrow text-[11px] text-txt-muted font-medium">License Type</p>
              <p className="text-base font-display font-semibold text-amber-600 mt-1">{licenseType || 'N/A'}</p>
            </div>
            <div>
              <p className="eyebrow text-[11px] text-txt-muted font-medium">License Key</p>
              <p className="font-mono text-xs bg-paper-2 p-2.5 rounded-input border border-line-light text-txt-muted mt-1.5 break-all leading-relaxed">
                {licenseKey || 'N/A'}
              </p>
            </div>
            <div>
              <p className="eyebrow text-[11px] text-txt-muted font-medium">Expiry Date</p>
              <div className="flex items-center gap-2 mt-1.5">
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
          <div className="space-y-4 mt-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-txt-muted">Multi-Outlet Mode</span>
              <Pill tone={isMultiOutlet ? 'marigold' : 'neutral'}>{isMultiOutlet ? 'Yes' : 'No'}</Pill>
            </div>
            <div>
              <span className="text-[11px] text-txt-muted font-medium">Parent Restaurant</span>
              <div className="mt-1.5">
                {parentRestaurantUuid ? (
                  <div className="flex items-center justify-between gap-2 bg-paper-2 p-2.5 rounded-input border border-line-light text-sm">
                    <span className="font-mono text-xs text-txt-muted break-all">{parentRestaurantUuid}</span>
                    <button
                      onClick={() => copyToClipboard(parentRestaurantUuid, 'parent')}
                      className={cn('shrink-0 transition-colors', copied === 'parent' ? 'text-success' : 'text-txt-faint hover:text-marigold')}
                      title="Copy Parent UUID"
                    >
                      {copied === 'parent' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                ) : (
                  <Pill tone="gold">Main Restaurant</Pill>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-txt-muted font-medium">Child Outlets</span>
                <Pill tone="neutral">{childRestaurantUuids?.length || 0}</Pill>
              </div>
              {childRestaurantUuids && childRestaurantUuids.length > 0 ? (
                <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                  {outlets.map((o) => (
                    <div key={o.uuid} className="flex items-center justify-between gap-2 bg-paper-2 p-2.5 rounded-input border border-line-light text-xs">
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
      <div className="text-xs text-txt-muted flex flex-col md:flex-row gap-4 items-center justify-center pt-5 border-t border-line-light">
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" /> Created: {formatDateTime(createdAt)}
        </div>
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" /> Last Updated: {formatDateTime(updatedAt)}
        </div>
      </div>

      {/* Edit Outlet Modal (Owners / Admin only) */}
      {isOwnerOrAdmin && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Outlet Details"
          size="lg"
        >
          <form onSubmit={handleSaveOutlet} className="space-y-4">
            {editError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg text-sm">
                {editError}
              </div>
            )}

            {/* Restaurant Logo / Image Upload */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Restaurant Logo / Image
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-8 w-8 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 hover:bg-amber-500/25 text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{editImagePreview ? 'Change Logo Image' : 'Upload Logo Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {editImageFile && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Selected: {editImageFile.name} ({(editImageFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Recommended: Square PNG or JPG, at least 400x400px.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Outlet Name</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Downtown Branch"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Business Name</label>
                <Input
                  value={editFormData.businessName}
                  onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                  placeholder="e.g. Gourmet Hospitality Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Phone Number</label>
                <Input
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Email</label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="outlet@foodos.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Restaurant Type</label>
                <select
                  value={editFormData.restaurantType}
                  onChange={(e) => setEditFormData({ ...editFormData, restaurantType: e.target.value })}
                  className="flex h-10 w-full rounded-input border border-[#E7DED2] bg-[#FFFDF8] px-3 py-2 text-sm text-[#17202A] focus:outline-none focus:border-[#E85D04]"
                >
                  <option value="FINE_DINING">Fine Dining</option>
                  <option value="CASUAL_DINING">Casual Dining</option>
                  <option value="FAST_FOOD">Fast Food</option>
                  <option value="CAFE">Cafe</option>
                  <option value="BAKERY">Bakery</option>
                  <option value="BAR_PUB">Bar / Pub</option>
                  <option value="BUFFET">Buffet</option>
                  <option value="FOOD_TRUCK">Food Truck</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">GST Number</label>
                <Input
                  value={editFormData.gstNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value })}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">FSSAI License</label>
                <Input
                  value={editFormData.fssaiLicense}
                  onChange={(e) => setEditFormData({ ...editFormData, fssaiLicense: e.target.value })}
                  placeholder="14-digit FSSAI number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">PAN Number</label>
                <Input
                  value={editFormData.panNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value })}
                  placeholder="e.g. ABCDE1234F"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Address</label>
              <Input
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="Street address / locality"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">City</label>
                <Input
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">State</label>
                <Input
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Postal Code</label>
                <Input
                  value={editFormData.postalCode}
                  onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                  placeholder="Postal Code"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Description</label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the outlet"
                className="flex w-full rounded-input border border-[#E7DED2] bg-[#FFFDF8] px-3 py-2 text-sm text-[#17202A] placeholder:text-[#667085] focus:outline-none focus:border-[#E85D04]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2"
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

/* ── Small presentational helpers ─────────────────────────────────────── */

const PanelHeading = ({ icon, title }) => (
  <div className="flex items-center gap-2.5">
    <span className="text-amber-500">{icon}</span>
    <h3 className="font-display font-bold text-slate-900 text-base">{title}</h3>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p className="eyebrow text-[11px] text-slate-500 font-semibold uppercase">{label}</p>
    <p className="text-sm text-slate-900 font-medium mt-1">{value || 'N/A'}</p>
  </div>
);

const ComplianceRow = ({ label, value, last }) => (
  <div className={cn('flex justify-between items-center', !last && 'border-b border-line-light pb-3.5')}>
    <span className="text-sm text-slate-600">{label}</span>
    <span className="text-sm font-semibold text-slate-900 break-all text-right max-w-[55%]">{value || 'Not Provided'}</span>
  </div>
);

const ComplianceChip = ({ label, value, ok }) => {
  const present = ok === undefined ? !!value : ok;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
        present ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400',
      )}
    >
      {present ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {label}
    </div>
  );
};

const RollupStat = ({ label, value }) => (
  <div>
    <p className="eyebrow text-[11px] text-slate-500 font-semibold uppercase">{label}</p>
    <p className="font-display font-bold text-xl text-slate-900 mt-0.5">{value}</p>
  </div>
);

// HQ-banner compliance entry: mono label + value (green when present/valid).
const ComplianceItem = ({ label, value, sub, ok }) => (
  <div className="min-w-[100px]">
    <p className="eyebrow text-[11px] text-slate-400 font-semibold tracking-wider uppercase">{label}</p>
    <p className={cn('font-mono text-[13px] mt-1.5 flex items-center gap-1.5', ok ? 'text-emerald-400 font-bold' : 'text-slate-400')}>
      <span className="break-all">{value || '—'}</span>
      {ok && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
    </p>
    {sub && <p className="font-mono text-[11px] text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default RestaurantDetails;
