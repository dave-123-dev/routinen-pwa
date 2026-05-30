import { hidePanel, showPanel, $ } from '../ui/dom.js';

export class SettingsView {
  constructor({ getText, getLang, getViewMode, onSave }) {
    this.getText = getText;
    this.getLang = getLang;
    this.getViewMode = getViewMode;
    this.onSave = onSave;
  }

  bind() {
    $('settingsBtn').onclick = () => showPanel('settingsPanel');
    $('settingsCancel').onclick = () => hidePanel('settingsPanel');
    $('settingsSave').onclick = () => {
      this.onSave({
        language: $('language').value,
        viewMode: $('defaultView').value,
      });
      hidePanel('settingsPanel');
    };
  }

  applyLanguage() {
    const text = this.getText();
    $('settingsTitle').textContent = text.settings;
    $('languageLabel').textContent = text.language;
    $('viewModeLabel').textContent = text.viewMode;
    $('viewDetailed').textContent = text.detailedView;
    $('viewCompact').textContent = text.compactView;
    $('settingsCancel').textContent = text.close;
    $('settingsSave').textContent = text.save;
    $('language').value = this.getLang();
    $('defaultView').value = this.getViewMode();
  }
}
