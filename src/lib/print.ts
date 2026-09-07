/**
 * Utility to trigger native browser/system print dialog.
 */
export function handlePrint() {
  if (typeof window !== 'undefined') {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Failed to trigger window.print():', e);
    }
  }
}
