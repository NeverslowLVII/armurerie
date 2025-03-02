import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { SelectNative } from "@/components/ui/select-native";
import { Role } from '@/services/api';
import { useSession } from 'next-auth/react';

interface Props {
  open: boolean;
  onClose: () => void;
  userId?: number | undefined;
}

const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.3,
      bounce: 0.25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

const listItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2
    }
  }
};

const successVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

interface Feedback {
  id: number;
  type: 'BUG' | 'FEATURE_REQUEST';
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  user: {
    name: string;
    color: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    case 'IN_PROGRESS': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    case 'RESOLVED': {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    case 'REJECTED': {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    default: {
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
    }
  }
};

const getTypeColor = (type: string) => {
  return type === 'BUG'
    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
};

export default function FeedbackManager({ open, onClose, userId }: Props) {
  const { data: session } = useSession();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'BUG' | 'FEATURE_REQUEST'>('BUG');
  const [status, setStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'>('OPEN');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDeveloper = session?.user.role === Role.DEVELOPER;

  const fetchFeedbacks = useCallback(async () => {
    if (!isDeveloper) return;

    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) throw new Error('Failed to fetch feedbacks');
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('Erreur lors du chargement des retours');
    }
  }, [isDeveloper]);

  useEffect(() => {
    if (open) {
      fetchFeedbacks();
    }
  }, [open, fetchFeedbacks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          type,
          status: isDeveloper ? status : 'OPEN',
          userId: userId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSuccess('Retour soumis avec succès !');
      setTitle('');
      setDescription('');
      setType('BUG');
      setStatus('OPEN');
      fetchFeedbacks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Erreur lors de la soumission du retour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (feedbackId: number, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: feedbackId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update feedback status');
      
      fetchFeedbacks();
      setSuccess('Statut mis à jour avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating feedback status:', error);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce retour ?')) return;

    try {
      const response = await fetch(`/api/feedback?id=${feedbackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete feedback');
      
      fetchFeedbacks();
      setSuccess('Retour supprimé avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setError('Erreur lors de la suppression du retour');
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => 
    feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-10 overflow-hidden">
          <div className="flex items-center justify-center min-h-screen p-2">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="fixed inset-0 bg-neutral-500 bg-opacity-75 transition-opacity backdrop-blur-sm dark:bg-neutral-900 dark:bg-opacity-75" />
            </motion.div>

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-7xl h-[85vh] flex flex-col"
            >
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {isDeveloper ? 'Gestionnaire de retours' : 'Soumettre un retour'}
                  </Dialog.Title>
                  <div className="flex items-center space-x-4">
                    {isDeveloper && (
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Rechercher un retour..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-64 pl-4 pr-10 py-1.5 text-sm border border-neutral-300 rounded-md focus:ring-red-500 focus:border-red-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white dark:placeholder-neutral-400"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-4 w-4 text-neutral-400 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={onClose}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>

              <div className={`flex flex-1 min-h-0 ${isDeveloper ? '' : 'justify-center items-center'}`}>
                {/* Form Panel - Always visible */}
                <div className={isDeveloper ? "w-1/3 border-r border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto" : "w-full max-w-lg p-4"}>
                  {error && (
                    <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200 text-sm rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={successVariants}
                      className="mb-3 p-2 bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200 text-sm rounded"
                    >
                      {success}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Type
                      </label>
                      <SelectNative
                        value={type}
                        onChange={(e) => setType(e.target.value as 'BUG' | 'FEATURE_REQUEST')}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="BUG">Bug</option>
                        <option value="FEATURE_REQUEST">Nouvelle fonctionnalité</option>
                      </SelectNative>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Titre
                      </label>
                      <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-600 dark:text-white dark:placeholder-neutral-400"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-600 dark:text-white dark:placeholder-neutral-400"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {isDeveloper && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Statut
                        </label>
                        <SelectNative
                          value={status}
                          onChange={(e) => setStatus(e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED')}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                          required
                          disabled={isSubmitting}
                        >
                          <option value="OPEN">Ouvert</option>
                          <option value="IN_PROGRESS">En cours</option>
                          <option value="RESOLVED">Résolu</option>
                          <option value="REJECTED">Rejeté</option>
                        </SelectNative>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          isSubmitting
                            ? 'bg-red-400 dark:bg-red-500'
                            : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Soumission...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-4 w-4 mr-1.5" />
                            Soumettre le retour
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Feedback List - Only visible to developers */}
                {isDeveloper && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          Retours existants
                          <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                            ({filteredFeedbacks.length} résultats)
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-2 p-4">
                        <AnimatePresence mode="popLayout">
                          {filteredFeedbacks.map((feedback) => (
                            <motion.div
                              key={feedback.id}
                              variants={listItemVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              layout
                              className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-lg font-medium text-red-600 dark:text-red-400">{feedback.title}</span>
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                      {feedback.user ? `Par ${feedback.user.name}` : 'Anonyme'} - {new Date(feedback.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <SelectNative
                                      value={feedback.status}
                                      onChange={(e) => handleStatusChange(feedback.id, e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED')}
                                      className="text-sm border-neutral-300 rounded-md focus:ring-red-500 focus:border-red-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                                    >
                                      <option value="OPEN">Ouvert</option>
                                      <option value="IN_PROGRESS">En cours</option>
                                      <option value="RESOLVED">Résolu</option>
                                      <option value="REJECTED">Rejeté</option>
                                    </SelectNative>
                                    <Button
                                      onClick={() => handleDelete(feedback.id)}
                                      className="p-1 text-neutral-400 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </div>

                                <p className="text-sm text-neutral-600 dark:text-neutral-300">{feedback.description}</p>

                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(feedback.type)}`}>
                                    {feedback.type === 'BUG' ? 'Bug' : 'Nouvelle fonctionnalité'}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                                    {feedback.status}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </Dialog>
      </AnimatePresence>
    </>
  );
} 