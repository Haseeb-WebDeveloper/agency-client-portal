"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContractForm } from "@/components/admin/contract-form";
import { MediaFile } from "@/types/models";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  logo?: string | null;
}

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  clientId: string;
  startDate: string | null;
  endDate: string | null;
  value: number | null;
  currency: string;
  budget: number | null;
  priority: number;
  estimatedHours: number | null;
  progressPercentage: number;
  actualHours: number;
  media: MediaFile[];
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

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const isNew = contractId === "new";

  const [contract, setContract] = useState<Contract | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contract data (if editing)
  useEffect(() => {
    const fetchContract = async () => {
      if (isNew) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/contracts/${contractId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch contract");
        }
        const data = await response.json();
        setContract(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch contract");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContract();
  }, [contractId, isNew]);

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

  const handleSave = async (contractData: any) => {
    try {
      setIsSaving(true);
      setError(null);

      const url = isNew ? "/api/admin/contracts" : `/api/admin/contracts/${contractId}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
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

      if (isNew) {
        // Redirect to the new contract page
        router.push(`/admin/contracts/${result.contract.id}`);
      } else {
        // Update local state
        setContract((prev) => (prev ? { ...prev, ...result.contract } : null));
      }

      // Show success message (you could add a toast notification here)
      console.log("Contract saved successfully");
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
            <p className="text-foreground/60">Loading contract...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Error Loading Contract
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
          <h1 className="figma-h3">
            {isNew ? "Create New Contract" : "Edit Contract"}
          </h1>
          {!isNew && contract && (
            <div className="mt-1 space-y-1">
              <p className="text-foreground/60">
                Created {new Date(contract.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground/60">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  contract.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
                  contract.status === 'DRAFT' ? 'bg-orange-500/20 text-orange-500' :
                  contract.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {contract.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
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
          contract={contract}
          clients={clients}
          onSave={handleSave}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
