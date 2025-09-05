'use client';

import { useState } from 'react';
import { X, Loader2, User, Building2, Mail, Globe, Image as ImageIcon } from 'lucide-react';

interface CreateClientModalProps {
  onClose: () => void;
  onClientCreated: () => void;
}

interface ClientFormData {
  // Client data
  name: string;
  description: string;
  website: string;
  logo: string;
  
  // Primary contact data
  firstName: string;
  lastName: string;
  email: string;
}

export function CreateClientModal({ onClose, onClientCreated }: CreateClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    description: '',
    website: '',
    logo: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const result = await response.json();
      
      // Show success message and close modal
      onClientCreated();
      
      // Optionally show a success notification
      console.log('Client created successfully:', result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate client data
      if (!formData.name.trim()) {
        setError('Client name is required');
        return;
      }
    }
    setCurrentStep(2);
    setError(null);
  };

  const prevStep = () => {
    setCurrentStep(1);
    setError(null);
  };

  const isStep1Valid = formData.name.trim() !== '';
  const isStep2Valid = formData.firstName.trim() !== '' && 
                      formData.lastName.trim() !== '' && 
                      formData.email.trim() !== '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-primary/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Create New Client</h2>
            <p className="text-foreground/60 mt-1">
              {currentStep === 1 ? 'Enter client company information' : 'Set up primary contact'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground/60 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-primary/10">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-foreground/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-foreground/40'
              }`}>
                1
              </div>
              <span className="figma-small">Client Info</span>
            </div>
            <div className={`flex-1 h-px ${currentStep >= 2 ? 'bg-primary' : 'bg-primary/20'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-foreground/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-foreground/40'
              }`}>
                2
              </div>
              <span className="figma-small">Contact</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Client Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Client Company Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter company name"
                    className="w-full px-4 py-3 border border-primary/20 rounded-lg bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the company"
                    rows={3}
                    className="w-full px-4 py-3 border border-primary/20 rounded-lg bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-3 border border-primary/20 rounded-lg bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Logo URL
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => handleInputChange('logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full pl-10 pr-4 py-3 border border-primary/20 rounded-lg bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Primary Contact */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Primary Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 border border-primary/20 rounded-lg bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 border border-primary/20 rounded-lg bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className="w-full pl-10 pr-4 py-3 border border-primary/20 rounded-lg bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-foreground/60 mt-2">
                    A magic link will be sent to this email for the client to access their account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-primary/10">
            <div className="flex gap-3">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-primary/20 text-foreground/60 hover:border-primary/40 hover:text-foreground rounded-lg transition-all"
                  disabled={isLoading}
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-primary/20 text-foreground/60 hover:border-primary/40 hover:text-foreground rounded-lg transition-all"
                disabled={isLoading}
              >
                Cancel
              </button>

              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStep1Valid || isLoading}
                  className="figma-btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isStep2Valid || isLoading}
                  className="figma-btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Client...
                    </>
                  ) : (
                    'Create Client & Send Login'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
