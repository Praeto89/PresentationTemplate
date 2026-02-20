/**
 * ════════════════════════════════════════════════════════════════════════════
 * PDF EXPORT MANAGER - Exportiert Präsentation als PDF
 * Nutzt Reveal.js ?print-pdf Mode für konsistente Formatierung
 * ════════════════════════════════════════════════════════════════════════════
 */

import { getCurrentStudent } from './student-manager.js';

/**
 * Zeigt PDF-Export-Anleitung Modal an
 */
export function showPDFExportGuide() {
  console.log('[PDFExport] Showing PDF export guide');
  
  const guideHTML = `
    <div style="padding: 20px; max-width: 600px;">
      <h3>PDF-Export Anleitung</h3>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
        <h4>Schritt 1: Print-Modus öffnen</h4>
        <p>Es wird ein neues Fenster mit der PDF-Export-Version geöffnet.</p>
        <button id="pdf-export-open-btn" class="admin-btn-primary" style="margin-top: 10px;">
          🖨️ PDF-Exportmodus öffnen
        </button>
      </div>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
        <h4>Schritt 2: Drucken</h4>
        <p>Im neuen Fenster:</p>
        <ol style="margin: 10px 0;">
          <li>Drücke <strong>Strg+P</strong> (Windows) oder <strong>Cmd+P</strong> (Mac)</li>
          <li>Oder klicke auf das Drucker-Symbol</li>
        </ol>
      </div>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
        <h4>Schritt 3: Als PDF speichern</h4>
        <p>Im Druckdialog:</p>
        <ol style="margin: 10px 0;">
          <li>Wähle <strong>"Als PDF speichern"</strong> als Drucker</li>
          <li>Format: <strong>Querformat (Landscape)</strong> wird empfohlen</li>
          <li>Klicke <strong>"Speichern"</strong></li>
        </ol>
      </div>
      
      <div style="background: #fffacd; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107;">
        <h4>💡 Tipps</h4>
        <ul style="margin: 10px 0;">
          <li><strong>Hintergrundgrafiken:</strong> Stelle sicher, dass "Hintergrundgrafiken" im Druckdialog aktiviert ist</li>
          <li><strong>Dateiname:</strong> Nutze einen aussagekräftigen Namen, z.B. <code>Praesentation_Schueler1_2026.pdf</code></li>
          <li><strong>Mehrere Schüler:</strong> Wiederhole den Vorgang für jeden Schüler im Layer-Modus</li>
        </ul>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px;">
        <p><strong>ℹ️ Hinweis:</strong> Die PDF enthält alle Folien für den aktuellen Schüler, einschließlich aller bearbeiteten Inhalte und Detailslides.</p>
      </div>
    </div>
  `;
  
  // Zeige Modal
  showModal('PDF-Export Anleitung', guideHTML);
  
  // Setze Event-Listener
  const openBtn = document.getElementById('pdf-export-open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', openPDFExportMode);
  }
}

/**
 * Öffnet PDF-Export-Modus (Reveal.js ?print-pdf)
 */
function openPDFExportMode() {
  const student = getCurrentStudent();
  const studentName = student ? student.name : 'Praesentation';
  
  // Nutze Reveal.js ?print-pdf Mode
  const baseUrl = window.location.origin + window.location.pathname;
  const printUrl = baseUrl.includes('?')
    ? baseUrl + '&print-pdf'
    : baseUrl + '?print-pdf';
  
  console.log('[PDFExport] Opening export mode:', printUrl);
  
  // Öffne in neuem Fenster
  window.open(printUrl, 'pdf-export', 'width=1200,height=800');
}

/**
 * Showt Modal mit benutzerdefinierten Inhalten
 * @param {string} title - Modal-Titel
 * @param {string} content - Modal-Inhalt (HTML)
 */
function showModal(title, content) {
  // Entferne altes Modal, falls vorhanden
  const oldModal = document.getElementById('pdf-export-modal');
  if (oldModal) oldModal.remove();
  
  // Erstelle Modal
  const modal = document.createElement('div');
  modal.id = 'pdf-export-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    overflow-y: auto;
    max-width: 700px;
    width: 90%;
  `;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <h2 style="margin: 0; font-size: 20px;">${title}</h2>
    <button id="modal-close-btn" style="
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
    ">×</button>
  `;
  
  // Body
  const body = document.createElement('div');
  body.innerHTML = content;
  
  // Assemble
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close Handler
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  console.log('[PDFExport] Modal shown');
}

/**
 * Erstellt einen PDF-Export-Button für Edit-Mode Tab
 * @returns {HTMLElement} Button-Element
 */
export function createPDFExportButton() {
  const button = document.createElement('button');
  button.id = 'pdf-export-guide-btn';
  button.className = 'admin-btn-primary';
  button.textContent = '📄 PDF-Exportanleitung';
  button.style.marginTop = '15px';
  button.addEventListener('click', showPDFExportGuide);
  
  return button;
}
