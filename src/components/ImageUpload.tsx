import { useState, useRef, useEffect } from 'react';
import { storageService } from '../services/storage.service';
import { Upload, X, Loader2, Image as ImageIcon, Link2, FileImage } from 'lucide-react';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  subfolder?: string; // Subcarpeta dentro de MenuQR/{restaurante_id}/ (ej: 'items', 'categorias', 'perfil', 'portada')
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  previewSize?: 'small' | 'medium' | 'large';
  shape?: 'square' | 'circle';
  className?: string;
  allowUrlInput?: boolean; // Permitir ingresar URL manualmente
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  subfolder = 'imagenes',
  label = 'Imagen',
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  maxSizeMB = 5,
  previewSize = 'medium',
  shape = 'square',
  className = '',
  allowUrlInput = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar preview y urlInput cuando cambia value externamente
  useEffect(() => {
    if (value !== preview) {
      setPreview(value || null);
      setUrlInput(value || '');
    }
  }, [value]);

  const sizeClasses = {
    small: 'h-24 w-24',
    medium: 'h-32 w-32',
    large: 'h-48 w-48',
  };

  const shapeClasses = {
    square: 'rounded-lg',
    circle: 'rounded-full',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    if (!accept.split(',').some(type => file.type === type.trim())) {
      setError('Tipo de archivo no permitido. Solo se permiten imágenes.');
      return;
    }

    // Crear preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    try {
      setUploading(true);
      const result = await storageService.uploadImage(file, subfolder);
      onChange(result.url);
      setPreview(result.url);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
      setPreview(value || null);
    } finally {
      setUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    
    // Validar URL básica
    if (url.trim() === '') {
      setPreview(null);
      onChange('');
      setError(null);
      return;
    }

    try {
      new URL(url); // Validar que sea una URL válida
      setPreview(url);
      onChange(url);
      setError(null);
    } catch {
      setError('URL inválida');
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      try {
        new URL(urlInput);
        setPreview(urlInput);
        onChange(urlInput);
        setError(null);
        setInputMode('upload'); // Volver al modo upload después de establecer URL
      } catch {
        setError('URL inválida. Debe ser una URL completa (ej: https://ejemplo.com/imagen.jpg)');
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUrlInput('');
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Preview de la imagen */}
        {preview ? (
          <div className="relative flex-shrink-0">
            <div className={`${sizeClasses[previewSize]} ${shapeClasses[shape]} overflow-hidden border-2 border-gray-200 shadow-sm`}>
              <img
                src={preview}
                alt="Preview"
                className={`w-full h-full object-cover ${shapeClasses[shape]}`}
                onError={() => setPreview(null)}
              />
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Eliminar imagen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className={`${sizeClasses[previewSize]} ${shapeClasses[shape]} border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0`}>
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {/* Controles de subida/URL */}
        <div className="flex-1 w-full sm:w-auto min-w-0 space-y-3">
          {/* Selector de modo */}
          {allowUrlInput && (
            <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`flex-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center min-w-0 ${
                  inputMode === 'upload'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileImage className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span className="truncate">Subir archivo</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center min-w-0 ${
                  inputMode === 'url'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Link2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span className="truncate">Usar URL</span>
              </button>
            </div>
          )}

          {/* Modo: Subir archivo */}
          {inputMode === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <button
                type="button"
                onClick={handleClick}
                disabled={uploading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin flex-shrink-0" />
                    <span className="truncate">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{preview ? 'Cambiar imagen' : 'Subir imagen'}</span>
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Formatos: JPEG, PNG, GIF, WEBP. Tamaño máximo: {maxSizeMB}MB
              </p>
            </div>
          )}

          {/* Modo: URL */}
          {inputMode === 'url' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={handleUrlChange}
                  onBlur={handleUrlSubmit}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                  }}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 min-w-0 block px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Ingresa la URL completa de la imagen
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>

    </div>
  );
}

