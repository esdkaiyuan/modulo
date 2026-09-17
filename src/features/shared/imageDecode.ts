/** Shared image-file decoding for the modulo tools. */

export interface DecodedImageFile {
  fileName: string;
  size: number;
  type: string;
  width: number;
  height: number;
  /** Source pixels at natural size, ready for the engine pipelines. */
  imageData: ImageData;
  /** Object-less data URL, kept for previews. */
  dataUrl: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function decodeDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to decode image'));
    image.src = dataUrl;
  });
}

/**
 * Read + decode an image file (PNG/JPG/BMP/WebP) into `ImageData` at natural
 * size. Every tool used to implement read → Image → canvas → getImageData on
 * its own; this is the single copy.
 */
export async function decodeImageFile(file: File): Promise<DecodedImageFile> {
  const dataUrl = await readAsDataUrl(file);
  const image = await decodeDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  context.drawImage(image, 0, 0);

  return {
    fileName: file.name,
    size: file.size,
    type: file.type || 'image/*',
    width: image.naturalWidth,
    height: image.naturalHeight,
    imageData: context.getImageData(0, 0, image.naturalWidth, image.naturalHeight),
    dataUrl
  };
}