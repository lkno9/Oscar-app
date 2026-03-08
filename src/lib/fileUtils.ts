/**
 * Cross-browser file utilities for mobile Safari + Chrome compatibility.
 *
 * Handles:
 * - Image compression via canvas (HEIC/HEIF → JPEG fallback)
 * - File size validation
 * - Base64 conversion with size awareness
 * - MIME type normalization
 */

/** Maximum image dimension (width or height) before compression */
const MAX_IMAGE_DIMENSION = 1600;

/** Maximum file size for direct base64 upload to AI analysis (5 MB) */
const MAX_ANALYSIS_SIZE = 5 * 1024 * 1024;

/** Maximum file size for Supabase storage upload (10 MB) */
const MAX_STORAGE_SIZE = 10 * 1024 * 1024;

/** JPEG quality for compressed images (0-1) */
const JPEG_QUALITY = 0.82;

/**
 * Accept string for image file inputs — works on both Chrome and Safari.
 * Includes MIME types (preferred by Safari) + HEIC/HEIF extensions for iOS.
 */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif";

/**
 * Accept string for document file inputs.
 * Uses both MIME types and extensions for max compatibility.
 */
export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.heic,.heif";

/**
 * Accept string for all file types Oscar can analyze (chat).
 * Combines images + documents + text files.
 */
export const ANALYSIS_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,application/pdf,text/plain,text/csv,text/markdown,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.pdf,.txt,.csv,.md,.docx";

/**
 * Accept string for document storage (all common formats).
 */
export const STORAGE_ACCEPT = "image/jpeg,image/png,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.heic,.heif,.pdf,.doc,.docx";

/**
 * Check if a file is an image (including HEIC from iOS).
 */
export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  // iOS Safari sometimes doesn't set MIME type for HEIC
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

/**
 * Check if a file is a PDF.
 */
export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Check if a file is a text-based file.
 */
export function isTextFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop();
  return (
    file.type === "text/plain" ||
    file.type === "text/csv" ||
    file.type === "text/markdown" ||
    ext === "txt" ||
    ext === "csv" ||
    ext === "md"
  );
}

/**
 * Check if a file is a DOCX.
 */
export function isDocxFile(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

/**
 * Check if a file is an old .doc format (not supported).
 */
export function isOldDocFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop();
  return (
    (file.type === "application/msword" || ext === "doc") &&
    !file.name.toLowerCase().endsWith(".docx")
  );
}

/**
 * Validate file size for analysis (AI chat).
 * Returns error message or null if OK.
 */
export function validateAnalysisSize(file: File): string | null {
  if (file.size > MAX_ANALYSIS_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `Le fichier fait ${sizeMB} Mo, c'est trop lourd (max 5 Mo). Essayez de réduire sa taille.`;
  }
  return null;
}

/**
 * Validate file size for storage upload.
 * Returns error message or null if OK.
 */
export function validateStorageSize(file: File): string | null {
  if (file.size > MAX_STORAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `Le fichier fait ${sizeMB} Mo, c'est trop lourd (max 10 Mo). Essayez de réduire sa taille.`;
  }
  return null;
}

/**
 * Compress an image file using canvas.
 * - Resizes to MAX_IMAGE_DIMENSION max
 * - Converts HEIC/HEIF/PNG to JPEG (smaller, universal)
 * - Returns a compressed File object
 *
 * Works on Chrome, Safari (desktop + iOS), Firefox.
 */
export async function compressImage(file: File, maxDim = MAX_IMAGE_DIMENSION, quality = JPEG_QUALITY): Promise<File> {
  return new Promise((resolve, reject) => {
    // For HEIC files on browsers that can't decode them natively,
    // we still try — modern Safari/Chrome can handle HEIC via <img>
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if larger than maxDim
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          const compressedName = file.name.replace(/\.\w+$/, ".jpg");
          const compressedFile = new File([blob], compressedName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // If browser can't decode (e.g. HEIC on old Chrome), return original
      console.warn("Image decode failed, returning original file:", file.name);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Read a file as base64 data URL.
 * Compresses images first if they're too large.
 */
export async function readFileAsBase64(file: File): Promise<string> {
  let fileToRead = file;

  // Compress images before base64 conversion
  if (isImageFile(file) && file.size > 500 * 1024) {
    try {
      fileToRead = await compressImage(file);
    } catch {
      // Fallback to original if compression fails
      fileToRead = file;
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(fileToRead);
  });
}

/**
 * Read a file as text content.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier texte"));
    reader.readAsText(file);
  });
}

/**
 * Compress an image for Supabase storage upload.
 * Only compresses if > 1MB.
 */
export async function compressForUpload(file: File): Promise<File> {
  if (!isImageFile(file)) return file;
  if (file.size <= 1024 * 1024) return file; // < 1MB, no need

  try {
    return await compressImage(file, 2000, 0.85);
  } catch {
    return file;
  }
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} Ko`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo`;
}
