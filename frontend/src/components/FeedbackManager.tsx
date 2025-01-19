import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import DeveloperLogin from './DeveloperLogin';

interface Props {
  open: boolean;
  onClose: () => void;
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

const textVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
};

interface Feedback {
  id: number;
  type: 'BUG' | 'FEATURE_REQUEST';
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  employee: {
    name: string;
    color: string;
  };
}

export default function FeedbackManager({ open, onClose }: Props) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'BUG' | 'FEATURE_REQUEST'>('BUG');
  const [status, setStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'>('OPEN');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [showDeveloperLogin, setShowDeveloperLogin] = useState(false);

  useEffect(() => {
    const checkDeveloperStatus = async () => {
      try {
        const response = await fetch('/api/auth/developer');
        if (response.ok) {
          setIsDeveloper(true);
        }
      } catch (error) {
        console.error('Error checking developer status:', error);
      }
    };

    checkDeveloperStatus();
  }, []);

  const handleDeveloperLogin = () => {
    setShowDeveloperLogin(true);
  };

  const handleDeveloperLoginSuccess = () => {
    setIsDeveloper(true);
    fetchFeedbacks();
  };

  const fetchFeedbacks = async () => {
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
  };

  useEffect(() => {
    if (open) {
      fetchFeedbacks();
    }
  }, [open, isDeveloper]);

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

  const filteredFeedbacks = feedbacks.filter(feedback => 
    feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'BUG' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800';
  };

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
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" />
            </motion.div>

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-lg shadow-xl w-full max-w-7xl h-[85vh] flex flex-col"
            >
              <div className="p-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {isDeveloper ? 'Gestionnaire de retours' : 'Soumettre un retour'}
                  </Dialog.Title>
                  <div className="flex items-center space-x-4">
                    {!isDeveloper && (
                      <button
                        onClick={handleDeveloperLogin}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Connexion développeur
                      </button>
                    )}
                    {isDeveloper && (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher un retour..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-64 pl-4 pr-10 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>

              <div className={`flex flex-1 min-h-0 ${!isDeveloper ? 'justify-center items-center' : ''}`}>
                {/* Form Panel - Always visible */}
                <div className={isDeveloper ? "w-1/3 border-r border-gray-200 p-4 overflow-y-auto" : "w-full max-w-lg p-4"}>
                  {error && (
                    <div className="mb-3 p-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={successVariants}
                      className="mb-3 p-2 bg-green-100 border-l-4 border-green-500 text-green-700 text-sm rounded"
                    >
                      {success}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'BUG' | 'FEATURE_REQUEST')}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="BUG">Bug</option>
                        <option value="FEATURE_REQUEST">Nouvelle fonctionnalité</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {isDeveloper && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Statut
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED')}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                          disabled={isSubmitting}
                        >
                          <option value="OPEN">Ouvert</option>
                          <option value="IN_PROGRESS">En cours</option>
                          <option value="RESOLVED">Résolu</option>
                          <option value="REJECTED">Rejeté</option>
                        </select>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          isSubmitting
                            ? 'bg-red-400'
                            : 'bg-red-600 hover:bg-red-700'
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
                      </button>
                    </div>
                  </form>
                </div>

                {/* Feedback List - Only visible to developers */}
                {isDeveloper && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          Retours existants
                          <span className="ml-2 text-xs text-gray-500">
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
                              className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-lg font-medium text-red-600">{feedback.title}</span>
                                    <span className="text-sm text-gray-500">
                                      Par {feedback.employee.name} - {new Date(feedback.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600">{feedback.description}</p>

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

      <DeveloperLogin
        open={showDeveloperLogin}
        onClose={() => setShowDeveloperLogin(false)}
        onSuccess={handleDeveloperLoginSuccess}
      />
    </>
  );
} 