import { hidePanel, showPanel, $ } from '../ui/dom.js';

export class SettingsView {
  constructor({ getText, getLang, onSave }) {
    this.getText = getText;
    this.getLang = getLang;
    this.onSave = onSave;
  }

  bind() {
    $('settingsBtn').onclick = () => showPanel('settingsPanel');
    $('settingsCancel').onclick = () => hidePanel('settingsPanel');
    $('settingsSave').onclick = () => {
      this.onSave($('language').value);
      hidePanel('settingsPanel');
    };
  }

  applyLanguage() {
    const text = this.getText();
    $('settingsTitle').textContent = text.settings;
    $('languageLabel').textContent = text.language;
    $('settingsCancel').textContent = text.close;
    $('settingsSave').textContent = text.save;
    $('language').value = this.getLang();
  }
}
