'use client';

import { useRef, useEffect } from 'react';
import SignaturePadLib from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      signaturePadRef.current = new SignaturePadLib(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
      });
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.clear();
      }
    };
  }, []);

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL();
      onSave(signatureData);
    }
  };

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Signez votre contrat</h3>
        <div className="border border-gray-300 rounded-lg mb-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="touch-none"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClear}>
            Effacer
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Signer
          </Button>
        </div>
      </div>
    </Card>
  );
} 