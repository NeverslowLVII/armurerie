'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/SignaturePad';
import { WeeklySales } from '@/components/WeeklySales';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentIcon,
  DocumentCheckIcon,
  DocumentArrowUpIcon,
  UserCircleIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Role } from '@prisma/client';

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: Role;
  contractUrl: string | null;
}

export default function EmployeeAccount() {
  const { data: session } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/employee/info');
        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations de l\'employé',
          variant: 'destructive',
        });
      }
    };

    if (session) {
      fetchUserInfo();
    }
  }, [session]);

  const handleSignContract = async (signatureData: string) => {
    try {
      const response = await fetch('/api/employee/sign-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature: signatureData }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(prev => prev ? { ...prev, contractUrl: data.contractUrl } : null);
        toast({
          title: 'Succès',
          description: 'Contrat signé avec succès',
        });
        setShowSignaturePad(false);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de signer le contrat',
        variant: 'destructive',
      });
    }
  };

  const handleUploadContract = async (userId: number) => {
    if (!contractFile) return;

    setIsUploading(true);
    try {
      // Dans un environnement de production, vous devriez d'abord uploader le fichier
      // vers un service de stockage (ex: AWS S3) et obtenir l'URL
      const contractUrl = URL.createObjectURL(contractFile);

      const response = await fetch(`/api/employees/${userId}/contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractUrl }),
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Contrat uploadé avec succès',
        });
        setContractFile(null);
      } else {
        throw new Error('Erreur lors de l\'upload du contrat');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader le contrat',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const isPatron = userInfo.role === 'PATRON' || userInfo.role === 'CO_PATRON';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mon Compte</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <UserCircleIcon className="h-5 w-5 text-red-500" />
          <span className="text-red-700 dark:text-red-300 font-medium">{userInfo.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-neutral-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircleIcon className="h-5 w-5 text-red-500" />
              Informations Personnelles
            </CardTitle>
            <CardDescription>Vos informations de compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">Nom</span>
                <span className="font-medium">{userInfo.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">Email</span>
                <span className="font-medium">{userInfo.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">Rôle</span>
                <span className="font-medium">{userInfo.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5 text-green-500" />
              Ventes et Commission
            </CardTitle>
            <CardDescription>Vos performances de la semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklySales />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-neutral-900 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentIcon className="h-5 w-5 text-blue-500" />
            Contrat de Travail
          </CardTitle>
          <CardDescription>
            {userInfo.contractUrl
              ? 'Votre contrat de travail signé'
              : 'Signez votre contrat de travail'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userInfo.contractUrl ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="flex items-center gap-3">
                <DocumentCheckIcon className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Contrat signé
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Le contrat a été signé et est en vigueur
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => userInfo.contractUrl && window.open(userInfo.contractUrl, '_blank')}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Voir le contrat
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isPatron ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleUploadContract(userInfo.id)}
                      disabled={!contractFile || isUploading}
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 animate-spin" />
                          Upload...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <DocumentArrowUpIcon className="h-4 w-4" />
                          Upload
                        </div>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Formats acceptés: PDF, DOC, DOCX
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <DocumentIcon className="h-12 w-12 text-neutral-400" />
                  <p className="text-center text-neutral-600 dark:text-neutral-400">
                    Vous n&apos;avez pas encore de contrat.
                    <br />
                    Contactez votre responsable pour plus d&apos;informations.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {showSignaturePad && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <SignaturePad
              onSave={handleSignContract}
              onCancel={() => setShowSignaturePad(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 