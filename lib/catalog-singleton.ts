/**
 * Catalog Singleton - Shared catalog instance across API routes
 */

import { DigitalCatalogManager, EBook, AudioBook } from './digital-catalog';
import { DigitalFormat } from '@/types/digital-content';
import { sampleBooks } from './seed-data';

let catalogInstance: DigitalCatalogManager | null = null;
let initialized = false;

export function getCatalogManager(): DigitalCatalogManager {
  if (!catalogInstance) {
    catalogInstance = new DigitalCatalogManager();
  }

  if (!initialized) {
    sampleBooks.forEach((bookData) => {
      if (bookData.formatType === DigitalFormat.AUDIOBOOK) {
        const audiobook = new AudioBook(bookData);
        catalogInstance!.addContent(audiobook);
      } else {
        const ebook = new EBook(bookData);
        catalogInstance!.addContent(ebook);
      }
    });
    initialized = true;
  }

  return catalogInstance;
}
