import React, { useState, useEffect } from 'react';
import { Language, PostItem } from '../types';
import { translations, categoriesMap } from '../i18n/translations';
import {
  fetchBloggerFeedPreview,
  executeBloggerImport,
  BloggerPreviewItem,
  BloggerPreviewResponse,
} from '../lib/api';
import {
  Globe,
  Rss,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Filter,
  Sparkles,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag,
  User,
  ShieldCheck,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface Props {
  lang: Language;
  onRefreshData: () => Promise<void>;
  existingPosts: PostItem[];
}

export const BloggerImportSection: React.FC<Props> = ({
  lang,
  onRefreshData,
  existingPosts,
}) => {
  const t = translations[lang];

  // Config State
  const [feedUrl, setFeedUrl] = useState('https://story-today.in');
  const [maxResults, setMaxResults] = useState<number>(25);
  const [startIndex, setStartIndex] = useState<number>(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [skipExisting, setSkipExisting] = useState<boolean>(true);
  const [authorOverride, setAuthorOverride] = useState<string>('');
  const [categoryOverride, setCategoryOverride] = useState<string>('auto');

  // Preview Data State
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<BloggerPreviewResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Execution State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    type: 'success' | 'error';
    message: string;
    importedCount?: number;
    skippedCount?: number;
  } | null>(null);

  // Filter in preview list
  const [searchTerm, setSearchTerm] = useState('');

  // Initial fetch on mount
  useEffect(() => {
    handleFetchPreview(1);
  }, []);

  const handleFetchPreview = async (newStartIndex = startIndex) => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    setImportResult(null);

    try {
      const res = await fetchBloggerFeedPreview({
        feedUrl,
        startIndex: newStartIndex,
        maxResults,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });

      if (res.success) {
        setPreviewData(res);
        setStartIndex(res.startIndex);
        // Default select all items that are NOT already imported
        const newSelected = new Set<string>();
        res.items.forEach((item) => {
          if (!item.isAlreadyImported) {
            newSelected.add(item.bloggerId);
          }
        });
        setSelectedIds(newSelected);
      } else {
        setPreviewError(res.error || 'Failed to fetch Blogger feed from story-today.in');
      }
    } catch (err: any) {
      setPreviewError(err?.message || 'Network error fetching Blogger feed');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const toggleSelectAll = () => {
    if (!previewData) return;
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set<string>();
      filteredItems.forEach((item) => newSelected.add(item.bloggerId));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelectItem = (bloggerId: string) => {
    const next = new Set(selectedIds);
    if (next.has(bloggerId)) {
      next.delete(bloggerId);
    } else {
      next.add(bloggerId);
    }
    setSelectedIds(next);
  };

  const handleExecuteImportSelected = async () => {
    if (!previewData || selectedIds.size === 0) return;

    const itemsToImport = previewData.items.filter((item) => selectedIds.has(item.bloggerId));
    if (itemsToImport.length === 0) return;

    setIsImporting(true);
    setImportProgress(`Importing ${itemsToImport.length} selected articles into cloud database...`);
    setImportResult(null);

    try {
      const res = await executeBloggerImport({
        feedUrl,
        mode: 'selected',
        selectedArticles: itemsToImport,
        autoApprove,
        skipExisting,
        authorNameOverride: authorOverride.trim() || undefined,
        categoryOverride: categoryOverride !== 'auto' ? categoryOverride : undefined,
      });

      if (res.success) {
        setImportResult({
          type: 'success',
          message: `Successfully imported ${res.importedCount} articles permanently! (${res.skippedCount} duplicates skipped).`,
          importedCount: res.importedCount,
          skippedCount: res.skippedCount,
        });

        // Trigger parent refresh to update live feed
        await onRefreshData();

        // Refresh preview to mark imported items
        await handleFetchPreview(startIndex);
      } else {
        setImportResult({
          type: 'error',
          message: res.error || 'Failed to import selected articles',
        });
      }
    } catch (err: any) {
      setImportResult({
        type: 'error',
        message: err?.message || 'Network error during article import',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleExecuteImportBatch = async () => {
    setIsImporting(true);
    setImportProgress(`Batch importing ${maxResults} articles directly from story-today.in...`);
    setImportResult(null);

    try {
      const res = await executeBloggerImport({
        feedUrl,
        mode: 'batch',
        batchSize: maxResults,
        startIndex,
        autoApprove,
        skipExisting,
        authorNameOverride: authorOverride.trim() || undefined,
        categoryOverride: categoryOverride !== 'auto' ? categoryOverride : undefined,
      });

      if (res.success) {
        setImportResult({
          type: 'success',
          message: `Successfully imported ${res.importedCount} articles from story-today.in! (${res.skippedCount} duplicates skipped).`,
          importedCount: res.importedCount,
          skippedCount: res.skippedCount,
        });

        await onRefreshData();
        await handleFetchPreview(startIndex);
      } else {
        setImportResult({
          type: 'error',
          message: res.error || 'Failed to batch import articles',
        });
      }
    } catch (err: any) {
      setImportResult({
        type: 'error',
        message: err?.message || 'Network error during batch import',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Filtered items in current preview view
  const filteredItems = (previewData?.items || []).filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.categories.some((c) => c.toLowerCase().includes(q))
    );
  });

  const totalAvailable = previewData?.totalAvailable || 0;
  const currentPage = Math.floor((startIndex - 1) / maxResults) + 1;
  const totalPages = Math.ceil(totalAvailable / maxResults) || 1;

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="p-4 rounded-xl bg-linear-to-r from-[#004D40]/10 via-[#004D40]/5 to-transparent border border-[#004D40]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#004D40] text-white rounded-lg shadow-xs shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <span>Blogger Feed Importer</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-bold bg-[#004D40] text-white rounded-full">
                story-today.in
              </span>
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Easily import articles, images, and categories from your existing Blogger website (
              <a
                href="https://story-today.in"
                target="_blank"
                rel="noreferrer"
                className="text-[#004D40] font-semibold underline hover:text-[#00382E]"
              >
                https://story-today.in
              </a>
              ) into this application.
            </p>
          </div>
        </div>

        {totalAvailable > 0 && (
          <div className="shrink-0 bg-white px-3.5 py-2 rounded-lg border border-[#004D40]/30 shadow-xs flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#004D40]" />
            <div className="text-xs">
              <span className="font-bold text-[#004D40] font-mono">{totalAvailable}</span>
              <span className="text-gray-500 ml-1">articles found in archive</span>
            </div>
          </div>
        )}
      </div>

      {/* Import Configuration Controls */}
      <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
            <Rss className="w-4 h-4 text-[#004D40]" />
            <span>Feed & Import Settings</span>
          </h4>
          <span className="text-[11px] text-gray-500">Blogger JSON / RSS Endpoint</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Feed URL */}
          <div className="sm:col-span-6 space-y-1">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Website / Feed URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://story-today.in"
                className="w-full text-xs p-2.5 pr-8 rounded-lg border border-[#E0E0E0] bg-white focus:outline-hidden focus:border-[#004D40] font-mono"
              />
              <Globe className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Results per Batch */}
          <div className="sm:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Articles per Batch
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0E0] bg-white focus:outline-hidden focus:border-[#004D40]"
            >
              <option value="10">10 articles</option>
              <option value="25">25 articles</option>
              <option value="50">50 articles</option>
              <option value="100">100 articles</option>
            </select>
          </div>

          {/* Category Filter on Blogger */}
          <div className="sm:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Blogger Tag Filter
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setStartIndex(1);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0E0] bg-white focus:outline-hidden focus:border-[#004D40]"
            >
              <option value="all">All Categories</option>
              <option value="Geo-Politics">Geo-Politics</option>
              <option value="Health">Health & Wellness</option>
              <option value="Press Release (Health)">Press Release (Health)</option>
              <option value="Press Release">Press Release</option>
              <option value="Education/ career">Education & Career</option>
              <option value="Mental Health">Mental Health</option>
              <option value="Natural Disaster">Natural Disaster & Environment</option>
              <option value="Travels & Tourism">Travels & Tourism</option>
            </select>
          </div>
        </div>

        {/* Toggles & Overrides */}
        <div className="pt-2 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-[#E0E0E0] hover:bg-gray-50">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="rounded text-[#004D40] focus:ring-0"
            />
            <span className="font-semibold text-gray-800">Auto-Approve & Publish Live</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-[#E0E0E0] hover:bg-gray-50">
            <input
              type="checkbox"
              checked={skipExisting}
              onChange={(e) => setSkipExisting(e.target.checked)}
              className="rounded text-[#004D40] focus:ring-0"
            />
            <span className="font-semibold text-gray-800">Skip Existing Duplicates</span>
          </label>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              Category Mapping
            </label>
            <select
              value={categoryOverride}
              onChange={(e) => setCategoryOverride(e.target.value)}
              className="w-full text-xs p-2 rounded border border-[#E0E0E0] bg-white"
            >
              <option value="auto">Auto-Detect from Blogger Tag</option>
              {Object.entries(categoriesMap).map(([key, cat]) => (
                <option key={key} value={key}>
                  Force: {cat.en} ({cat.hi})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              Author Name Override
            </label>
            <input
              type="text"
              value={authorOverride}
              onChange={(e) => setAuthorOverride(e.target.value)}
              placeholder="Default: P.K. Sharma"
              className="w-full text-xs p-2 rounded border border-[#E0E0E0] bg-white"
            />
          </div>
        </div>

        {/* Action Controls & Feed Fetch */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={isLoadingPreview || isImporting}
            onClick={() => handleFetchPreview(startIndex)}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#004D40] border border-[#004D40] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
            <span>{isLoadingPreview ? 'Fetching Feed...' : 'Fetch / Refresh Feed'}</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isImporting || isLoadingPreview || selectedIds.size === 0}
              onClick={handleExecuteImportSelected}
              className="px-4 py-2 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import Selected ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              disabled={isImporting || isLoadingPreview}
              onClick={handleExecuteImportBatch}
              className="px-4 py-2 bg-[#800000] hover:bg-[#600000] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>One-Click Import Latest {maxResults}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Feedback Messages */}
      {importProgress && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 text-xs font-medium animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
          <span>{importProgress}</span>
        </div>
      )}

      {importResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            importResult.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {importResult.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h5 className="font-bold uppercase tracking-wider">
              {importResult.type === 'success' ? 'Import Completed Successfully' : 'Import Notice'}
            </h5>
            <p>{importResult.message}</p>
          </div>
        </div>
      )}

      {previewError && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-wider">Feed Fetch Error</p>
            <p>{previewError}</p>
          </div>
        </div>
      )}

      {/* Preview Section Header & Filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
              Articles on story-today.in ({filteredItems.length} listed)
            </h4>
            {filteredItems.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[11px] font-bold text-[#004D40] hover:underline flex items-center gap-1 ml-2 cursor-pointer"
              >
                {selectedIds.size === filteredItems.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Select All ({filteredItems.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter articles in list..."
                className="text-xs pl-7 pr-3 py-1.5 rounded-lg border border-[#E0E0E0] bg-white focus:outline-hidden focus:border-[#004D40] w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  disabled={startIndex <= 1 || isLoadingPreview}
                  onClick={() => handleFetchPreview(Math.max(1, startIndex - maxResults))}
                  className="p-1.5 rounded border border-[#E0E0E0] bg-white hover:bg-gray-100 disabled:opacity-40"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-700" />
                </button>
                <span className="px-2 font-mono text-[11px] text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={startIndex + maxResults > totalAvailable || isLoadingPreview}
                  onClick={() => handleFetchPreview(startIndex + maxResults)}
                  className="p-1.5 rounded border border-[#E0E0E0] bg-white hover:bg-gray-100 disabled:opacity-40"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Article Cards Grid */}
        {isLoadingPreview ? (
          <div className="p-12 text-center text-xs text-gray-500 space-y-3 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#004D40] mx-auto" />
            <p className="font-semibold text-gray-700">Connecting to story-today.in Blogger Feed...</p>
            <p className="text-[11px]">Fetching original articles, high-res images, and categories.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
            <AlertCircle className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="font-bold text-gray-700">No articles found in this batch</p>
            <p className="text-[11px] mt-1">Try clicking "Fetch / Refresh Feed" or changing category filter.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.bloggerId);
              const mappedCategoryLabel =
                categoriesMap[item.mappedCategory]?.en || item.mappedCategory;

              return (
                <div
                  key={item.bloggerId}
                  onClick={() => toggleSelectItem(item.bloggerId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#E0F2F1]/30 border-[#004D40] shadow-xs'
                      : 'bg-white border-[#E0E0E0] hover:border-gray-300'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.bloggerId)}
                      className="rounded text-[#004D40] focus:ring-0 cursor-pointer w-4 h-4"
                    />
                  </div>

                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                      <Rss className="w-5 h-5" />
                    </div>
                  )}

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#004D40] text-white">
                        {mappedCategoryLabel}
                      </span>
                      {item.categories.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 text-[9px] rounded bg-gray-100 text-gray-600 border border-gray-200"
                        >
                          {c}
                        </span>
                      ))}

                      {item.isAlreadyImported && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 ml-auto">
                          <Check className="w-3 h-3" />
                          <span>Already In App</span>
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs sm:text-sm font-bold text-[#1A1A1A] line-clamp-2 leading-snug">
                      {item.title}
                    </h5>

                    {item.summary && (
                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {item.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {new Date(item.published).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      {item.originalLink && (
                        <a
                          href={item.originalLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#004D40] font-semibold hover:underline flex items-center gap-1 ml-auto"
                        >
                          <span>View on story-today.in</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
