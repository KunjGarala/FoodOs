import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../services/api';
import { updateTokenAndRole } from '../store/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Building2, MapPin, FileText, BadgeCheck } from 'lucide-react';

const LICENSE_TYPES = {
    TRIAL: 'Trial',
    BASIC: 'Basic',
    STANDARD: 'Standard',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise'
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parentRestaurantId, setParentRestaurantId] = useState(null);

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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!parentRestaurantId) {
            setError('Parent restaurant ID not found');
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

    const SectionHeader = ({ icon: Icon, title }) => (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
            <Icon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900">Add New Outlet</h2>
                    <p className="mt-2 text-slate-500">Provide details for your new restaurant outlet.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <Card className="border-slate-200 shadow-xl">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Basic Info */}
                            <div>
                                <SectionHeader icon={Building2} title="Basic Information" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Restaurant Name</label>
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. Tasty Bites - Downtown"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Business Name</label>
                                        <Input
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. Tasty Bites Pvt Ltd"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Email</label>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="outlet@restaurant.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Phone Number</label>
                                        <Input
                                            name="phoneNumber"
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            required
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Description</label>
                                        <textarea
                                            name="description"
                                            rows="3"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Tell us about this outlet..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <SectionHeader icon={MapPin} title="Address Details" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Street Address</label>
                                        <Input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            placeholder="123 Main St"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">City</label>
                                        <Input
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">State</label>
                                        <Input
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Postal Code</label>
                                        <Input
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Legal & License */}
                            <div>
                                <SectionHeader icon={FileText} title="Legal & License Information" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">GST Number</label>
                                        <Input
                                            name="gstNumber"
                                            value={formData.gstNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">FSSAI License</label>
                                        <Input
                                            name="fssaiLicense"
                                            value={formData.fssaiLicense}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">PAN Number</label>
                                        <Input
                                            name="panNumber"
                                            value={formData.panNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">License Key</label>
                                        <Input
                                            name="licenseKey"
                                            value={formData.licenseKey}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">License Type</label>
                                        <select
                                            name="licenseType"
                                            value={formData.licenseType}
                                            onChange={handleChange}
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                        >
                                            {Object.entries(LICENSE_TYPES).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">License Expiry</label>
                                        <Input
                                            name="licenseExpiry"
                                            type="datetime-local"
                                            value={formData.licenseExpiry}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Restaurant Type</label>
                                        <select
                                            name="restaurantType"
                                            value={formData.restaurantType}
                                            onChange={handleChange}
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                        >
                                            {Object.entries(RESTAURANT_TYPES).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Image */}
                            <div>
                                <SectionHeader icon={BadgeCheck} title="Branding" />
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Restaurant Image</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-slate-200">
                                <Button 
                                    type="submit" 
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Outlet'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CreateOutlet;
