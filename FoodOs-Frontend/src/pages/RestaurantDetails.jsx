import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { restaurantAPI } from '../services/api';
import { setActiveRestaurant } from '../store/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  Copy, 
  History,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const RestaurantDetails = () => {
  const { restaurantUuid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeRestaurantId } = useSelector((state) => state.auth);
  
  // Track previous active restaurant to detect external changes (like Topbar dropdown)
  const prevActiveRef = useRef(activeRestaurantId);

  const [restaurant, setRestaurant] = useState(null);
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
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse flex items-center space-x-4 mb-8">
            <div className="rounded-full bg-slate-200 h-20 w-20"></div>
            <div className="flex-1 space-y-4 py-1">
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Details</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!restaurant) {
     return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Store className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Restaurant Not Found</h2>
          <p className="text-slate-500 mb-6">The requested restaurant details could not be found.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1️⃣ Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                    <img src={logoUrl} alt={name} className="h-full w-full object-cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.parentNode.classList.add('bg-slate-50'); e.target.style.display = 'none'; }}
                    />
                ) : (
                    <Store className="h-10 w-10 text-slate-400" />
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                <p className="text-slate-500 font-medium">{businessName}</p>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant={isActive ? 'success' : 'danger'}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{restaurantType.replace('_', ' ')}</Badge>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            {/* Action buttons could go here */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 2️⃣ Basic Information Card */}
        <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle>Basic Information</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Owner Name</label>
                        <p className="text-slate-900 font-medium">{ownerName || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <p className="text-slate-900">{phoneNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                         <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <p className="text-slate-900 break-all">{email || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Restaurant UUID</label>
                        <div className="flex items-center justify-between gap-2 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                            <code className="text-xs text-slate-600 truncate">{id}</code>
                            <button onClick={() => copyToClipboard(id)} className="text-slate-400 hover:text-blue-600">
                                <Copy className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 3️⃣ Address Card */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <CardTitle>Address Details</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    <p className="text-slate-900 leading-relaxed font-medium">
                        {address || 'Address not provided'}
                    </p>
                    {city && state && (
                        <p className="text-slate-600">
                            {city}, {state}
                        </p>
                    )}
                    {postalCode && (
                        <p className="text-slate-600">{postalCode}</p>
                    )}
                    {!address && !city && !state && !postalCode && (
                        <p className="text-slate-400 italic">No address information available</p>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* 4️⃣ Legal & Compliance Card */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <CardTitle>Legal & Compliance</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">GST Number</span>
                    <span className="font-medium text-slate-900">{gstNumber || 'Not Provided'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">PAN Number</span>
                    <span className="font-medium text-slate-900">{panNumber || 'Not Provided'}</span>
                </div>
                <div className="flex justify-between pt-1">
                    <span className="text-slate-500 text-sm">FSSAI License</span>
                    <span className="font-medium text-slate-900">{fssaiLicense || 'Not Provided'}</span>
                </div>
            </CardContent>
        </Card>

        {/* 5️⃣ License Details Card */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <CardTitle>License Information</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                     <label className="text-xs font-semibold text-slate-500 uppercase">License Type</label>
                     <p className="text-lg font-medium text-blue-700">{licenseType}</p>
                </div>
                <div>
                     <label className="text-xs font-semibold text-slate-500 uppercase">License Key</label>
                     <p className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 mt-1 break-all">
                        {licenseKey || 'N/A'}
                     </p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Expiry Date</label>
                    <div className="flex items-center gap-2 mt-1">
                        {isLicenseExpired(licenseExpiry) ? (
                            <Badge variant="danger" className="gap-1 pl-1">
                                <AlertCircle className="h-3 w-3" /> Expired
                            </Badge>
                        ) : (
                             <Badge variant="success" className="gap-1 pl-1">
                                <CheckCircle2 className="h-3 w-3" /> Valid
                            </Badge>
                        )}
                        <span className="text-slate-900 font-medium">
                            {formatDate(licenseExpiry)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 6️⃣ Franchise / Outlet Information Card */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-600" />
                    <CardTitle>Franchise & Outlets</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Multi-Outlet Mode</span>
                    <Badge variant={isMultiOutlet ? 'primary' : 'default'}>
                        {isMultiOutlet ? 'Yes' : 'No'}
                    </Badge>
                </div>
                
                <div>
                    <span className="text-sm text-slate-500">Parent Restaurant</span>
                    <div className="mt-1">
                        {parentRestaurantUuid ? (
                             <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                                <span className="truncate">{parentRestaurantUuid}</span>
                                <button onClick={() => copyToClipboard(parentRestaurantUuid)} className="text-slate-400 hover:text-blue-600">
                                    <Copy className="h-3 w-3" />
                                </button>
                             </div>
                        ) : (
                             <Badge variant="outline">Main Restaurant</Badge>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-sm text-slate-500">Child Outlets</span>
                         <Badge variant="default" className="text-xs">
                            {childRestaurantUuids?.length || 0}
                         </Badge>
                    </div>
                    {childRestaurantUuids && childRestaurantUuids.length > 0 ? (
                        <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                           {childRestaurantUuids.map(uuid => (
                                <div key={uuid} className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                    <span className="truncate text-slate-600">{uuid}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-slate-50 rounded border border-slate-100 border-dashed text-slate-400 text-sm">
                            No child outlets linked
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
        
      {/* 7️⃣ Metadata Section */}
      <div className="text-xs text-slate-400 flex flex-col md:flex-row gap-4 items-center justify-center pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1">
            <History className="h-3 w-3" />
            Created: {formatDateTime(createdAt)}
        </div>
        <div className="flex items-center gap-1">
            <History className="h-3 w-3" />
            Last Updated: {formatDateTime(updatedAt)}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
