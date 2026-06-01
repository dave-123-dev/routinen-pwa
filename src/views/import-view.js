import { hidePanel, showPanel, toast, $ } from '../ui/dom.js';

export class ImportView {
  constructor({ getText, onImport }) {
    this.getText = getText;
    this.onImport = onImport;
  }

  bind() {
    $('importBtn').onclick = () => showPanel('importPanel');
    $('importCancel').onclick = () => hidePanel('importPanel');
    $('importPaste').onclick = () => this.importText($('paste').value);
    $('pickFile').onclick = () => $('importFile').click();
    $('importFile').onchange = event => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = result => {
        this.importText(typeof result.target?.result === 'string' ? result.target.result : '');
        event.target.value = '';
      };
      reader.onerror = () => {
        toast(`${text.importError}: Datei konnte nicht gelesen werden`);
        event.target.value = '';
      };
      reader.readAsText(file, 'utf-8');
    };
  }

  applyLanguage() {
    const text = this.getText();
    $('importTitle').textContent = text.import;
    $('fileHelp').textContent = text.fileHelp;
    $('pickFile').textContent = text.pickFile;
    $('pasteLabel').textContent = text.paste;
    $('importCancel').textContent = text.cancel;
    $('importPaste').textContent = text.importing;
  }

  importText(value) {
    const text = this.getText();
    try {
      if (!String(value || '').trim()) throw new Error('Datei ist leer oder unlesbar');
      const count = this.onImport(value);
      hidePanel('importPanel');
      toast(`${count} ${text.loaded}`);
    } catch (error) {
      toast(`${text.importError}: ${error.message}`);
    }
  }
}
