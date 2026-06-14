/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  descricao: string;
}

export type NovoProdutoInput = Omit<Produto, 'id'>;
