/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, FileText, Layers, DollarSign, Package, Tag } from 'lucide-react';
import { Produto, NovoProdutoInput } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NovoProdutoInput | Produto) => Promise<void>;
  productToEdit?: Produto | null;
  isSubmitting: boolean;
}

const COMMON_CATEGORIES = [
  'Smartphones',
  'Notebooks',
  'Monitores',
  'Áudio',
  'Periféricos',
  'Eletrodomésticos',
  'Outros'
];

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  isSubmitting
}: ProductFormModalProps) {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precoStr, setPrecoStr] = useState('');
  const [estoqueStr, setEstoqueStr] = useState('');
  const [descricao, setDescricao] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if editing
  useEffect(() => {
    if (productToEdit) {
      setNome(productToEdit.nome);
      setCategoria(productToEdit.categoria);
      setPrecoStr(productToEdit.preco.toString());
      setEstoqueStr(productToEdit.estoque.toString());
      setDescricao(productToEdit.descricao);
    } else {
      setNome('');
      setCategoria('');
      setPrecoStr('');
      setEstoqueStr('');
      setDescricao('');
    }
    setErrors({});
  }, [productToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = 'O nome do produto é obrigatório.';
    if (!categoria.trim()) newErrors.categoria = 'A categoria é obrigatória.';
    
    const precoNum = parseFloat(precoStr);
    if (!precoStr) {
      newErrors.preco = 'O preço é obrigatório.';
    } else if (isNaN(precoNum) || precoNum < 0) {
      newErrors.preco = 'O preço deve ser um valor numérico maior ou igual a zero.';
    }

    const estoqueNum = parseInt(estoqueStr, 10);
    if (!estoqueStr) {
      newErrors.estoque = 'O estoque é obrigatório.';
    } else if (isNaN(estoqueNum) || estoqueNum < 0) {
      newErrors.estoque = 'O estoque deve ser um número inteiro igual ou superior a zero.';
    }

    if (!descricao.trim()) newErrors.descricao = 'A descrição do produto é obrigatória.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dataPayload = {
      nome: nome.trim(),
      categoria: categoria.trim(),
      preco: parseFloat(precoStr),
      estoque: parseInt(estoqueStr, 10),
      descricao: descricao.trim(),
    };

    if (productToEdit) {
      onSubmit({
        ...dataPayload,
        id: productToEdit.id
      });
    } else {
      onSubmit(dataPayload);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            id="product-form-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {productToEdit ? 'Modifique os campos abaixo para atualizar' : 'Insira as informações do novo eletrônico'}
                  </p>
                </div>
              </div>
              <button
                id="close-form-btn"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                aria-label="Fechar formulário"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-slate-400" /> Nome do Produto
                </label>
                <input
                  id="input-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: MacBook Air M2 13-inch"
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm shadow-sm transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                    errors.nome ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
                  }`}
                />
                {errors.nome && (
                  <p id="error-nome" className="mt-1 text-xs font-medium text-red-600">{errors.nome}</p>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-slate-400" /> Categoria
                </label>
                <div className="space-y-2">
                  <input
                    id="input-categoria"
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex: Notebooks, Smartphones..."
                    className={`w-full rounded-lg border px-3.5 py-2 text-sm shadow-sm transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                      errors.categoria ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
                    }`}
                  />
                  {/* Quick selectors */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoria(cat)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                          categoria.toLowerCase() === cat.toLowerCase()
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {errors.categoria && (
                  <p id="error-categoria" className="mt-1 text-xs font-medium text-red-600">{errors.categoria}</p>
                )}
              </div>

              {/* Preço e Estoque Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Preço */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-slate-400" /> Preço (R$)
                  </label>
                  <input
                    id="input-preco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoStr}
                    onChange={(e) => setPrecoStr(e.target.value)}
                    placeholder="2500.00"
                    className={`w-full rounded-lg border px-3.5 py-2 text-sm shadow-sm transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                      errors.preco ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
                    }`}
                  />
                  {errors.preco && (
                    <p id="error-preco" className="mt-1 text-xs font-medium text-red-600">{errors.preco}</p>
                  )}
                </div>

                {/* Estoque */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-slate-400" /> Estoque (unid)
                  </label>
                  <input
                    id="input-estoque"
                    type="number"
                    min="0"
                    value={estoqueStr}
                    onChange={(e) => setEstoqueStr(e.target.value)}
                    placeholder="15"
                    className={`w-full rounded-lg border px-3.5 py-2 text-sm shadow-sm transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                      errors.estoque ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
                    }`}
                  />
                  {errors.estoque && (
                    <p id="error-estoque" className="mt-1 text-xs font-medium text-red-600">{errors.estoque}</p>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" /> Descrição
                </label>
                <textarea
                  id="input-descricao"
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes sobre processador, RAM, armazenamento, cor, etc."
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm shadow-sm transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                    errors.descricao ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
                  }`}
                />
                {errors.descricao && (
                  <p id="error-descricao" className="mt-1 text-xs font-medium text-red-600">{errors.descricao}</p>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                id="cancel-form-btn"
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer transition"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                id="save-product-btn"
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Gravando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {productToEdit ? 'Atualizar' : 'Cadastrar'}
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
