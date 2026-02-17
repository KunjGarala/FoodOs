import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../services/api';
import { updateTokenAndRole } from '../store/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { 
  Building2, 
  MapPin, 
  FileText, 
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
  Crown,
  Trophy,
  CheckCircle,
  Globe,
  Target,
  Users
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

// Move FormStep and SectionHeader outside the component to prevent re-creation
const FormStep = ({ children, step, activeStep }) => (
    <div className={`${activeStep === step ? 'block' : 'hidden'}`}>
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
                <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        </div>
        {subtitle && <p className="text-sm text-slate-500 ml-11">{subtitle}</p>}
    </div>
);

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

    // Memoize steps to prevent re-renders
    const steps = useMemo(() => [
        { id: 1, name: 'Basic Info', icon: Store },
        { id: 2, name: 'Location', icon: MapPinned },
        { id: 3, name: 'Legal & License', icon: Shield },
        { id: 4, name: 'Branding', icon: BadgeCheck },
    ], []);

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
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            Restaurant Name *
                        </label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Tasty Bites Main Branch"
                            className="pl-10 border-slate-300 focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Business Name *
                        </label>
                        <Input
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Tasty Bites Pvt Ltd"
                            className="pl-10 border-slate-300 focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number *
                        </label>
                        <Input
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            placeholder="+91 9876543210"
                            className="pl-10 border-slate-300 focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address *
                        </label>
                        <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="contact@restaurant.com"
                            className="pl-10 border-slate-300 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <ChefHat className="h-4 w-4" />
                            Restaurant Type
                        </label>
                        <div className="relative">
                            <select
                                name="restaurantType"
                                value={formData.restaurantType}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                                {Object.entries(RESTAURANT_TYPES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <ChefHat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows="7"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Street Address *
                    </label>
                    <Input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="123 Main St, Building Name"
                        className="pl-10 border-slate-300 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">City *</label>
                    <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Mumbai"
                        className="border-slate-300 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">State *</label>
                    <Input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Maharashtra"
                        className="border-slate-300 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Postal Code *</label>
                    <Input
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        placeholder="400001"
                        className="border-slate-300 focus:border-blue-500"
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
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        GST Number
                    </label>
                    <Input
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="27AAAAA0000A1Z5"
                        className="pl-10 border-slate-300 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">FSSAI License</label>
                    <Input
                        name="fssaiLicense"
                        value={formData.fssaiLicense}
                        onChange={handleChange}
                        placeholder="FSSAI license number"
                        className="border-slate-300 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">PAN Number</label>
                    <Input
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        className="border-slate-300 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <FileKey className="h-4 w-4" />
                        License Key
                    </label>
                    <Input
                        name="licenseKey"
                        value={formData.licenseKey}
                        onChange={handleChange}
                        placeholder="Enter license key if available"
                        className="pl-10 border-slate-300 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">License Type</label>
                    <select
                        name="licenseType"
                        value={formData.licenseType}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                        {Object.entries(LICENSE_TYPES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        License Expiry
                    </label>
                    <Input
                        name="licenseExpiry"
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={handleChange}
                        className="pl-10 border-slate-300 focus:border-blue-500"
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
                            <label className="text-sm font-medium text-slate-700">
                                Upload Restaurant Image
                            </label>
                            <label 
                                htmlFor="restaurant-image"
                                className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white cursor-pointer group"
                            >
                                <div className="max-w-xs mx-auto">
                                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4 group-hover:text-blue-400 transition-colors" />
                                    <p className="text-sm text-slate-600 mb-2">
                                        <span className="font-medium text-blue-600 group-hover:text-blue-700">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        PNG, JPG, GIF up to 5MB
                                    </p>
                                </div>
                            </label>
                            <Input
                                id="restaurant-image"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                        {image && (
                            <div className="text-sm text-green-600 flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4" />
                                {image.name} ({Math.round(image.size / 1024)} KB)
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Image Preview
                        </label>
                        <div className="w-64 h-64 border-2 border-slate-200 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                            {preview ? (
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <Building2 className="h-16 w-16 text-blue-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">No image selected</p>
                                    <p className="text-xs text-slate-400 mt-1">Recommended: 500×500px</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FormStep>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/app')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                                <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">Create Your Main Restaurant</h1>
                                <p className="mt-2 text-sm sm:text-lg text-slate-600">This will be your primary restaurant that manages all outlets</p>
                            </div>
                        </div>
                    </div>

                    {/* Parent Restaurant Info Card */}
                    <div className="mb-10">
                        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                                        <Building2 className="h-12 w-12 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Primary Restaurant Setup</h3>
                                        <p className="text-slate-600 mb-4">
                                            This restaurant will act as the <span className="font-semibold text-blue-700">parent/main restaurant</span> for your business. 
                                            All future outlets will be created under this restaurant.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
                                                <Globe className="h-3 w-3 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-700">Central Management</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
                                                <Users className="h-3 w-3 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-700">Multi-Outlet Support</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
                                                <Target className="h-3 w-3 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-700">Master Settings</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-700 mb-1">Main Restaurant</div>
                                            <div className="text-sm text-blue-600">Foundation of your business</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-10">
                    <div className="flex items-center justify-between relative">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <button
                                    onClick={() => setActiveStep(step.id)}
                                    className={`flex flex-col items-center relative z-10 ${
                                        activeStep >= step.id ? 'text-blue-600' : 'text-slate-400'
                                    }`}
                                >
                                    <div className={`
                                        w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1 sm:mb-2 border-2
                                        ${activeStep === step.id ? 'bg-blue-600 text-white border-blue-600' : 
                                          activeStep > step.id ? 'bg-blue-100 text-blue-600 border-blue-600' : 
                                          'bg-white text-slate-400 border-slate-300'}
                                    `}>
                                        <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                    <span className={`text-xs sm:text-sm font-medium hidden sm:block ${activeStep >= step.id ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {step.name}
                                    </span>
                                    <span className={`text-[10px] font-medium sm:hidden ${activeStep >= step.id ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {step.id}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 sm:mx-2 ${activeStep > step.id ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <div className="h-5 w-5 text-red-500 mt-0.5">⚠️</div>
                        <div>
                            <p className="font-medium text-red-800">Error creating restaurant</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <Card className="border-slate-200 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit}>
                            <div className="p-4 sm:p-8">
                                {renderBasicInfoStep()}
                                {renderAddressStep()}
                                {renderLegalLicenseStep()}
                                {renderBrandingStep()}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                                <div>
                                    {activeStep > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveStep(activeStep - 1)}
                                            className="gap-2 border-slate-300 hover:border-blue-500"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500">
                                        Step {activeStep} of {steps.length}
                                    </span>
                                    {activeStep < steps.length ? (
                                        <Button
                                            type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setActiveStep(activeStep + 1);
                                                }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                        >
                                            Next Step
                                            <ArrowLeft className="h-4 w-4 rotate-180" />
                                        </Button>
                                    ) : (
                                        <Button 
                                            type="submit" 
                                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px] gap-2"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Creating Main Restaurant...
                                                </>
                                            ) : (
                                                <>
                                                    <Crown className="h-4 w-4" />
                                                    Create Main Restaurant
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Benefits Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Crown className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-slate-900">Central Control</h4>
                        </div>
                        <p className="text-sm text-slate-600">
                            This main restaurant will manage all outlets, settings, and configurations from one central dashboard.
                        </p>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Trophy className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-slate-900">Multi-Outlet Ready</h4>
                        </div>
                        <p className="text-sm text-slate-600">
                            After creating this main restaurant, you can add unlimited outlets under it with independent management.
                        </p>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-slate-900">Unified Reporting</h4>
                        </div>
                        <p className="text-sm text-slate-600">
                            Get consolidated reports and analytics for all outlets combined in one place for better decision making.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRestaurant;