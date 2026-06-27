import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../services/api';
import { updateTokenAndRole } from '../store/authSlice';
import { Panel, Segmented, BtnPrimary, BtnGhost } from '../components/ui/kit';
import { cn } from '../utils/cn';
import logoUrl from '../assets/foodos-logo.svg';
import {
  Building2,
  MapPin,
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
  BadgeCheck,
  AlertTriangle,
  Users,
  UtensilsCrossed,
  ListOrdered,
} from 'lucide-react';

const LICENSE_TYPES = {
    TRIAL: 'Trial (7 days free)',
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

// Onboarding journey rail (frame 23) — step 1 "Restaurant" is active.
const ONBOARDING_STEPS = [
    { id: 1, name: 'Restaurant', desc: 'Your main restaurant', icon: Store },
    { id: 2, name: 'Outlet', desc: 'Add your first outlet', icon: MapPinned },
    { id: 3, name: 'Team', desc: 'Invite staff & roles', icon: Users },
    { id: 4, name: 'Menu', desc: 'Build your menu', icon: UtensilsCrossed },
];

// Shared field primitives in the redesign styling.
const fieldInput =
    'h-10 w-full rounded-input border border-line-input bg-paper-2 px-3 text-sm text-txt-dark placeholder:text-txt-faint focus:outline-none focus:border-marigold focus:ring-1 focus:ring-marigold transition-colors';

const FieldLabel = ({ icon, children }) => {
    const Icon = icon;
    return (
        <label className="flex items-center gap-2 text-sm font-medium text-txt-dark">
            {Icon && <Icon className="h-4 w-4 text-txt-muted" />}
            {children}
        </label>
    );
};

// Move FormStep and SectionHeader outside the component to prevent re-creation
const FormStep = ({ children, step, activeStep }) => (
    <div className={`${activeStep === step ? 'block' : 'hidden'}`}>
        {children}
    </div>
);

const SectionHeader = ({ icon, title, subtitle }) => {
    const Icon = icon;
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-marigold/15 rounded-tile">
                    <Icon className="h-5 w-5 text-marigold" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink-text">{title}</h3>
            </div>
            {subtitle && <p className="text-sm text-txt-muted ml-11">{subtitle}</p>}
        </div>
    );
};

const CreateRestaurant = () => {
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
    const [activeStep, setActiveStep] = useState(1);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

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
        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('data', new Blob([JSON.stringify(formData)], {
                type: 'application/json'
            }));

            if (image) {
                data.append('image', image);
            }

            const response = await restaurantAPI.createFirstRestaurant(data);

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
            setError(err.response?.data?.message || err.message || 'Failed to create restaurant');
        } finally {
            setLoading(false);
        }
    };

    // Memoize the form's internal wizard steps to prevent re-renders
    const steps = useMemo(() => [
        { id: 1, name: 'Basic Info', icon: Store },
        { id: 2, name: 'Location', icon: MapPinned },
        { id: 3, name: 'Legal & License', icon: Shield },
        { id: 4, name: 'Branding', icon: BadgeCheck },
    ], []);

    const restaurantTypeOptions = useMemo(
        () => Object.entries(RESTAURANT_TYPES).map(([value, label]) => ({ value, label })),
        []
    );

    const renderBasicInfoStep = () => (
        <FormStep step={1} activeStep={activeStep}>
            <SectionHeader
                icon={Store}
                title="Basic Information"
                subtitle="Enter the fundamental details about your main restaurant"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <FieldLabel icon={Store}>Restaurant Name *</FieldLabel>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Tasty Bites Main Branch"
                            className={fieldInput}
                        />
                    </div>
                    <div className="space-y-2">
                        <FieldLabel icon={Briefcase}>Business Name *</FieldLabel>
                        <input
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Tasty Bites Pvt Ltd"
                            className={fieldInput}
                        />
                    </div>
                    <div className="space-y-2">
                        <FieldLabel icon={Phone}>Phone Number *</FieldLabel>
                        <input
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            placeholder="+91 9876543210"
                            className={fieldInput}
                        />
                    </div>
                    <div className="space-y-2">
                        <FieldLabel icon={Mail}>Email Address *</FieldLabel>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="contact@restaurant.com"
                            className={fieldInput}
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <FieldLabel icon={ChefHat}>Restaurant Type</FieldLabel>
                        <Segmented
                            options={restaurantTypeOptions}
                            value={formData.restaurantType}
                            onChange={(value) =>
                                handleChange({ target: { name: 'restaurantType', value } })
                            }
                            className="flex flex-wrap"
                        />
                    </div>
                    <div className="space-y-2">
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                            name="description"
                            rows="7"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full rounded-input border border-line-input bg-paper-2 px-4 py-3 text-sm text-txt-dark placeholder:text-txt-faint focus:outline-none focus:border-marigold focus:ring-1 focus:ring-marigold transition-colors"
                            placeholder="Describe your restaurant, cuisine, specialties, and what makes it unique..."
                        />
                    </div>
                </div>
            </div>
        </FormStep>
    );

    const renderAddressStep = () => (
        <FormStep step={2} activeStep={activeStep}>
            <SectionHeader
                icon={MapPinned}
                title="Address Details"
                subtitle="Where is your main restaurant located?"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <FieldLabel icon={MapPin}>Street Address *</FieldLabel>
                    <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="123 Main St, Building Name"
                        className={fieldInput}
                    />
                </div>
                <div className="space-y-2">
                    <FieldLabel>City *</FieldLabel>
                    <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Mumbai"
                        className={fieldInput}
                    />
                </div>
                <div className="space-y-2">
                    <FieldLabel>State *</FieldLabel>
                    <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Maharashtra"
                        className={fieldInput}
                    />
                </div>
                <div className="space-y-2">
                    <FieldLabel>Postal Code *</FieldLabel>
                    <input
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        placeholder="400001"
                        className={fieldInput}
                    />
                </div>
            </div>
        </FormStep>
    );

    const renderLegalLicenseStep = () => (
        <FormStep step={3} activeStep={activeStep}>
            <SectionHeader
                icon={Shield}
                title="Legal & License Information"
                subtitle="Provide necessary legal documents and license details"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <FieldLabel icon={Hash}>GST Number</FieldLabel>
                    <input
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="27AAAAA0000A1Z5"
                        className={fieldInput}
                    />
                </div>
                <div className="space-y-2">
                    <FieldLabel>FSSAI License</FieldLabel>
                    <input
                        name="fssaiLicense"
                        value={formData.fssaiLicense}
                        onChange={handleChange}
                        placeholder="FSSAI license number"
                        className={fieldInput}
                    />
                </div>
                <div className="space-y-2">
                    <FieldLabel>PAN Number</FieldLabel>
                    <input
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        className={fieldInput}
                    />
                </div>
                <div className="space-y-2">
                    <FieldLabel icon={FileKey}>License Key</FieldLabel>
                    <input
                        name="licenseKey"
                        value={formData.licenseKey}
                        onChange={handleChange}
                        placeholder="Enter license key if available"
                        className={fieldInput}
                    />
                </div>
                <div className="space-y-2">
                    <FieldLabel>License Type</FieldLabel>
                    <select
                        name="licenseType"
                        value={formData.licenseType}
                        onChange={handleChange}
                        className={fieldInput}
                    >
                        {Object.entries(LICENSE_TYPES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <FieldLabel icon={Calendar}>License Expiry</FieldLabel>
                    <input
                        name="licenseExpiry"
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={handleChange}
                        className={fieldInput}
                    />
                </div>
            </div>
        </FormStep>
    );

    const renderBrandingStep = () => (
        <FormStep step={4} activeStep={activeStep}>
            <SectionHeader
                icon={BadgeCheck}
                title="Branding & Image"
                subtitle="Upload your restaurant's logo or main image"
            />
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                    <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <FieldLabel>Upload Restaurant Image</FieldLabel>
                            <label
                                htmlFor="restaurant-image"
                                className="block border-2 border-dashed border-line-input rounded-tile p-8 text-center hover:border-marigold hover:bg-marigold/5 transition-colors bg-paper-2 cursor-pointer group"
                            >
                                <div className="max-w-xs mx-auto">
                                    <Upload className="h-12 w-12 text-txt-faint mx-auto mb-4 group-hover:text-marigold transition-colors" />
                                    <p className="text-sm text-txt-muted mb-2">
                                        <span className="font-semibold text-marigold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-txt-faint">
                                        PNG, JPG, GIF up to 5MB
                                    </p>
                                </div>
                            </label>
                            <input
                                id="restaurant-image"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                        {image && (
                            <div className="text-sm text-success-deep flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4" />
                                {image.name} ({Math.round(image.size / 1024)} KB)
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <FieldLabel>Image Preview</FieldLabel>
                        <div className="w-64 h-64 border border-line-light rounded-tile overflow-hidden bg-paper-2 flex items-center justify-center">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <Building2 className="h-16 w-16 text-gold mx-auto mb-2" />
                                    <p className="text-sm text-txt-muted">No image selected</p>
                                    <p className="text-xs text-txt-faint mt-1">Recommended: 500×500px</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FormStep>
    );

    return (
        <div className="min-h-screen bg-paper">
            <div className="flex flex-col lg:flex-row min-h-screen">
                {/* ── Left step rail (ink) — onboarding journey, frame 23 ── */}
                <aside className="lg:w-[300px] lg:shrink-0 bg-ink text-txt-light">
                    {/* Desktop vertical rail */}
                    <div className="hidden lg:flex flex-col h-full p-8 sticky top-0">
                        <div className="flex items-center gap-2 mb-12">
                            <img src={logoUrl} alt="FoodOS" className="h-8 w-auto" />
                        </div>
                        <p className="eyebrow text-[11px] text-txt-faintDark mb-1">Onboarding</p>
                        <h2 className="font-display font-bold text-xl text-white mb-10">
                            Let&apos;s set up your business
                        </h2>
                        <ol className="space-y-2 flex-1">
                            {ONBOARDING_STEPS.map((step) => {
                                const active = step.id === 1;
                                return (
                                    <li
                                        key={step.id}
                                        className={cn(
                                            'flex items-start gap-3 rounded-tile p-3 transition-colors',
                                            active ? 'bg-marigold/10' : ''
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold font-mono',
                                                active
                                                    ? 'bg-marigold text-ink'
                                                    : 'bg-ink-card text-txt-mutedDark'
                                            )}
                                        >
                                            {step.id}
                                        </div>
                                        <div className="min-w-0">
                                            <p
                                                className={cn(
                                                    'text-sm font-semibold',
                                                    active ? 'text-white' : 'text-txt-mutedDark'
                                                )}
                                            >
                                                {step.name}
                                            </p>
                                            <p
                                                className={cn(
                                                    'text-xs',
                                                    active ? 'text-txt-mutedDark' : 'text-txt-faintDark'
                                                )}
                                            >
                                                {step.desc}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                        <button
                            onClick={() => navigate('/app')}
                            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-txt-mutedDark hover:text-txt-light transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to app
                        </button>
                    </div>

                    {/* Mobile horizontal stepper */}
                    <div className="lg:hidden px-4 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <img src={logoUrl} alt="FoodOS" className="h-6 w-auto" />
                            <button
                                onClick={() => navigate('/app')}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-txt-mutedDark hover:text-txt-light"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back
                            </button>
                        </div>
                        <div className="flex items-center">
                            {ONBOARDING_STEPS.map((step, index) => {
                                const active = step.id === 1;
                                return (
                                    <React.Fragment key={step.id}>
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold font-mono',
                                                    active
                                                        ? 'bg-marigold text-ink'
                                                        : 'bg-ink-card text-txt-mutedDark'
                                                )}
                                            >
                                                {step.id}
                                            </div>
                                            <span
                                                className={cn(
                                                    'mt-1 text-[10px] font-medium',
                                                    active ? 'text-white' : 'text-txt-faintDark'
                                                )}
                                            >
                                                {step.name}
                                            </span>
                                        </div>
                                        {index < ONBOARDING_STEPS.length - 1 && (
                                            <div className="flex-1 h-0.5 mx-1 bg-ink-line" />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* ── Right form column ── */}
                <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
                    <div className="max-w-4xl mx-auto">
                        <header className="mb-8">
                            <p className="eyebrow text-[11px] text-txt-faint mb-1">Step 1 · Restaurant</p>
                            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-[-0.01em] text-ink-text">
                                Create your main restaurant
                            </h1>
                            <p className="mt-1.5 text-sm text-txt-muted">
                                This is your primary restaurant — it manages all outlets, settings, and reporting.
                            </p>
                        </header>

                        {/* Inner wizard progress */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between relative">
                                {steps.map((step, index) => (
                                    <React.Fragment key={step.id}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep(step.id)}
                                            className="flex flex-col items-center relative z-10"
                                        >
                                            <div className={cn(
                                                'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center mb-1 sm:mb-2 border transition-colors',
                                                activeStep === step.id
                                                    ? 'bg-marigold text-ink border-marigold'
                                                    : activeStep > step.id
                                                        ? 'bg-marigold/15 text-marigold border-marigold/40'
                                                        : 'bg-paper-card text-txt-faint border-line-input'
                                            )}>
                                                <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            <span className={cn(
                                                'text-xs sm:text-sm font-medium hidden sm:block',
                                                activeStep >= step.id ? 'text-ink-text' : 'text-txt-faint'
                                            )}>
                                                {step.name}
                                            </span>
                                            <span className={cn(
                                                'text-[10px] font-medium sm:hidden',
                                                activeStep >= step.id ? 'text-ink-text' : 'text-txt-faint'
                                            )}>
                                                {step.id}
                                            </span>
                                        </button>
                                        {index < steps.length - 1 && (
                                            <div className={cn(
                                                'flex-1 h-0.5 mx-1 sm:mx-2',
                                                activeStep > step.id ? 'bg-marigold' : 'bg-line-light'
                                            )} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-danger/[0.08] border border-danger/30 rounded-card flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-danger-deep">Error creating restaurant</p>
                                    <p className="text-sm text-danger-deep/90 mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        <Panel className="overflow-hidden shadow-card">
                            <form onSubmit={handleSubmit}>
                                <div className="p-4 sm:p-8">
                                    {renderBasicInfoStep()}
                                    {renderAddressStep()}
                                    {renderLegalLicenseStep()}
                                    {renderBrandingStep()}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="px-4 sm:px-8 py-4 sm:py-6 bg-paper-2 border-t border-line-light flex justify-between items-center gap-3">
                                    <div>
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
                                                Next Step
                                                <ArrowLeft className="h-4 w-4 rotate-180" />
                                            </BtnPrimary>
                                        ) : (
                                            <BtnPrimary
                                                type="submit"
                                                className="min-w-[200px]"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="h-4 w-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BadgeCheck className="h-4 w-4" />
                                                        Create Main Restaurant
                                                    </>
                                                )}
                                            </BtnPrimary>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </Panel>

                        {/* Benefits Section */}
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Panel className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-marigold/15 rounded-tile">
                                        <Building2 className="h-5 w-5 text-marigold" />
                                    </div>
                                    <h4 className="font-semibold text-ink-text">Central Control</h4>
                                </div>
                                <p className="text-sm text-txt-muted">
                                    This main restaurant manages all outlets, settings, and configurations from one central dashboard.
                                </p>
                            </Panel>

                            <Panel className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-marigold/15 rounded-tile">
                                        <Users className="h-5 w-5 text-marigold" />
                                    </div>
                                    <h4 className="font-semibold text-ink-text">Multi-Outlet Ready</h4>
                                </div>
                                <p className="text-sm text-txt-muted">
                                    After creating this main restaurant, you can add unlimited outlets under it with independent management.
                                </p>
                            </Panel>

                            <Panel className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-marigold/15 rounded-tile">
                                        <ListOrdered className="h-5 w-5 text-marigold" />
                                    </div>
                                    <h4 className="font-semibold text-ink-text">Unified Reporting</h4>
                                </div>
                                <p className="text-sm text-txt-muted">
                                    Get consolidated reports and analytics for all outlets combined in one place for better decision making.
                                </p>
                            </Panel>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateRestaurant;
