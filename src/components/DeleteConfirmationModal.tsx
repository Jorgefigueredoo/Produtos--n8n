/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Produto } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  productToConfirm: Produto | null;
  isDeleting: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  productToConfirm,
  isDeleting,
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && productToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl bg-white p-6 shadow-2xl border border-slate-100"
            id="delete-confirm-modal"
          >
            {/* Close button */}
            <button
              id="close-delete-btn"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon and text */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Confirmar Exclusão
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Você tem certeza de que deseja excluir o produto{' '}
                  <span className="font-semibold text-slate-800">{productToConfirm.nome}</span>? 
                  Esta ação é permanente e removerá o produto de toda a base de dados.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs text-slate-500 border border-slate-100">
                  <span className="font-medium text-slate-700">Categoria:</span> {productToConfirm.categoria}
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span className="font-medium text-slate-700">ID:</span> <span className="font-mono text-[10px]">{productToConfirm.id}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                id="cancel-delete-btn"
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                disabled={isDeleting}
              >
                Voltar
              </button>
              <button
                id="confirm-delete-btn"
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Excluir Produto
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
