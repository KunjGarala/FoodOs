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
  ChefHat
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

    const SectionHeader = useCallback(({ icon: Icon, title, subtitle }) => (
        <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            </div>
            {subtitle && <p className="text-sm text-slate-500 ml-11">{subtitle}</p>}
        </div>
    ), []);

    // Optimized FormStep component
    const FormStep = useCallback(({ children, step }) => (
        <div className={`${activeStep === step ? 'block' : 'hidden'}`}>
            {children}
        </div>
    ), [activeStep]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Add New Outlet</h2>
                            <p className="mt-2 text-slate-600">Create a new restaurant outlet under your existing business</p>
                        </div>
                        
                        {parentRestaurantId && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-slate-700">Parent Restaurant:</span>
                                <span className="text-sm font-semibold text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded">
                                    {parentRestaurantId}
                                </span>
                            </div>
                        )}
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
                                        w-10 h-10 rounded-full flex items-center justify-center mb-2
                                        ${activeStep === step.id ? 'bg-blue-600 text-white' : 
                                          activeStep > step.id ? 'bg-blue-100 text-blue-600' : 
                                          'bg-slate-100 text-slate-400'}
                                    `}>
                                        <step.icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-xs font-medium ${activeStep >= step.id ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {step.name}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${activeStep > step.id ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <div className="h-5 w-5 text-red-500 mt-0.5">⚠️</div>
                        <div>
                            <p className="font-medium text-red-800">Error creating outlet</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit}>
                            <div className="p-8">
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
                                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                    <Store className="h-4 w-4" />
                                                    Restaurant Name
                                                </label>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="e.g. Tasty Bites - Downtown"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4" />
                                                    Business Name
                                                </label>
                                                <Input
                                                    name="businessName"
                                                    value={formData.businessName}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="e.g. Tasty Bites Pvt Ltd"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
                                                    className="pl-10"
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
                                                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
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
                                                    rows="6"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                Street Address
                                            </label>
                                            <Input
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                required
                                                placeholder="123 Main St, Building Name"
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">City</label>
                                            <Input
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. Mumbai"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">State</label>
                                            <Input
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. Maharashtra"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Postal Code</label>
                                            <Input
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                required
                                                placeholder="400001"
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
                                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <Hash className="h-4 w-4" />
                                                GST Number
                                            </label>
                                            <Input
                                                name="gstNumber"
                                                value={formData.gstNumber}
                                                onChange={handleChange}
                                                placeholder="27AAAAA0000A1Z5"
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">FSSAI License</label>
                                            <Input
                                                name="fssaiLicense"
                                                value={formData.fssaiLicense}
                                                onChange={handleChange}
                                                placeholder="FSSAI license number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">PAN Number</label>
                                            <Input
                                                name="panNumber"
                                                value={formData.panNumber}
                                                onChange={handleChange}
                                                placeholder="ABCDE1234F"
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
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">License Type</label>
                                            <select
                                                name="licenseType"
                                                value={formData.licenseType}
                                                onChange={handleChange}
                                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
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
                                                className="pl-10"
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
                                                    <label className="text-sm font-medium text-slate-700">
                                                        Upload Restaurant Image
                                                    </label>
                                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                                                        <div className="max-w-xs mx-auto">
                                                            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                                            <p className="text-sm text-slate-600 mb-2">
                                                                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                                                            </p>
                                                            <p className="text-xs text-slate-500">
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
                                                <div className="w-64 h-64 border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                                                    {preview ? (
                                                        <img 
                                                            src={preview} 
                                                            alt="Preview" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-center p-4">
                                                            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-2" />
                                                            <p className="text-sm text-slate-400">No image selected</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FormStep>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                                <div>
                                    {activeStep > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveStep(activeStep - 1)}
                                            className="gap-2"
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
                                            onClick={() => setActiveStep(activeStep + 1)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                        >
                                            Next Step
                                            <ArrowLeft className="h-4 w-4 rotate-180" />
                                        </Button>
                                    ) : (
                                        <Button 
                                            type="submit" 
                                            className="bg-green-600 hover:bg-green-700 text-white min-w-[180px] gap-2"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Creating Outlet...
                                                </>
                                            ) : (
                                                <>
                                                    <BadgeCheck className="h-4 w-4" />
                                                    Create Outlet
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Information Box */}
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Store className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900 mb-1">About Outlet Creation</h4>
                            <p className="text-sm text-slate-600">
                                This outlet will be created under your parent restaurant <strong className="font-semibold text-blue-700">{parentRestaurantId}</strong>. 
                                All settings, menu items, and configurations can be managed independently for each outlet.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateOutlet;