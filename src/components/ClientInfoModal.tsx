import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { X, Building, User, MapPin, Calendar, Truck, DollarSign, BarChart3, Settings, MessageSquare } from 'lucide-react';
import { authApi } from '../services/api';

interface ClientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  existingData?: ClientInfoData | null;
}

interface ClientInfoData {
  company_name: string;
  owner_name: string;
  state: string;
  city: string;
  year_started: number | '';
  trucks_count: number | '';
  monthly_revenue: string;
  gross_profit_margin: number | '';
  main_services: string[];
  pricing_model: string;
  software_tools: string[];
  current_challenges: string;
}

const ClientInfoModal: React.FC<ClientInfoModalProps> = ({ isOpen, onClose, onComplete, existingData }) => {
  const [formData, setFormData] = useState<ClientInfoData>({
    company_name: '',
    owner_name: '',
    state: '',
    city: '',
    year_started: '',
    trucks_count: '',
    monthly_revenue: '',
    gross_profit_margin: '',
    main_services: [],
    pricing_model: '',
    software_tools: [],
    current_challenges: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill form with existing data when modal opens
  React.useEffect(() => {
    if (existingData && isOpen) {
      setFormData({
        company_name: existingData.company_name || '',
        owner_name: existingData.owner_name || '',
        state: existingData.state || '',
        city: existingData.city || '',
        year_started: existingData.year_started || '',
        trucks_count: existingData.trucks_count || '',
        monthly_revenue: existingData.monthly_revenue || '',
        gross_profit_margin: existingData.gross_profit_margin || '',
        main_services: existingData.main_services || [],
        pricing_model: existingData.pricing_model || '',
        software_tools: existingData.software_tools || [],
        current_challenges: existingData.current_challenges || ''
      });
    } else if (isOpen && !existingData) {
      // Reset form when opening without existing data
      setFormData({
        company_name: '',
        owner_name: '',
        state: '',
        city: '',
        year_started: '',
        trucks_count: '',
        monthly_revenue: '',
        gross_profit_margin: '',
        main_services: [],
        pricing_model: '',
        software_tools: [],
        current_challenges: ''
      });
    }
  }, [existingData, isOpen]);

  const serviceOptions = [
    'Junk Removal (Residential)',
    'Junk Removal (Commercial)',
    'Bin Rental',
    'Trailer Rental',
    'Light Demolition',
    'Recycling Services'
  ];

  const softwareOptions = [
    'CRM Software',
    'Booking System',
    'GPS Tracking',
    'Accounting Software',
    'Route Optimization',
    'Customer Management',
    'Inventory Management',
    'Mobile Apps'
  ];

  const revenueOptions = [
    { value: '0-250k', label: '$0 - $250,000' },
    { value: '250k-500k', label: '$250,000 - $500,000' },
    { value: '500k-1m', label: '$500,000 - $1,000,000' },
    { value: '1m-2m', label: '$1,000,000 - $2,000,000' },
    { value: '2m-4m', label: '$2,000,000 - $4,000,000' },
    { value: '4m+', label: '$4,000,000+' }
  ];

  const pricingOptions = [
    { value: 'by_weight', label: 'By weight' },
    { value: 'by_volume', label: 'By volume' },
    { value: 'by_hour', label: 'By the hour' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field: keyof ClientInfoData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      main_services: prev.main_services.includes(service)
        ? prev.main_services.filter(s => s !== service)
        : [...prev.main_services, service]
    }));
  };

  const handleSoftwareToggle = (software: string) => {
    setFormData(prev => ({
      ...prev,
      software_tools: prev.software_tools.includes(software)
        ? prev.software_tools.filter(s => s !== software)
        : [...prev.software_tools, software]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authApi.updateClientInfo(formData);
      onComplete();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative pb-6">
            <button
              onClick={handleSkip}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Building className="w-6 h-6 text-primary-500" />
              Tell Us About Your Business
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Help us customize your experience by sharing some details about your business.
              <br />
              <span className="text-sm text-gray-500">You can skip this for now and complete it later.</span>
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_name">Owner/Your Name</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => handleInputChange('owner_name', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="e.g., California, Ontario"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Your city"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Business Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year_started">Year Started Business</Label>
                    <Input
                      id="year_started"
                      type="number"
                      value={formData.year_started}
                      onChange={(e) => handleInputChange('year_started', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="e.g., 2020"
                      min="1900"
                      max="2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trucks_count"># of Trucks in Operation</Label>
                    <Input
                      id="trucks_count"
                      type="number"
                      value={formData.trucks_count}
                      onChange={(e) => handleInputChange('trucks_count', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="e.g., 3"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthly_revenue">Monthly Revenue Range</Label>
                    <select
                      id="monthly_revenue"
                      value={formData.monthly_revenue}
                      onChange={(e) => handleInputChange('monthly_revenue', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select range</option>
                      {revenueOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="gross_profit_margin">Gross Profit Margin (estimate %)</Label>
                    <Input
                      id="gross_profit_margin"
                      type="number"
                      value={formData.gross_profit_margin}
                      onChange={(e) => handleInputChange('gross_profit_margin', e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="e.g., 25"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Main Services Offered
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {serviceOptions.map(service => (
                    <label key={service} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.main_services.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pricing Model */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Pricing Model
                </h3>
                <select
                  value={formData.pricing_model}
                  onChange={(e) => handleInputChange('pricing_model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select pricing model</option>
                  {pricingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Software Tools */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Software Tools Used
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {softwareOptions.map(software => (
                    <label key={software} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.software_tools.includes(software)}
                        onChange={() => handleSoftwareToggle(software)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{software}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Challenges */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Top Current Challenges
                </h3>
                <textarea
                  value={formData.current_challenges}
                  onChange={(e) => handleInputChange('current_challenges', e.target.value)}
                  placeholder="Tell us about your biggest challenges in running your business..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </CardContent>

            <div className="flex flex-col sm:flex-row gap-3 p-6 pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-black hover:bg-gray-800 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Information'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ClientInfoModal;