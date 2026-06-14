/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Edit2, Trash2, Layers } from 'lucide-react';
import { Produto } from '../types';

interface ProductTableProps {
  products: Produto[];
  onEdit: (product: Produto) => void;
  onDelete: (product: Produto) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
          Sem estoque
        </span>
      );
    }
    if (stock <= 3) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
          Urgente: {stock} rest.
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        {stock} em estoque
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs" id="product-table-wrapper">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm" id="product-table">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">ID / Identificador</th>
            <th className="px-6 py-4">Produto</th>
            <th className="px-6 py-4">Categoria</th>
            <th className="px-6 py-4 text-right">Preço</th>
            <th className="px-6 py-4 text-center">Quantidade</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {products.map((product) => (
            <tr
              key={product.id}
              className="hover:bg-slate-50/75 transition duration-150 group"
              id={`product-row-${product.id}`}
            >
              {/* ID */}
              <td className="px-6 py-4">
                <span className="font-mono text-xs font-medium text-slate-400 select-all" title={String(product.id)}>
                  {String(product.id).substring(0, 8)}...
                </span>
              </td>

              {/* Nome */}
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                  {product.nome}
                </div>
              </td>

              {/* Categoria */}
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  <Layers className="h-3 w-3 text-slate-400" />
                  {product.categoria}
                </span>
              </td>

              {/* Preço */}
              <td className="px-6 py-4 text-right font-semibold text-slate-900 font-mono">
                {formatCurrency(product.preco)}
              </td>

              {/* Estoque */}
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {getStockBadge(product.estoque)}
              </td>

              {/* Descrição */}
              <td className="px-6 py-4 max-w-xs">
                <p className="truncate text-xs text-slate-500" title={product.descricao}>
                  {product.descricao}
                </p>
              </td>

              {/* Ações */}
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    id={`btn-edit-table-${product.id}`}
                    onClick={() => onEdit(product)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 shadow-2xs transition cursor-pointer"
                    title="Editar Produto"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    id={`btn-delete-table-${product.id}`}
                    onClick={() => onDelete(product)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 shadow-2xs transition cursor-pointer"
                    title="Excluir Produto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}