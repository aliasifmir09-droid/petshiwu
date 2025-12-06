import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Upload, X, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface CSVImportProps {
  onClose: () => void;
  onImportComplete?: () => void;
}

const CSVImport = ({ onClose, onImportComplete }: CSVImportProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const importMutation = useMutation({
    mutationFn: (file: File) => adminService.importProductsFromCSV(file),
    onSuccess: async (data) => {
      setImportResult(data);
      
      // Wait a moment for backend to fully process the imports
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Aggressively invalidate and refetch all product queries
      queryClient.removeQueries({ queryKey: ['products'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['products'], exact: false });
      
      showToast(`Successfully imported ${data.data?.succeeded || 0} products!`, 'success');
      
      // Call onImportComplete callback if provided (after a short delay to ensure queries are ready)
      if (onImportComplete) {
        setTimeout(() => {
          onImportComplete();
        }, 300);
      }
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to import products', 'error');
    }
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: () => adminService.downloadCSVTemplate(),
    onSuccess: () => {
      showToast('Template downloaded successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to download template', 'error');
    }
  });

  const handleFileSelect = (file: File) => {
    if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      showToast('Please select a valid CSV file', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      showToast('Please select a CSV file', 'error');
      return;
    }
    importMutation.mutate(selectedFile);
  };

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Import Products from CSV</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Download Template Section - Prominent */}
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="text-blue-600" size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">📥 Download CSV Template</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Get a ready-to-use template with example data and detailed instructions. 
                    This will help you format your CSV file correctly for bulk product import.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                    <li>Includes all required and optional columns</li>
                    <li>Multiple example rows for different pet types</li>
                    <li>Detailed instructions in the CSV file</li>
                    <li>Ready to fill in with your product data</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                disabled={downloadTemplateMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
              >
                <Download size={20} />
                {downloadTemplateMutation.isPending ? 'Downloading...' : 'Download Template'}
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {!selectedFile ? (
              <>
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600 mb-2">
                  Drag and drop your CSV file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Supported format: CSV (Comma Separated Values)
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <FileText className="text-green-600" size={32} />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Instructions and Field Guide */}
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="text-yellow-600" size={18} />
                Required CSV Columns:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div><strong>name</strong> - Product name (required)</div>
                <div><strong>description</strong> - Full product description (required)</div>
                <div><strong>brand</strong> - Brand name (required)</div>
                <div><strong>category</strong> - Category name or path like &quot;Dog &gt; Food &gt; Dry Food&quot; (required)</div>
                <div><strong>basePrice</strong> - Base price in numbers, e.g., 29.99 (required)</div>
                <div><strong>petType</strong> - Use: dog, cat, bird, fish, small-pet, reptile (required)</div>
                <div><strong>images</strong> - Comma-separated URLs, e.g., url1.jpg,url2.jpg (required)</div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={18} />
                Optional Columns:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div><strong>shortDescription</strong> - Brief product summary</div>
                <div><strong>compareAtPrice</strong> - Original/compare price</div>
                <div><strong>tags</strong> - Comma-separated, e.g., premium,organic</div>
                <div><strong>features</strong> - Comma-separated, e.g., durable,waterproof</div>
                <div><strong>ingredients</strong> - Product ingredients list</div>
                <div><strong>isActive</strong> - true or false (default: true)</div>
                <div><strong>isFeatured</strong> - true or false (default: false)</div>
                <div><strong>inStock</strong> - true or false (default: true)</div>
                <div><strong>stock</strong> - Total stock quantity (number)</div>
                <div><strong>variantSize</strong> - Size for variant (e.g., 5kg, Small)</div>
                <div><strong>variantPrice</strong> - Price for this variant</div>
                <div><strong>variantStock</strong> - Stock for this variant</div>
                <div><strong>variantSku</strong> - SKU for this variant</div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-gray-800 mb-2">💡 Tips:</p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Download the template above to see complete examples</li>
                <li>Remove comment lines (starting with #) from the template before importing</li>
                <li>Category: Use simple name (e.g., &quot;Dog Food&quot;) or hierarchical path (e.g., &quot;Dog &gt; Food &gt; Dry Food&quot;)</li>
                <li>Hierarchical paths automatically create missing parent categories</li>
                <li>Category names are case-insensitive</li>
                <li>Use commas to separate multiple images, tags, or features</li>
                <li>For products without variants, leave variant columns empty</li>
                <li>Boolean values (isActive, isFeatured, etc.) should be "true" or "false"</li>
              </ul>
            </div>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className={`mt-6 p-4 rounded-lg border ${
              importResult.data.failed > 0
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start gap-3">
                {importResult.data.failed > 0 ? (
                  <AlertCircle className="text-yellow-600 mt-1" size={20} />
                ) : (
                  <CheckCircle className="text-green-600 mt-1" size={20} />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-2">
                    {importResult.message}
                  </p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>Total: {importResult.data.total}</p>
                    <p className="text-green-600">Succeeded: {importResult.data.succeeded}</p>
                    {importResult.data.failed > 0 && (
                      <p className="text-red-600">Failed: {importResult.data.failed}</p>
                    )}
                  </div>
                  {importResult.data.errors && importResult.data.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <p className="font-semibold text-sm text-gray-800 mb-1">Errors:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {importResult.data.errors.slice(0, 10).map((error: any, idx: number) => (
                          <li key={idx}>
                            Row {error.row}: {error.error}
                          </li>
                        ))}
                        {importResult.data.errors.length > 10 && (
                          <li className="text-gray-500">
                            ... and {importResult.data.errors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Import Products
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImport;

