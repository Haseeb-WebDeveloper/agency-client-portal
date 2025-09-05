import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MediaFile } from '@/types/models';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, FileText, MessageCircle, Sparkles } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  media: MediaFile[] | null;
  validUntil: string | null;
  createdAt: string;
  client_name: string;
  client_logo: string | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
}

interface OfferCardProps {
  offer: Offer;
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-800 text-gray-300 border-gray-600', icon: null },
  SENT: { label: 'New!', color: 'bg-blue-600 text-white border-blue-500', icon: Sparkles },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-600 text-white border-green-500', icon: null },
  DECLINED: { label: 'Declined', color: 'bg-red-600 text-white border-red-500', icon: null },
  EXPIRED: { label: 'Expired', color: 'bg-gray-800 text-gray-300 border-gray-600', icon: null },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-800 text-gray-300 border-gray-600', icon: null },
  PENDING: { label: 'Pending Review', color: 'bg-gray-800 text-white border-gray-600', icon: null },
};

const serviceTags = ['Copywriting', 'Graphic design', 'Lead gen'];

export function OfferCard({ offer }: OfferCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const statusInfo = statusConfig[offer.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleMessageUs = () => {
    // TODO: Implement message functionality
    console.log('Message us clicked for offer:', offer.id);
  };

  return (
    <>
      <div 
        className="relative cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border border-purple-600/30 hover:border-purple-600/50 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm"
        onClick={handleCardClick}
        style={{
          background: 'linear-gradient(135deg, #1A0F2C 0%, #2D1B4E 100%)',
          border: '1px solid #4A2C6E',
          borderRadius: '8px'
        }}
      >
        {/* Status Badge - Top Right */}
        <div 
          className="absolute -top-1 -right-1 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2"
          style={{
            background: '#1A0F2C',
            border: '1px solid #4A2C6E',
            color: '#FFFFFF'
          }}
        >
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Pending Review</span>
        </div>

        <div className="p-6">
          <div className="flex">
            {/* Left Section - Main Content */}
            <div className="flex-1 pr-4">
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: '#FFFFFF' }}
              >
                {offer.title}
              </h3>
              <p 
                className="text-sm leading-relaxed"
                style={{ color: '#B0A8C0' }}
              >
                {offer.description || 'A 3-month strategy to scale your Instagram reach by 40%...'}
              </p>
            </div>

            {/* Right Section - Metadata */}
            <div className="w-48 flex flex-col gap-4">
              {/* Service Tags */}
              <div className="flex flex-wrap gap-2">
                {serviceTags.map((tag) => (
                  <div
                    key={tag}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: '#281C3D',
                      border: '1px solid #4A2C6E',
                      color: '#FFFFFF'
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>

              {/* File Count and Date */}
              <div className="flex items-center justify-between text-sm" style={{ color: '#B0A8C0' }}>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{offer.media?.length || 4} files</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>12th Aug, 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {StatusIcon && <StatusIcon className="w-4 h-4" />}
                <div className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {offer.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <p className="text-foreground/80 leading-relaxed">
                {offer.description || 'No description provided'}
              </p>
            </div>

            {/* Service tags */}
            <div className="flex flex-wrap gap-2">
              {serviceTags.map((tag) => (
                <div
                  key={tag}
                  className="px-2 py-1 rounded text-sm font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </div>
              ))}
            </div>

            {/* Project Assets */}
            {offer.media && offer.media.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-foreground">Project Assets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {offer.media.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-primary/20 rounded-lg hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name || `File ${index + 1}`}
                        </p>
                        <p className="text-xs text-foreground/60 capitalize">
                          {file.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="flex items-center justify-between pt-4 border-t border-primary/20">
              <p className="text-foreground/80">Interested in this offer?</p>
              <Button onClick={handleMessageUs} className="bg-primary hover:bg-primary/90">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message us
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
