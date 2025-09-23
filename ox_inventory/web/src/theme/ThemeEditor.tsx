import React, { useState } from 'react';
import { InventoryTheme, normalizeColor } from './applyTheme';
import ColorPicker from '../components/utils/ColorPicker';

interface Props {
	theme: InventoryTheme;
	onChange: (t: Partial<InventoryTheme>) => void;
	onClose: () => void;
	onReset?: () => void;
	onSave?: () => void;
	onPreset?: (name: string) => void;
	presets?: string[];
}

// Minimal editor: tabs for core colors + gradient (simple linear only)
const TABS = [
	{ id: 'weight', label: 'Weight' },
	{ id: 'player', label: 'Text' },
	{ id: 'slot', label: 'Slot' },
	{ id: 'durability', label: 'Durability' },
	{ id: 'hover', label: 'Hover' },
	{ id: 'shadow', label: 'Shadow' },
	{ id: 'controls', label: 'Controls' },
	{ id: 'gradient', label: 'Gradient' },
	{ id: 'layout', label: 'Layout' },
];

const ThemeEditor: React.FC<Props> = ({ theme, onChange, onClose, onReset, onSave, onPreset, presets }) => {
	const [tab, setTab] = useState('weight');
	const optionStyle: React.CSSProperties = { background: '#1f2127', color: '#fff' };
	const ThemedSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
		<div style={{ position: 'relative', display: 'inline-block' }}>
			<select
				{...props}
				style={{
					appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
					background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
					backgroundColor: '#1f2127',
					color: '#fff',
					border: '1px solid rgba(255,255,255,0.12)',
					padding: '4px 24px 4px 8px',
					borderRadius: 6,
					boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
					fontSize: 12,
					// Hint to browsers to use dark popups where supported
					colorScheme: 'dark' as any,
					...props.style,
				}}
			>
				{props.children}
			</select>
			<span style={{
				position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
				pointerEvents: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 9
			}}>▼</span>
		</div>
	);
	const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 };

	return (
		<div
			style={overlayStyles}
			onMouseDown={(e) => {
				if (e.currentTarget === e.target) onClose();
			}}
		>
			<style>{`
				/* Force dark dropdown list on most browsers */
				.oxinv-theme-editor select option { background: #1f2127; color: #fff; }
			`}</style>
			<div style={panelStyles} className="oxinv-theme-editor">
				<div style={headerStyles}>
					<strong style={{ fontSize: 14 }}>Inventory Theme</strong>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						{onSave && (
							<button
								style={buttonPrimary}
								onClick={onSave}
								title="Save changes now"
							>
								Save
							</button>
						)}
						{onReset && (
							<button
								style={buttonGhost}
								onClick={() => {
									// Soft confirm via inline toast; apply immediately
									showToast('Theme reset to defaults');
									onReset();
								}}
								title="Reset to defaults"
							>
								Reset
							</button>
						)}
						<button style={buttonGhost} onClick={onClose}>✕</button>
					</div>
				</div>
				<div style={{ ...tabsRow, justifyContent: 'space-between', alignItems: 'center' }}>
					<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
						{TABS.map(t => (
							<button
								key={t.id}
								onClick={() => setTab(t.id)}
								style={tab === t.id ? { ...tabBtn, ...tabBtnActive } : tabBtn}
							>
								{t.label}
							</button>
						))}
					</div>
					{onPreset && presets && presets.length > 0 && (
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span title="Presets" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgba(255,255,255,0.85)' }}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 2C6.48 2 2 6.03 2 10.5 2 13.54 4.31 16.2 7.41 17.44 7.15 18.22 6.54 19.5 5 19.5c-1 0-1 .75-1 1s.38 1 1.5 1C7.5 21.5 9 20 9.72 18.83c.74.11 1.5.17 2.28.17 5.52 0 10-4.03 10-8.5S17.52 2 12 2Zm-4 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1Zm4-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1Zm4 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1Z"/>
								</svg>
							</span>
							<ThemedSelect
								onChange={(e) => e.currentTarget.value && onPreset(e.currentTarget.value)}
								defaultValue=""
								title="Apply preset theme"
							>
								<option value="" disabled>
									Presets
								</option>
								{presets.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</ThemedSelect>
						</div>
					)}
				</div>

				<div style={{ marginTop: 6 }}>
					{tab === 'weight' && (
						<div style={gridTwo}>
							<div>
								<p style={label}>Weight Foreground</p>
								<ColorPicker value={theme.weightBarFg || theme.weightBar || 'rgba(255,255,255,0.85)'} onChange={v => onChange({ weightBarFg: v })} />
							</div>
							<div>
								<p style={label}>Weight Background</p>
								<ColorPicker value={theme.weightBarBg || 'rgba(0,0,0,0.25)'} onChange={v => onChange({ weightBarBg: v })} />
							</div>
						</div>
					)}
					{tab === 'player' && (
						<ColorPicker value={theme.playerName} onChange={v => onChange({ playerName: v })} />
					)}
					{tab === 'slot' && (
						<ColorPicker value={theme.itemSlot} onChange={v => onChange({ itemSlot: v })} />
					)}
					{tab === 'durability' && (
						<ColorPicker value={theme.durability || 'rgba(0,0,0,0.5)'} onChange={v => onChange({ durability: normalizeColor(v) })} />
					)}
					{tab === 'hover' && (
						<ColorPicker value={theme.hover} onChange={v => onChange({ hover: v })} />
					)}
					{tab === 'shadow' && (
						<div style={gridTwo}>
							<div>
								<p style={label}>Default Shadow</p>
								<ColorPicker value={theme.shadow} onChange={v => onChange({ shadow: v })} />
							</div>
							<div>
								<p style={label}>Hotbar Shadow (slots 1–5)</p>
								<ColorPicker value={theme.hotslotShadow || theme.shadow} onChange={v => onChange({ hotslotShadow: v })} />
							</div>
						</div>
					)}
					{tab === 'controls' && (
						<div style={gridTwo}>
							<div>
								<p style={label}>Controls Background</p>
								<ColorPicker value={theme.controlBg} onChange={v => onChange({ controlBg: v })} />
							</div>
							<div>
								<p style={label}>Controls Hover/Focus</p>
								<ColorPicker value={theme.controlHover} onChange={v => onChange({ controlHover: v })} />
							</div>
							<div>
								<p style={label}>Controls Text</p>
								<ColorPicker value={theme.controlText} onChange={v => onChange({ controlText: v })} />
							</div>
						</div>
					)}
          
					{tab === 'gradient' && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							<div>
								<p style={label}>Start Source</p>
								<div style={{ display: 'flex', gap: 8 }}>
									<label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
										<input
											type="radio"
											name="grad-start-source"
											checked={theme.gradientStartMode !== 'highlight'}
											onChange={() => onChange({ gradientStartMode: 'slot' as any })}
										/>
										Slot color
									</label>
									<label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
										<input
											type="radio"
											name="grad-start-source"
											checked={theme.gradientStartMode === 'highlight'}
											onChange={() => onChange({ gradientStartMode: 'highlight' as any })}
										/>
										Highlight color
									</label>
								</div>
							</div>
							{theme.gradientStartMode === 'highlight' && (
								<div>
									<p style={label}>Start (Highlight)</p>
									<ColorPicker value={theme.gradientStart} onChange={v => onChange({ gradientStart: normalizeColor(v) })} />
								</div>
							)}
							<div>
								<p style={label}>Secondary (End) color</p>
								<ColorPicker value={theme.gradientEnd} onChange={v => onChange({ gradientEnd: normalizeColor(v) })} />
							</div>
							<div>
								<p style={label}>Mode</p>
								<ThemedSelect
									value={theme.gradientMode || 'linear'}
									onChange={e => onChange({ gradientMode: (e.currentTarget.value as InventoryTheme['gradientMode']) })}
								>
									<option value="linear">Linear</option>
									<option value="radial-inner">Radial (Inner)</option>
									<option value="radial-outer">Radial (Outer)</option>
								</ThemedSelect>
							</div>
							{(theme.gradientMode || 'linear') === 'linear' && (
								<div>
									<p style={label}>Direction</p>
									<ThemedSelect
										value={theme.gradientDirection || 'down'}
										onChange={e => onChange({ gradientDirection: (e.currentTarget.value as InventoryTheme['gradientDirection']) })}
									>
										<option value="down">Down</option>
										<option value="up">Up</option>
										<option value="left">Left</option>
										<option value="right">Right</option>
									</ThemedSelect>
								</div>
							)}
							{(['radial-inner', 'radial-outer'] as const).includes((theme.gradientMode || 'linear') as any) && (
								<div>
									<p style={label}>Radial size: {(theme.gradientSize ?? (theme.gradientMode === 'radial-inner' ? 70 : 40))}%</p>
									<input
										type="range"
										min={0}
										max={100}
										step={1}
										value={theme.gradientSize ?? (theme.gradientMode === 'radial-inner' ? 70 : 40)}
										onChange={(e) => onChange({ gradientSize: Number(e.target.value) })}
										style={{ width: '100%' }}
									/>
								</div>
							)}
						</div>
					)}
					{tab === 'layout' && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							<label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
								<input
									type="checkbox"
									checked={!!theme.hotbarLeft}
									onChange={(e) => onChange({ hotbarLeft: e.target.checked })}
								/>
								Move first 5 player slots to a left vertical bar
							</label>
							<p style={{ fontSize: 12, opacity: 0.8 }}>
								This creates a vertical hotbar on the left by reflowing the first five player inventory slots.
							</p>

							<div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
								<p style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Hotbar (Slots 1–5)</p>
								<label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
									<input
										type="checkbox"
										checked={theme.hotslotSync !== false}
										onChange={(e) => onChange({ hotslotSync: e.target.checked })}
									/>
									Sync colors with Slot color
								</label>
								{theme.hotslotSync === false && (
									<div style={{ marginTop: 6 }}>
										<p style={label}>Hotbar Background</p>
										<ColorPicker value={theme.hotslotBg || theme.itemSlot} onChange={v => onChange({ hotslotBg: v })} />
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

const overlayStyles: React.CSSProperties = {
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'flex-start',
	padding: 20,
	background: 'transparent',
	zIndex: 9999,
};

const panelStyles: React.CSSProperties = {
	width: 700,
	maxWidth: '100%',
	background: 'linear-gradient(135deg, rgba(18,18,20,0.78), rgba(24,24,28,0.82))',
	backdropFilter: 'blur(6px) saturate(1.1)',
	borderRadius: 10,
	boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
	color: '#c1c2c5',
	padding: '10px 12px 12px',
	border: '1px solid rgba(255,255,255,0.05)',
};

const headerStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: 6,
};

const tabsRow: React.CSSProperties = {
	display: 'flex',
	gap: 4,
	flexWrap: 'wrap',
};

const tabBtn: React.CSSProperties = {
	padding: '4px 8px',
	fontSize: 12,
	borderRadius: 6,
	background: 'transparent',
	border: 'none',
	color: '#c1c2c5',
	cursor: 'pointer',
};

const tabBtnActive: React.CSSProperties = {
	background: 'rgba(255,255,255,0.06)',
	color: '#fff',
	boxShadow: 'inset 0 -2px 0 rgba(255,255,255,0.1)'
};

const buttonGhost: React.CSSProperties = {
	background: 'transparent',
	border: '1px solid rgba(255,255,255,0.08)',
	color: '#c1c2c5',
	padding: '3px 8px',
	borderRadius: 6,
	cursor: 'pointer',
};

const buttonPrimary: React.CSSProperties = {
	background: 'linear-gradient(180deg, rgba(28,109,214,0.95), rgba(22,84,170,0.95))',
	border: '1px solid rgba(12,62,132,0.9)',
	color: '#fff',
	padding: '5px 10px',
	borderRadius: 6,
	cursor: 'pointer',
	boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)',
};

const label: React.CSSProperties = { margin: '0 0 3px 0', fontSize: 11, opacity: 0.85 };
const select: React.CSSProperties = {
	background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
	color: '#fff',
	border: '1px solid rgba(255,255,255,0.12)',
	padding: '6px 8px',
	borderRadius: 6,
	boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
};

export default ThemeEditor;

// Simple ephemeral toast for inline confirmations
function showToast(msg: string, timeout = 1800) {
	try {
		const id = 'oxinv-theme-toast';
		let host = document.getElementById(id);
		if (!host) {
			host = document.createElement('div');
			host.id = id;
			host.style.position = 'fixed';
			host.style.top = '18px';
			host.style.right = '18px';
			host.style.zIndex = '10000';
			host.style.display = 'flex';
			host.style.flexDirection = 'column';
			host.style.gap = '8px';
			document.body.appendChild(host);
		}
		const el = document.createElement('div');
		el.textContent = msg;
		el.style.background = 'rgba(20,22,28,0.9)';
		el.style.border = '1px solid rgba(255,255,255,0.08)';
		el.style.color = '#fff';
		el.style.padding = '8px 12px';
		el.style.fontSize = '12px';
		el.style.borderRadius = '8px';
		el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)';
		el.style.backdropFilter = 'blur(4px)';
		el.style.maxWidth = '40vw';
		el.style.pointerEvents = 'none';
		host.appendChild(el);
		setTimeout(() => {
			el.style.transition = 'opacity .25s ease';
			el.style.opacity = '0';
			setTimeout(() => el.remove(), 250);
		}, timeout);
	} catch {}
}

