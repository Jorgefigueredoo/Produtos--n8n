/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  RotateCw, 
  List, 
  Grid2X2, 
  Search,
  AlertCircle,
  Database,
  Laptop,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Imported Types & Components
import { Produto, NovoProdutoInput } from './types';
import ProductTable from './components/ProductTable';
import ProductCardList from './components/ProductCardList';
import ProductFormModal from './components/ProductFormModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import DashboardCharts from './components/DashboardCharts';

// Dedicated base URL specified in requirements
const API_BASE_URL = "http://localhost:5678/webhook";

export default function App() {
  // Core Products State
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [silentLoading, setSilentLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Connection and Polling States
  const [isApiOnline, setIsApiOnline] = useState<boolean>(true);
  const [secondsToRefetch, setSecondsToRefetch] = useState<number>(5);
  const [autoRefreshActive, setAutoRefreshActive] = useState<boolean>(true);

  // Layout View Mode (Cards vs. Table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('nome');

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Produto | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);

  // Deletion Confirmation Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Produto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch function
  const fetchProdutos = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setSilentLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/produtos`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Safety check for array returned
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && typeof data === 'object' && Array.isArray((data as any).produtos)) {
        setProducts((data as any).produtos);
      } else {
        // If data is parsed but not an array, default to empty
        setProducts([]);
        console.warn("Retorno da API não é um array padrão de produtos", data);
      }
      
      setErrorMsg(null);
      setIsApiOnline(true);
    } catch (err: any) {
      console.error("Erro ao carregar produtos do webhook:", err);
      setIsApiOnline(false);
      setErrorMsg(
        `Impossível conectar à API externa em ${API_BASE_URL}/produtos. ` +
        `Verifique se o seu servidor local (n8n, Mock Server, etc.) está rodando na porta correta.`
      );
    } finally {
      setLoading(false);
      setSilentLoading(false);
    }
  }, []);

  // Polling Effect (Seconds ticker)
  useEffect(() => {
    if (!autoRefreshActive) return;

    const timer = setInterval(() => {
      setSecondsToRefetch((prev) => {
        if (prev <= 1) {
          // Trigger the background update
          fetchProdutos(true);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshActive, fetchProdutos]);

  // Main Effect: initial fetch on mount
  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Reset Countdown helper
  const resetCountdown = () => {
    setSecondsToRefetch(5);
  };

  // Actions: CREATE & UPDATE Product
  const handleFormSubmit = async (data: NovoProdutoInput | Produto) => {
    setIsFormSubmitting(true);
    resetCountdown();
    try {
      const isEditing = 'id' in data;
      const endpoint = isEditing 
        ? `${API_BASE_URL}/produtos/editar` 
        : `${API_BASE_URL}/produtos/criar`;

      // Payload mapping
      // editing needs: {id, nome, categoria, preco, estoque, descricao}
      // creating needs: {nome, categoria, preco, estoque, descricao}
      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Falha ao salvar produto (${response.status})`);
      }

      // Success! Close form, reload products list, sync state
      setIsFormOpen(false);
      setProductToEdit(null);
      await fetchProdutos();
    } catch (err: any) {
      alert(`Falha ao salvar produto na API: ${err.message || err}`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Actions: DELETE Product
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    resetCountdown();
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/deletar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productToDelete.id }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao deletar produto (${response.status})`);
      }

      setIsDeleteOpen(false);
      setProductToDelete(null);
      await fetchProdutos();
    } catch (err: any) {
      alert(`Falha ao excluir produto na API: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Initiators for forms/dialogs
  const handleAddNewClick = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Produto) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Produto) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  // Extract unique categories for quick header filters
  const categoriesList = React.useMemo(() => {
    const list = new Set(products.map(p => p.categoria));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Filter & Sort core computations
  const processedProducts = React.useMemo(() => {
    let result = [...products];

    // Search query match (fuzzy) — guarded against missing/non-string fields
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matches = (value: unknown) =>
        String(value ?? '').toLowerCase().includes(query);
      result = result.filter(
        p =>
          matches(p.nome) ||
          matches(p.categoria) ||
          matches(p.descricao) ||
          matches(p.id)
      );
    }

    // Category selection match
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.categoria === selectedCategory);
    }

    // Sorting definition — guarded against missing/non-string/non-numeric fields
    result.sort((a, b) => {
      if (sortBy === 'nome') {
        return String(a.nome ?? '').localeCompare(String(b.nome ?? ''));
      }
      if (sortBy === 'categoria') {
        return String(a.categoria ?? '').localeCompare(String(b.categoria ?? ''));
      }
      if (sortBy === 'preco-cres') {
        return (Number(a.preco) || 0) - (Number(b.preco) || 0);
      }
      if (sortBy === 'preco-decres') {
        return (Number(b.preco) || 0) - (Number(a.preco) || 0);
      }
      if (sortBy === 'estoque-cres') {
        return (Number(a.estoque) || 0) - (Number(b.estoque) || 0);
      }
      if (sortBy === 'estoque-decres') {
        return (Number(b.estoque) || 0) - (Number(a.estoque) || 0);
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20" id="applet-container">
      
      {/* Dynamic Network / Polling banner if manual API error exists */}
      <AnimatePresence>
        {!isApiOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white border-b border-amber-600 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 animate-pulse text-white shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold">Modo Offline Local:</span> {errorMsg}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-retry-con"
                  onClick={() => fetchProdutos(false)}
                  className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 text-xs font-semibold text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Conectar Novamente
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Sub-Header with metadata stats and sync */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Laptop className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Catálogo de Eletrônicos</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Controle de estoque, preços e especificações</p>
            </div>
          </div>

          {/* Autorefresh & Live monitoring controller */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Live syncing status indicator */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 font-medium text-slate-600 shadow-2xs">
              <span className={`h-2 w-2 rounded-full ${isApiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-slate-500">API:</span>
              <span className="font-mono text-slate-700 select-all font-semibold max-w-[120px] truncate" title={API_BASE_URL}>
                {API_BASE_URL.replace("http://", "")}
              </span>
            </div>

            {/* Polling countdown pill */}
            <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-full px-3 py-1">
              <button
                id="btn-toggle-refresh"
                onClick={() => setAutoRefreshActive(!autoRefreshActive)}
                className="hover:text-indigo-700 text-indigo-600 font-semibold cursor-pointer transition flex items-center gap-1.5"
                title={autoRefreshActive ? "Pausar atualização automática" : "Retomar atualização automática"}
              >
                <div className={`relative ${autoRefreshActive ? 'animate-spin' : ''} h-3.5 w-3.5`}>
                  <RotateCw className="h-3.5 w-3.5" />
                </div>
                <span>
                  {autoRefreshActive ? `Sincronizando em ${secondsToRefetch}s` : 'Sincronização Pausada'}
                </span>
              </button>
            </div>

            {/* Quick manual refresh */}
            <button
              id="btn-manual-sync"
              disabled={loading || silentLoading}
              onClick={() => {
                fetchProdutos();
                resetCountdown();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition cursor-pointer disabled:opacity-50"
              title="Sincronizar dados agora"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || silentLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main body viewport */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* KPI Dashboard with Recharts visualizations */}
        <DashboardCharts products={products} />

        {/* Catalog Control Area: Filters, View choice, Add Product button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs" id="controls-panel">
          
          {/* Quick Search and Sorting filter bar */}
          <div className="flex-1 flex flex-wrap items-center gap-3">
            {/* Realtime Search bar */}
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                aria-label="Buscar produto por nome, categoria ou id"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eletrônico..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm shadow-2xs transition focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Category selection selector */}
            <div className="w-full sm:w-auto">
              <label htmlFor="category-select" className="sr-only">Filtrar por Categoria</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="All">Todas as Categorias</option>
                {categoriesList.filter(c => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Generic Sorting selector */}
            <div className="w-full sm:w-auto">
              <label htmlFor="sort-select" className="sr-only">Ordenar Por</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="nome">Ordenar por Nome (A-Z)</option>
                <option value="preco-cres">Preço: Menor ao Maior</option>
                <option value="preco-decres">Preço: Maior ao Menor</option>
                <option value="estoque-cres">Estoque: Menor ao Maior</option>
                <option value="estoque-decres">Estoque: Maior ao Menor</option>
              </select>
            </div>
          </div>

          {/* Visual representations (List or Card view mode) and Action launcher */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
            {/* View Grid/Table switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-3xs">
              <button
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`rounded-md p-1.5 transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visualização em tabela"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                id="btn-view-cards"
                onClick={() => setViewMode('cards')}
                className={`rounded-md p-1.5 transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visualização em cards"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
            </div>

            {/* Launch register modal */}
            <button
              id="btn-add-product"
              onClick={handleAddNewClick}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer hover:shadow-indigo-500/10"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Produto
            </button>
          </div>
        </div>

        {/* View Section */}
        {loading ? (
          /* High quality loading skeleton with table pattern */
          <div className="space-y-4 py-12" id="canvas-loading">
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-slate-500 font-medium text-sm">Carregando catálogo de eletrônicos...</span>
            </div>
            <div className="mx-auto max-w-md bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : processedProducts.length === 0 ? (
          /* Super empty screen design */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center shadow-3xs"
            id="empty-list-block"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 mb-4">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Nenhum eletrônico encontrado</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 leading-relaxed">
              {products.length === 0 
                ? 'Nenhum produto foi cadastrado até o momento ou a API retornou vazia.' 
                : 'Não encontramos resultados para os filtros de pesquisa atuais.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {products.length === 0 ? (
                <button
                  id="btn-empty-add"
                  onClick={handleAddNewClick}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Produto
                </button>
              ) : (
                <button
                  id="btn-empty-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* Active View representation list */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
            id="product-list-container"
          >
            {/* Tiny silent indicator during background refetches to keep user informed non-invasively */}
            <AnimatePresence>
              {silentLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 -top-6 flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5"
                >
                  <RotateCw className="h-3 w-3 animate-spin" />
                  Atualizando...
                </motion.div>
              )}
            </AnimatePresence>

            {viewMode === 'table' ? (
              <ProductTable 
                products={processedProducts}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ) : (
              <ProductCardList 
                products={processedProducts}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            )}

            {/* Floating result count identifier */}
            <p className="mt-4 text-xs font-semibold text-slate-400 text-right">
              Exibindo {processedProducts.length} de {products.length} produtos cadastrados
            </p>
          </motion.div>
        )}
      </main>

      {/* Register / Edit Product Modal Form */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setProductToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        productToEdit={productToEdit}
        isSubmitting={isFormSubmitting}
      />

      {/* Delete Confirmation Alert Trigger */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        productToConfirm={productToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
