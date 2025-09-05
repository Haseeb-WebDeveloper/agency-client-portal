"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContractForm } from "@/components/admin/contract-form";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  logo?: string | null;
}

export default function NewContractPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : "Failed to fetch clients");
        console.error("Error fetching clients:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleSave = async (contractData: any) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save contract");
      }

      const result = await response.json();

      // Redirect to the contracts list page
      router.push("/admin/contracts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contract");
      console.error("Error saving contract:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Error Loading Page
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="figma-h3">Create New Contract</h1>
          <p className="text-foreground/60 mt-1">
            Set up a new contract for your client
          </p>
        </div>
        <Link
          href="/admin/contracts"
          className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
        >
          ← Back to Contracts
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
        <ContractForm
          contract={null}
          clients={clients}
          onSave={handleSave}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
