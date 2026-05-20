/**
 * Loan Manager Singleton - Shared loan manager instance across API routes
 */

import { DigitalLoanManager } from './loan-management';
import { getCatalogManager } from './catalog-singleton';

let loanManagerInstance: DigitalLoanManager | null = null;

export function getLoanManager(): DigitalLoanManager {
  if (!loanManagerInstance) {
    const catalogManager = getCatalogManager();
    loanManagerInstance = new DigitalLoanManager(catalogManager);
  }
  return loanManagerInstance;
}
