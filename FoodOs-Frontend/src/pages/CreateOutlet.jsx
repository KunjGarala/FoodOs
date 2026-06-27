import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../services/api';
import { updateTokenAndRole } from '../store/authSlice';
import { Input } from '../components/ui/Input';
import { Panel, BtnPrimary, BtnGhost } from '../components/ui/kit';
import { cn } from '../utils/cn';
import {
  Building2,
  MapPin,
  BadgeCheck,
  Upload,
  Store,
  ArrowLeft,
  Calendar,
  Shield,
  Hash,
  Phone,
  Mail,
  MapPinned,
  FileKey,
  Briefcase,
  ChefHat,
  AlertTriangle,
  Check
} from 'lucide-react';

const LICENSE_TYPES = {
    TRIAL: 'Trial (7 days)',
    BASIC: 'Basic (Monthly)',
    STANDARD: 'Standard (Quarterly)',
    PREMIUM: 'Premium (Yearly)',
    ENTERPRISE: 'Enterprise (Lifetime)'
};

const RESTAURANT_TYPES = {
    FINE_DINING: 'Fine Dining',
    QUICK_SERVICE: 'Quick Service',
    CAFE: 'Cafe',
    CLOUD_KITCHEN: 'Cloud Kitchen',
    FOOD_TRUCK: 'Food Truck',
    BAR: 'Bar',
    BAKERY: 'Bakery',
    SWEET_SHOP: 'Sweet Shop'
};

// Shared field styling for the re-skinned form controls.
const fieldClass =
    'bg-paper-2 border border-line-input rounded-input text-txt-dark placeholder:text-txt-faint focus:ring-marigold/40 focus:border-marigold';
const labelClass = 'text-sm font-medium text-txt-dark flex items-center gap-2';
const selectClass =
    'flex h-10 w-full rounded-input border border-line-input bg-paper-2 px-3 py-2 text-sm text-txt-dark focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold transition-colors';

const CreateOutlet = () => {
    const [formData, setFormData] = useState({
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
        licenseKey: '',
        licenseType: 'ENTERPRISE',
        licenseExpiry: '',
        restaurantType: 'BAKERY'
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parentRestaurantId, setParentRestaurantId] = useState(null);
    const [activeStep, setActiveStep] = useState(1);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, restaurantIds } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (restaurantIds && restaurantIds.length > 0) {
            setParentRestaurantId(restaurantIds[0]);
        }
    }, [isAuthenticated, navigate, restaurantIds]);

    useEffect(() => {
        if (image) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(image);
        } else {
            setPreview(null);
        }
    }, [image]);

    // Optimize handleChange with useCallback to prevent unnecessary re-renders
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const handleFileChange = useCallback((e) => {
        e.stopPropagation();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (activeStep !== 4) {
            return;
        }

        setLoading(true);
        setError(null);

        if (!parentRestaurantId) {
            setError('Parent restaurant ID not found');
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('data', new Blob([JSON.stringify(formData)], {
                type: 'application/json'
            }));

            if (image) {
                data.append('image', image);
            }

            const response = await restaurantAPI.createOutlet(parentRestaurantId, data);

            // Extract tokens from response
            const token = response.headers['authorization']?.replace('Bearer ', '');
            if (token) {
                dispatch(updateTokenAndRole(token));
            }

            // Check if refresh token is provided in headers
            const refreshToken = response.headers['refresh-token'];
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            navigate('/app');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create outlet');
        } finally {
            setLoading(false);
        }
    };

    // Memoize steps to prevent re-renders
    const steps = useMemo(() => [
        { id: 1, name: 'Basic Info', icon: Store },
        { id: 2, name: 'Location', icon: MapPinned },
        { id: 3, name: 'Legal & License', icon: Shield },
        { id: 4, name: 'Branding', icon: BadgeCheck },
    ], []);

    const SectionHeader = useCallback(({ icon, title, subtitle }) => {
        const Icon = icon;
        return (
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-marigold/15 rounded-tile">
                        <Icon className="h-5 w-5 text-marigold" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-ink-text">{title}</h3>
                </div>
                {subtitle && <p className="text-sm text-txt-muted ml-11">{subtitle}</p>}
            </div>
        );
    }, []);

    // Optimized FormStep component
    const FormStep = useCallback(({ children, step }) => (
        <div className={`${activeStep === step ? 'block' : 'hidden'}`}>
            {children}
        </div>
    ), [activeStep]);

    return (
        <div className="min-h-screen bg-paper py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-txt-muted hover:text-ink-text mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                    {/* ── Step rail (ink) ─────────────────────────────── */}
                    <aside className="bg-ink text-txt-light rounded-card p-6 lg:sticky lg:top-8 lg:self-start">
                        <p className="eyebrow text-[11px] text-marigold mb-1">Onboarding</p>
                        <h2 className="font-display text-xl font-bold text-white mb-1">Create Outlet</h2>
                        <p className="text-sm text-txt-mutedDark mb-6">
                            Add a new outlet under your business.
                        </p>

                        {parentRestaurantId && (
                            <div className="mb-6 rounded-tile border border-ink-line bg-ink-card p-3">
                                <p className="eyebrow text-[10px] text-txt-faintDark mb-1">Parent Restaurant</p>
                                <p className="font-mono text-sm text-marigold-soft break-all">{parentRestaurantId}</p>
                            </div>
                        )}

                        {/* Vertical stepper (desktop) / horizontal (mobile) */}
                        <ol className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible">
                            {steps.map((step) => {
                                const active = activeStep === step.id;
                                const done = activeStep > step.id;
                                return (
                                    <li key={step.id} className="shrink-0 lg:shrink">
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep(step.id)}
                                            className={cn(
                                                'flex items-center gap-3 w-full rounded-tile px-3 py-2.5 text-left transition-colors',
                                                active
                                                    ? 'bg-marigold/15'
                                                    : 'hover:bg-ink-card'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                    active
                                                        ? 'bg-marigold text-ink'
                                                        : done
                                                            ? 'bg-success/20 text-success-bright'
                                                            : 'bg-ink-card text-txt-faintDark'
                                                )}
                                            >
                                                {done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block eyebrow text-[10px] text-txt-faintDark">
                                                    Step {step.id}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'block text-sm font-medium truncate',
                                                        active ? 'text-white' : 'text-txt-mutedDark'
                                                    )}
                                                >
                                                    {step.name}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </aside>

                    {/* ── Form column ─────────────────────────────────── */}
                    <div className="min-w-0">
                        {error && (
                            <div className="mb-6 p-4 bg-danger/[0.08] border border-danger/30 rounded-card flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-danger-deep mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-danger-deep">Error creating outlet</p>
                                    <p className="text-sm text-danger-deep/90 mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        <Panel className="overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 sm:p-8">
                                    {/* Step 1: Basic Information */}
                                    <FormStep step={1}>
                                        <SectionHeader
                                            icon={Store}
                                            title="Basic Information"
                                            subtitle="Enter the fundamental details about your new outlet"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className={labelClass}>
                                                        <Store className="h-4 w-4" />
                                                        Restaurant Name
                                                    </label>
                                                    <Input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="e.g. Tasty Bites - Downtown"
                                                        className={fieldClass}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>
                                                        <Briefcase className="h-4 w-4" />
                                                        Business Name
                                                    </label>
                                                    <Input
                                                        name="businessName"
                                                        value={formData.businessName}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="e.g. Tasty Bites Pvt Ltd"
                                                        className={fieldClass}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>
                                                        <Phone className="h-4 w-4" />
                                                        Phone Number
                                                    </label>
                                                    <Input
                                                        name="phoneNumber"
                                                        type="tel"
                                                        value={formData.phoneNumber}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="+91 9876543210"
                                                        className={fieldClass}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>
                                                        <Mail className="h-4 w-4" />
                                                        Email Address
                                                    </label>
                                                    <Input
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="outlet@restaurant.com"
                                                        className={fieldClass}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className={labelClass}>
                                                        <ChefHat className="h-4 w-4" />
                                                        Restaurant Type
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            name="restaurantType"
                                                            value={formData.restaurantType}
                                                            onChange={handleChange}
                                                            className={cn(selectClass, 'pl-10')}
                                                        >
                                                            {Object.entries(RESTAURANT_TYPES).map(([key, label]) => (
                                                                <option key={key} value={key}>{label}</option>
                                                            ))}
                                                        </select>
                                                        <ChefHat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-txt-faint" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-txt-dark">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        rows="6"
                                                        value={formData.description}
                                                        onChange={handleChange}
                                                        className="w-full rounded-input border border-line-input bg-paper-2 px-4 py-3 text-sm text-txt-dark placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold transition-colors"
                                                        placeholder="Tell us about this outlet, special features, cuisine type, etc..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </FormStep>

                                    {/* Step 2: Address Details */}
                                    <FormStep step={2}>
                                        <SectionHeader
                                            icon={MapPinned}
                                            title="Address Details"
                                            subtitle="Where is your new outlet located?"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-1 md:col-span-2 space-y-2">
                                                <label className={labelClass}>
                                                    <MapPin className="h-4 w-4" />
                                                    Street Address
                                                </label>
                                                <Input
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="123 Main St, Building Name"
                                                    className={fieldClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-txt-dark">City</label>
                                                <Input
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="e.g. Mumbai"
                                                    className={fieldClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-txt-dark">State</label>
                                                <Input
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="e.g. Maharashtra"
                                                    className={fieldClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-txt-dark">Postal Code</label>
                                                <Input
                                                    name="postalCode"
                                                    value={formData.postalCode}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="400001"
                                                    className={fieldClass}
                                                />
                                            </div>
                                        </div>
                                    </FormStep>

                                    {/* Step 3: Legal & License */}
                                    <FormStep step={3}>
                                        <SectionHeader
                                            icon={Shield}
                                            title="Legal & License Information"
                                            subtitle="Provide necessary legal documents and license details"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className={labelClass}>
                                                    <Hash className="h-4 w-4" />
                                                    GST Number
                                                </label>
                                                <Input
                                                    name="gstNumber"
                                                    value={formData.gstNumber}
                                                    onChange={handleChange}
                                                    placeholder="27AAAAA0000A1Z5"
                                                    className={fieldClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-txt-dark">FSSAI License</label>
                                                <Input
                                                    name="fssaiLicense"
                                                    value={formData.fssaiLicense}
                                                    onChange={handleChange}
                                                    placeholder="FSSAI license number"
                                                    className={fieldClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-txt-dark">PAN Number</label>
                                                <Input
                                                    name="panNumber"
                                                    value={formData.panNumber}
                                                    onChange={handleChange}
                                                    placeholder="ABCDE1234F"
                                                    className={fieldClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClass}>
                                                    <FileKey className="h-4 w-4" />
                                                    License Key
                                                </label>
                                                <Input
                                                    name="licenseKey"
                                                    value={formData.licenseKey}
                                                    onChange={handleChange}
                                                    placeholder="Enter license key if available"
                                                    className={fieldClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-txt-dark">License Type</label>
                                                <select
                                                    name="licenseType"
                                                    value={formData.licenseType}
                                                    onChange={handleChange}
                                                    className={selectClass}
                                                >
                                                    {Object.entries(LICENSE_TYPES).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClass}>
                                                    <Calendar className="h-4 w-4" />
                                                    License Expiry
                                                </label>
                                                <Input
                                                    name="licenseExpiry"
                                                    type="date"
                                                    value={formData.licenseExpiry}
                                                    onChange={handleChange}
                                                    className={fieldClass}
                                                />
                                            </div>
                                        </div>
                                    </FormStep>

                                    {/* Step 4: Branding */}
                                    <FormStep step={4}>
                                        <SectionHeader
                                            icon={BadgeCheck}
                                            title="Branding & Image"
                                            subtitle="Upload your outlet's logo or image"
                                        />
                                        <div className="space-y-6">
                                            <div className="flex flex-col sm:flex-row items-start gap-8">
                                                <div className="space-y-4 flex-1">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-txt-dark">
                                                            Upload Restaurant Image
                                                        </label>
                                                        <div className="relative border-2 border-dashed border-line-input rounded-tile p-8 text-center hover:border-marigold transition-colors bg-paper-2">
                                                            <div className="max-w-xs mx-auto">
                                                                <Upload className="h-12 w-12 text-txt-faint mx-auto mb-4" />
                                                                <p className="text-sm text-txt-muted mb-2">
                                                                    <span className="font-medium text-marigold">Click to upload</span> or drag and drop
                                                                </p>
                                                                <p className="text-xs text-txt-faint">
                                                                    PNG, JPG, GIF up to 5MB
                                                                </p>
                                                            </div>
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                    {image && (
                                                        <div className="text-sm text-success-deep flex items-center gap-2">
                                                            <BadgeCheck className="h-4 w-4" />
                                                            {image.name} ({Math.round(image.size / 1024)} KB)
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-txt-dark">
                                                        Image Preview
                                                    </label>
                                                    <div className="w-64 h-64 border border-line-light rounded-tile overflow-hidden bg-paper-2 flex items-center justify-center">
                                                        {preview ? (
                                                            <img
                                                                src={preview}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="text-center p-4">
                                                                <Building2 className="h-16 w-16 text-txt-faint mx-auto mb-2" />
                                                                <p className="text-sm text-txt-faint">No image selected</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </FormStep>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="px-6 sm:px-8 py-5 bg-paper-2 border-t border-line-light flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        {activeStep > 1 && (
                                            <BtnGhost
                                                type="button"
                                                onClick={() => setActiveStep(activeStep - 1)}
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                Previous
                                            </BtnGhost>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-txt-muted">
                                            Step {activeStep} of {steps.length}
                                        </span>
                                        {activeStep < steps.length ? (
                                            <BtnPrimary
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setActiveStep(activeStep + 1);
                                                }}
                                            >
                                                Continue
                                                <ArrowLeft className="h-4 w-4 rotate-180" />
                                            </BtnPrimary>
                                        ) : (
                                            <BtnPrimary
                                                type="submit"
                                                className="min-w-[180px]"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="h-4 w-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                                                        Creating Outlet...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BadgeCheck className="h-4 w-4" />
                                                        Create Outlet
                                                    </>
                                                )}
                                            </BtnPrimary>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </Panel>

                        {/* Information Box */}
                        <div className="mt-6 p-5 bg-paper-card border border-line-light rounded-card">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-marigold/15 rounded-tile">
                                    <Store className="h-5 w-5 text-marigold" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-ink-text mb-1">About Outlet Creation</h4>
                                    <p className="text-sm text-txt-muted">
                                        This outlet will be created under your parent restaurant <strong className="font-semibold text-ink-text">{parentRestaurantId}</strong>.
                                        All settings, menu items, and configurations can be managed independently for each outlet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateOutlet;
