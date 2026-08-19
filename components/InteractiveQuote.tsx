'use client';

import { useState } from 'react';
import CheckoutButton from '@/components/CheckoutButton';

interface Feature {
  id: string;
  title: string;
  price: number;
  required?: boolean;
}

interface InteractiveQuoteProps {
  quoteId: string;
  baseAmount: number;
  clientEmail: string;
  description: string;
  initialFeatures: Feature[];
  isPaid: boolean;
}

export default function InteractiveQuote({
  quoteId,
  baseAmount,
  clientEmail,
  description,
  initialFeatures,
  isPaid,
}: InteractiveQuoteProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initialFeatures.filter((f) => f.required).map((f) => f.id)
  );

  const toggleFeature = (id: string, required?: boolean) => {
    if (required) return;
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentTotal =
    baseAmount +
    initialFeatures
      .filter((f) => selectedFeatures.includes(f.id))
      .reduce((sum, f) => sum + f.price, 0);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-card rounded-xl shadow-lg border border-border">
      <h2 className="text-2xl font-bold mb-4">{description}</h2>

      <div className="space-y-3 mb-6">
        {initialFeatures.map((feature) => (
          <div
            key={feature.id}
            onClick={() => toggleFeature(feature.id, feature.required)}
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
              selectedFeatures.includes(feature.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedFeatures.includes(feature.id)}
                disabled={feature.required}
                onChange={() => {}}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="font-medium">{feature.title}</span>
            </div>
            <span className="font-semibold">+€{feature.price}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <p className="text-sm text-muted-foreground">Totale Preventivo</p>
          <p className="text-3xl font-extrabold text-primary">€{currentTotal}</p>
        </div>

        {!isPaid ? (
          <CheckoutButton
            quoteId={quoteId}
            amount={currentTotal}
            clientEmail={clientEmail}
          />
        ) : (
          <div className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg font-semibold border border-green-500/20">
            ✓ Acconto versato con successo
          </div>
        )}
      </div>
    </div>
  );
}