import React from 'react';
import { X, Building, User, MapPin, Calendar, Truck, DollarSign, BarChart3, Settings, MessageSquare } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

interface CompanyInfoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyInfo: {
    company_name?: string;
    owner_name?: string;
    state?: string;
    city?: string;
    year_started?: number;
    trucks_count?: number;
    monthly_revenue?: string;
    gross_profit_margin?: number;
    main_services?: string[];
    pricing_model?: string;
    software_tools?: string[];
    current_challenges?: string;
  } | null;
  userName: string;
}

const CompanyInfoDetailsModal: React.FC<CompanyInfoDetailsModalProps> = ({
  isOpen,
  onClose,
  companyInfo,
  userName
}) => {
  if (!isOpen) return null;

  const formatRevenue = (revenue: string) => {
    const revenueMap: { [key: string]: string } = {
      '0-250k': '$0 - $250,000',
      '250k-500k': '$250,000 - $500,000',
      '500k-1m': '$500,000 - $1,000,000',
      '1m-2m': '$1,000,000 - $2,000,000',
      '2m-4m': '$2,000,000 - $4,000,000',
      '4m+': '$4,000,000+'
    };
    return revenueMap[revenue] || revenue;
  };

  const formatPricingModel = (model: string) => {
    const modelMap: { [key: string]: string } = {
      'by_weight': 'By weight',
      'by_volume': 'By volume',
      'by_hour': 'By the hour',
      'other': 'Other'
    };
    return modelMap[model] || model;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative pb-6">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              Company Information Details
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Detailed company information for {userName}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {!companyInfo ? (
              <div className="text-center py-8">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Information</h3>
                <p className="text-gray-500">This user hasn't provided their company information yet.</p>
              </div>
            ) : (
              <>
                {/* Basic Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Company Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company Name</label>
                        <p className="text-gray-900">{companyInfo.company_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Owner Name</label>
                        <p className="text-gray-900">{companyInfo.owner_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Year Started</label>
                        <p className="text-gray-900">{companyInfo.year_started || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">State</label>
                        <p className="text-gray-900">{companyInfo.state || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">City</label>
                        <p className="text-gray-900">{companyInfo.city || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Fleet & Operations
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Number of Trucks</label>
                        <p className="text-gray-900">{companyInfo.trucks_count || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pricing Model</label>
                        <p className="text-gray-900">{companyInfo.pricing_model ? formatPricingModel(companyInfo.pricing_model) : 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Financial Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Monthly Revenue</label>
                        <p className="text-gray-900">{companyInfo.monthly_revenue ? formatRevenue(companyInfo.monthly_revenue) : 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gross Profit Margin</label>
                        <p className="text-gray-900">{companyInfo.gross_profit_margin ? `${companyInfo.gross_profit_margin}%` : 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                {companyInfo.main_services && companyInfo.main_services.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Main Services
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {companyInfo.main_services.map((service, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Software Tools */}
                {companyInfo.software_tools && companyInfo.software_tools.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Software Tools Used
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {companyInfo.software_tools.map((tool, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Challenges */}
                {companyInfo.current_challenges && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Current Challenges
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{companyInfo.current_challenges}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyInfoDetailsModal;