"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { OfferForm } from "@/components/admin/offer-form";
import { createOrUpdateOffer } from "@/actions/offers";
import { MediaFile } from "@/types/models";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  logo?: string | null;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  media: MediaFile[] | null;
  validUntil: string | null;
  clientId: string;
  hasReviewed: boolean;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    logo?: string | null;
  };
  creator: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function OfferPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const isNew = offerId === "new";

  const [offer, setOffer] = useState<Offer | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch offer data (if editing)
  useEffect(() => {
    const fetchOffer = async () => {
      if (isNew) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/offers/${offerId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch offer");
        }
        const data = await response.json();
        setOffer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch offer");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffer();
  }, [offerId, isNew]);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/admin/clients");
        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }
        const data = await response.json();
        setClients(data.clients);
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    };

    fetchClients();
  }, []);


  const handleSave = async (offerData: any) => {
    try {
      setIsSaving(true);
      setError(null);
      const saved = await createOrUpdateOffer(isNew ? null : offerId, offerData);
      if (isNew) {
        router.push(`/admin/offers/${saved.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save offer");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6  px-8 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading offer...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="space-y-6  px-8 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Error Loading Offer
            </h3>
            <p className="text-foreground/60 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="figma-btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-8  px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="figma-h3">
              {isNew ? "Create New Offer" : "Edit Offer"}
            </h1>
            {!isNew && offer && (
              <p className="text-foreground/60 mt-1">
                Created {new Date(offer.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Link
            href="/admin/offers"
            className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            ← Back to Offers
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="max-w-4xl">
          <OfferForm
            offer={offer}
            clients={clients}
            onSave={handleSave}
            isLoading={isSaving}
          />
        </div>
      </div>
  );
}
