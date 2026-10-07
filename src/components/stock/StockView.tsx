import React, { useState, useMemo } from 'react';
import { Product, ShopSettings } from '../../types';
import { formatCurrency } from '../../services/financials';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  X,
  TrendingUp,
  Boxes
} from 'lucide-react';

interface StockViewProps {
  products: Product[];
  settings: ShopSettings;
  onUpdateProducts: (products: Product[]) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  settings,
  onUpdateProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Alimentation');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formThreshold, setFormThreshold] = useState<number>(5);
  const [formUnit, setFormUnit] = useState('pièce');

  // Quick Restock form
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockNewPurchasePrice, setRestockNewPurchasePrice] = useState<number>(0);

  // Stats
  const totalStockItemsCount = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stockQuantity, 0);
  }, [products]);

  const totalStockCostValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0);
  }, [products]);

  const totalPotentialSalesValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stockQuantity * p.sellingPrice), 0);
  }, [products]);

  const potentialProfitValue = totalPotentialSalesValue - totalStockCostValue;

  // Filtered
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterType === 'out') return matchesSearch && p.stockQuantity === 0;
      if (filterType === 'low') return matchesSearch && p.stockQuantity > 0 && p.stockQuantity <= p.minAlertThreshold;
      return matchesSearch;
    });
  }, [products, searchQuery, filterType]);

  // Open add/edit modal
  const handleOpenAddModal = (existing?: Product) => {
    if (existing) {
      setTargetProduct(existing);
      setFormName(existing.name);
      setFormCategory(existing.category);
      setFormPurchasePrice(existing.purchasePrice);
      setFormSellingPrice(existing.sellingPrice);
      setFormQuantity(existing.stockQuantity);
      setFormThreshold(existing.minAlertThreshold);
      setFormUnit(existing.unit);
    } else {
      setTargetProduct(null);
      setFormName('');
      setFormCategory('Alimentation');
      setFormPurchasePrice(1000);
      setFormSellingPrice(1300);
      setFormQuantity(10);
      setFormThreshold(5);
      setFormUnit('pièce');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (targetProduct) {
      // Edit
      const updated = products.map(p => 
        p.id === targetProduct.id 
          ? {
              ...p,
              name: formName.trim(),
              category: formCategory,
              purchasePrice: Number(formPurchasePrice),
              sellingPrice: Number(formSellingPrice),
              stockQuantity: Number(formQuantity),
              minAlertThreshold: Number(formThreshold),
              unit: formUnit,
            }
          : p
      );
      onUpdateProducts(updated);
    } else {
      // Add
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        purchasePrice: Number(formPurchasePrice),
        sellingPrice: Number(formSellingPrice),
        stockQuantity: Number(formQuantity),
        minAlertThreshold: Number(formThreshold),
        unit: formUnit,
      };
      onUpdateProducts([...products, newProd]);
    }

    setIsAddModalOpen(false);
  };

  // Open restock modal
  const handleOpenRestockModal = (product: Product) => {
    setTargetProduct(product);
    setRestockQty(10);
    setRestockNewPurchasePrice(product.purchasePrice);
    setIsRestockModalOpen(true);
  };

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct || restockQty <= 0) return;

    const updated = products.map(p => {
      if (p.id === targetProduct.id) {
        return {
          ...p,
          stockQuantity: p.stockQuantity + Number(restockQty),
          purchasePrice: restockNewPurchasePrice > 0 ? Number(restockNewPurchasePrice) : p.purchasePrice,
          lastRestockedDate: new Date().toISOString(),
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setIsRestockModalOpen(false);
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    if (confirm("Voulez-vous vraiment retirer cet article du catalogue ?")) {
      onUpdateProducts(products.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="space-y-5 pb-20">
      
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Gestion des Stocks & Inventaire
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Suivi des entrées, des marges unitaires et des seuils de réapprovisionnement.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Article</span>
        </button>
      </div>

      {/* Stock Value KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">Articles Référencés</span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1 font-mono-num">
            {products.length} réf.
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            {totalStockItemsCount} unités en rayon
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">Valeur d'Achat (Coût)</span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1 font-mono-num">
            {formatCurrency(totalStockCostValue, settings.currency)}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Capital immobilisé
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">Valeur Marchande Potentielle</span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1 font-mono-num">
            {formatCurrency(totalPotentialSalesValue, settings.currency)}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Au prix de vente fixé
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">Bénéfice Brut Attendu</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 font-mono-num">
            {formatCurrency(potentialProfitValue, settings.currency)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">
            + {totalStockCostValue > 0 ? ((potentialProfitValue / totalStockCostValue) * 100).toFixed(0) : 0}% de marge globale
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou rayon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterType === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stock Bas</span>
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            Rupture (0)
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-3 text-right">Prix Achat</th>
                <th className="py-3 px-3 text-right">Prix Vente</th>
                <th className="py-3 px-3 text-right">Marge Brute</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-stone-400">
                    Aucun article trouvé pour ce filtre.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const unitMargin = product.sellingPrice - product.purchasePrice;
                  const unitMarginPct = product.sellingPrice > 0 ? (unitMargin / product.sellingPrice) * 100 : 0;
                  const isOut = product.stockQuantity === 0;
                  const isLow = product.stockQuantity > 0 && product.stockQuantity <= product.minAlertThreshold;

                  return (
                    <tr key={product.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        <div>
                          <span>{product.name}</span>
                          <div className="text-[11px] text-stone-500 font-normal flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
                              {product.category}
                            </span>
                            <span>• Unité : {product.unit}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono-num text-stone-600">
                        {formatCurrency(product.purchasePrice, settings.currency)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono-num font-bold text-stone-900">
                        {formatCurrency(product.sellingPrice, settings.currency)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono-num">
                        <span className="font-bold text-emerald-800">
                          +{formatCurrency(unitMargin, settings.currency)}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          ({unitMarginPct.toFixed(0)}%)
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOut
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {product.stockQuantity} {product.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRestockModal(product)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition"
                            title="Ajouter du stock reçu du fournisseur"
                          >
                            + Réappro
                          </button>
                          <button
                            onClick={() => handleOpenAddModal(product)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 sm:p-6 my-auto animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-black text-lg text-stone-900">
                {targetProduct ? "Modifier l'Article" : "Nouvel Article au Catalogue"}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              
              <div>
                <label className="text-xs font-bold text-stone-700">Nom de l'article *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Riz Parfumé Jasmin 5kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700">Rayon / Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  >
                    <option value="Alimentation">Alimentation</option>
                    <option value="Boissons">Boissons</option>
                    <option value="Hygiène & Entretien">Hygiène & Entretien</option>
                    <option value="Quincaillerie">Quincaillerie</option>
                    <option value="Cosmétique">Cosmétique</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700">Unité de mesure</label>
                  <input
                    type="text"
                    placeholder="pièce, sac, kg..."
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700">Prix d'Achat unitaire</label>
                  <input
                    type="number"
                    required
                    value={formPurchasePrice || ''}
                    onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700">Prix de Vente unitaire *</label>
                  <input
                    type="number"
                    required
                    value={formSellingPrice || ''}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono-num font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Instant Margin Preview */}
              <div className="p-2.5 bg-emerald-50 rounded-xl text-xs flex justify-between items-center text-emerald-900 font-bold">
                <span>Marge brute unitaire :</span>
                <span>
                  {formatCurrency(formSellingPrice - formPurchasePrice, settings.currency)} 
                  {' '}({formSellingPrice > 0 ? (((formSellingPrice - formPurchasePrice) / formSellingPrice) * 100).toFixed(0) : 0}%)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700">Quantité en stock</label>
                  <input
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700">Seuil d'alerte rupture</label>
                  <input
                    type="number"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-sm"
                >
                  Enregistrer
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && targetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 sm:p-6 my-auto animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-black text-base text-stone-900">Entrée en Stock</h3>
                <p className="text-xs text-stone-500 truncate">{targetProduct.name}</p>
              </div>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-stone-400 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveRestock} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700">Quantité livrée à ajouter ({targetProduct.unit})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono-num font-bold text-base"
                />
                <div className="text-[11px] text-stone-500 mt-1">
                  Nouveau stock total : {targetProduct.stockQuantity + Number(restockQty)} {targetProduct.unit}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700">Prix d'achat unitaire de ce lot</label>
                <input
                  type="number"
                  value={restockNewPurchasePrice}
                  onChange={(e) => setRestockNewPurchasePrice(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono-num text-sm"
                />
              </div>

              <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-600 flex justify-between">
                <span>Coût total réapprovisionnement :</span>
                <span className="font-bold text-stone-900 font-mono-num">
                  {formatCurrency(restockQty * restockNewPurchasePrice, settings.currency)}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
                >
                  Valider l'Entrée
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
