"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { OfferForm } from "@/components/admin/offer-form";
import { requireAdmin } from "@/lib/auth";
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
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null>(null);

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

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await requireAdmin();
        setUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
        });
      } catch (err) {
        console.error("Error getting user:", err);
      }
    };

    getUser();
  }, []);

  const handleSave = async (offerData: any) => {
    try {
      setIsSaving(true);
      setError(null);

      const url = isNew ? "/api/admin/offers" : `/api/admin/offers/${offerId}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save offer");
      }

      const result = await response.json();

      if (isNew) {
        // Redirect to the new offer page
        router.push(`/admin/offers/${result.offer.id}`);
      } else {
        // Update local state
        setOffer((prev) => (prev ? { ...prev, ...result.offer } : null));
      }

      // Show success message (you could add a toast notification here)
      console.log("Offer saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save offer");
      console.error("Error saving offer:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout
        user={user || { firstName: "Admin", lastName: "User", avatar: null }}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-foreground/60">Loading offer...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !isNew) {
    return (
      <AdminLayout
        user={user || { firstName: "Admin", lastName: "User", avatar: null }}
      >
        <div className="space-y-6">
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
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      user={user || { firstName: "Admin", lastName: "User", avatar: null }}
    >
      <div className="space-y-8">
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
    </AdminLayout>
  );
}
