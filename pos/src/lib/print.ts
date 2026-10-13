import { printWithQz } from '@ury/core';
import {
  getInvoicePrintHtml,
  networkPrint,
  selectNetworkPrinter,
  updatePrintStatus
} from './invoice-api';
import { PosProfileCombined } from './pos-profile-api';

interface PrintOrderParams {
  orderId: string;
  posProfile: PosProfileCombined;
  printFormat?: string | null;
}

export async function printOrder({ orderId, posProfile, printFormat }: PrintOrderParams): Promise<'qz' | 'network' | 'socket'> {
  const { print_type, qz_host, print_format, printer, name, cashier, multiple_cashier } = posProfile;
  const format = printFormat || print_format;

  if (print_type === 'qz') {
    if (!qz_host) {
      throw new Error('QZ host is not set');
    }
    const html = await getInvoicePrintHtml(orderId, format as string);
    await printWithQz(qz_host, html);
    await updatePrintStatus(orderId);
    return 'qz';
  } else if (print_type === 'network') {
    if (cashier && !multiple_cashier) {
      await networkPrint(orderId, printer as string, format as string);
    } else {
      await selectNetworkPrinter(orderId, name, format);
    }
    await updatePrintStatus(orderId);
    return 'network';
  } else {
    // Browser print. A popup (window.open) after awaits gets blocked by Chrome's popup blocker and nothing
    // shows up, so the print view is loaded in a hidden iframe and printed from there.
    const url = `/printview?doctype=POS Invoice&name=${encodeURIComponent(orderId)}&format=${encodeURIComponent(format as string)}&no_letterhead=1&settings={}&letterhead=No Letterhead&_lang=en`;
    await new Promise<void>((resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.style.position = 'fixed';
      frame.style.right = '0';
      frame.style.bottom = '0';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      frame.src = url;
      const cleanup = () => setTimeout(() => frame.remove(), 60000);
      frame.onload = () => {
        try {
          const win = frame.contentWindow;
          if (!win) throw new Error('print frame unavailable');
          win.focus();
          win.print();
          cleanup();
          resolve();
        } catch (e) {
          cleanup();
          // Fallback: open the print view in a tab (may be blocked by the popup blocker)
          window.open(url + '&trigger_print=1', '_blank', 'noopener,noreferrer');
          resolve();
        }
      };
      frame.onerror = () => { cleanup(); reject(new Error('could not load the print view')); };
      document.body.appendChild(frame);
    });
    await updatePrintStatus(orderId);
    return 'socket';
  }
}