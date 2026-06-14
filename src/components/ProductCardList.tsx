/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Edit2, Trash2, Layers, Cpu, Compass, ShoppingCart, Tag } from 'lucide-react';
import { Produto } from '../types';

interface ProductCardListProps {
  products: Produto[];
  onEdit: (product: Produto) => void;
  onDelete: (product: Produto) => void;
}

export default function ProductCardList({ products, onEdit, onDelete }: ProductCardListProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
          Esgotado
        </span>
      );
    }
    if (stock <= 3) {
      return (
        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600">
          Urgente: {stock} rest.
        </span>
      );
    }
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
        Stock: {stock} unid.
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="product-cards-grid">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-300 relative group overflow-hidden"
          id={`product-card-${product.id}`}
        >
          {/* Subtle top decoration for high-end product lists */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

          {/* Header ID/Category */}
          <div className="flex justify-between items-center mb-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              <Layers className="h-3 w-3" />
              {product.categoria}
            </span>
            <span className="font-mono text-[10px] text-slate-400 select-all" title="Clique duas vezes para copiar o ID completo">
              ID: {product.id.substring(0, 8)}...
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex-1">
            <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition mb-1.5 line-clamp-1">
              {product.nome}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 min-h-[54px]">
              {product.descricao}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 my-3.5 pt-3.5 flex items-center justify-between">
            {/* Price */}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Preço à vista</p>
              <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(product.preco)}</p>
            </div>

            {/* Stock status */}
            <div className="text-right">
              {getStockLabel(product.estoque)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              id={`btn-edit-card-${product.id}`}
              onClick={() => onEdit(product)}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer shadow-2xs"
            >
              <Edit2 className="h-3 w-3" />
              Editar
            </button>
            <button
              id={`btn-delete-card-${product.id}`}
              onClick={() => onDelete(product)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition cursor-pointer shadow-2xs"
              title="Excluir produto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
