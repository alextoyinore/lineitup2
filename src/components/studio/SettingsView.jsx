import React from 'react';
import { useTactics } from '../../context/TacticsContext';
import ColorPicker from '../ColorPicker';
import Pitch from '../Pitch'; // We can use a mini-preview if we want
import { Settings2, Sliders, Type, Layout } from 'lucide-react';

const SettingsView = () => {
  const { uiConfig, updateUiConfig, players, teamColors, drawings, setDrawings, updatePlayer } = useTactics();

  const ConfigField = ({ label, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: '40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Studio Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Configure your pitch aesthetics and player visuals.</p>
        </header>

        {/* PITCH CONFIG */}
        <section style={{ background: 'var(--bg-panel)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={18} />
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Pitch Configuration</span>
          </div>
          <ConfigField label="Grass Color 1"><ColorPicker color={uiConfig.pitchColor1} onChange={(val) => updateUiConfig('pitchColor1', val)} /></ConfigField>
          <ConfigField label="Grass Color 2"><ColorPicker color={uiConfig.pitchColor2} onChange={(val) => updateUiConfig('pitchColor2', val)} /></ConfigField>
          <ConfigField label="Line Color"><ColorPicker color={uiConfig.pitchLineColor} onChange={(val) => updateUiConfig('pitchLineColor', val)} /></ConfigField>
          <ConfigField label="Line Thickness">
            <input type="range" min="1" max="10" value={uiConfig.lineThickness} onChange={(e) => updateUiConfig('lineThickness', Number(e.target.value))} />
          </ConfigField>
        </section>

        {/* JERSEY CONFIG */}
        <section style={{ background: 'var(--bg-panel)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={18} />
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Jersey & Icon Setup</span>
          </div>
          <ConfigField label="Jersey Size">
            <input type="range" min="0.5" max="2" step="0.1" value={uiConfig.jerseyScaleMult} onChange={(e) => updateUiConfig('jerseyScaleMult', Number(e.target.value))} />
          </ConfigField>
          <ConfigField label="Jersey Border">
            <input type="checkbox" checked={uiConfig.jerseyHasBorder} onChange={(e) => updateUiConfig('jerseyHasBorder', e.target.checked)} />
          </ConfigField>
          <ConfigField label="Show OVR Badge">
            <input type="checkbox" checked={uiConfig.showOvrBadge} onChange={(e) => updateUiConfig('showOvrBadge', e.target.checked)} />
          </ConfigField>
          {uiConfig.showOvrBadge && (
            <ConfigField label="OVR Opacity">
              <input type="range" min="0" max="1" step="0.1" value={uiConfig.ovrBadgeOpacity} onChange={(e) => updateUiConfig('ovrBadgeOpacity', Number(e.target.value))} />
            </ConfigField>
          )}
          <ConfigField label="Show Position">
            <input type="checkbox" checked={uiConfig.showPositionBadge} onChange={(e) => updateUiConfig('showPositionBadge', e.target.checked)} />
          </ConfigField>
          {uiConfig.showPositionBadge && (
            <ConfigField label="Pos. Opacity">
              <input type="range" min="0" max="1" step="0.1" value={uiConfig.positionBadgeOpacity} onChange={(e) => updateUiConfig('positionBadgeOpacity', Number(e.target.value))} />
            </ConfigField>
          )}
          <ConfigField label="Filled Zones">
            <input type="checkbox" checked={uiConfig.zoneHasFill} onChange={(e) => updateUiConfig('zoneHasFill', e.target.checked)} />
          </ConfigField>
        </section>

        {/* TYPOGRAPHY */}
        <section style={{ background: 'var(--bg-panel)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Type size={18} />
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Typography & Labels</span>
          </div>
          <ConfigField label="Number Color"><ColorPicker color={uiConfig.jerseyNumberColor} onChange={(val) => updateUiConfig('jerseyNumberColor', val)} /></ConfigField>
          <ConfigField label="Number Size"><input type="range" min="8" max="24" value={uiConfig.jerseyNumberFontSize} onChange={(e) => updateUiConfig('jerseyNumberFontSize', Number(e.target.value))} /></ConfigField>
          <ConfigField label="Name Size"><input type="range" min="4" max="20" value={uiConfig.playerNameFontSize} onChange={(e) => updateUiConfig('playerNameFontSize', Number(e.target.value))} /></ConfigField>
          <ConfigField label="Text Shadows"><input type="checkbox" checked={uiConfig.textHasShadow} onChange={(e) => updateUiConfig('textHasShadow', e.target.checked)} /></ConfigField>
        </section>
      </div>

      <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
        <div style={{ background: 'var(--bg-panel)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Live Preview</h3>
          <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '1.4', background: '#eee', border: '1px solid var(--border-color)' }}>
             <Pitch 
               players={players} 
               updatePlayer={updatePlayer}
               teamColors={teamColors}
               ui={uiConfig}
               drawings={drawings}
               setDrawings={setDrawings}
               readOnly={true}
             />
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            These settings are applied globally to your tactics board.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
