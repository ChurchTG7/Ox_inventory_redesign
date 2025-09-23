import React, { useCallback, useEffect, useState } from 'react';
import { fetchNui } from '../utils/fetchNui';
import { applyTheme, InventoryTheme } from './applyTheme';
import ThemeEditor from './ThemeEditor';
import { DEFAULT_THEME, PRESETS } from './defaults';

function debounce<T extends (...args: any[]) => void>(fn: T, ms = 250) {
	let t: any;
	return (...args: Parameters<T>) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), ms);
	};
}

const ThemeBootstrapper: React.FC = () => {
	const [theme, setTheme] = useState<InventoryTheme>(DEFAULT_THEME);
	const [profile, setProfile] = useState<string | null>(null);
	const [open, setOpen] = useState(false);

	// Load profile and persisted theme once
	useEffect(() => {
		let active = true;
		(async () => {
			try {
				// Ask Lua for player profile identifier first (server decides best key: citizenid, license, charid, etc.)
				const pid = await fetchNui<string | null>('getThemeProfile', {});
				if (active && pid) setProfile(pid);

				// Attempt to load theme from Lua with optional profile
				const saved = await fetchNui<InventoryTheme | null>('getThemeSettings', pid ? { profile: pid } : {});
				if (active && saved && typeof saved === 'object') {
					const withProfile = pid ? { ...saved, profile: pid } : saved;
					setTheme(prev => ({ ...prev, ...withProfile }));
					applyTheme({ ...DEFAULT_THEME, ...withProfile });
					// Cache in localStorage per profile as a resilience fallback
					try {
						const key = `oxinv.theme.${pid || 'default'}`;
						localStorage.setItem(key, JSON.stringify(withProfile));
					} catch {}
				} else if (active) {
					// Fallback: try localStorage cache if available
					try {
						const key = `oxinv.theme.${pid || 'default'}`;
						const raw = localStorage.getItem(key);
						if (raw) {
							const cached = JSON.parse(raw);
							setTheme(prev => ({ ...prev, ...cached }));
							applyTheme({ ...DEFAULT_THEME, ...cached });
							return;
						}
					} catch {}
					applyTheme(DEFAULT_THEME);
				}
			} catch {
				applyTheme(DEFAULT_THEME);
			}
		})();
		return () => { active = false; };
	}, []);

	// Apply theme when state changes
	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	// Listen for Settings button toggle event only
	useEffect(() => {
		const toggle = () => setOpen(o => !o);
		window.addEventListener('oxinv:toggleThemeEditor', toggle as EventListener);
		// Also close on inventory exit if event is dispatched
		const handleExit = () => setOpen(false);
		window.addEventListener('oxinv:closeThemeEditor', handleExit as EventListener);
		// Listen for other possible close events emitted by the app/resources
		const closeEventNames = [
			'oxinv:close',
			'ox_inventory:close',
			'inventory:close',
			'inventory:hide',
		];
		closeEventNames.forEach((evt) => window.addEventListener(evt, handleExit as EventListener));
		// Close the editor if user presses Escape (inventory close often uses ESC)
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' || e.key === 'Tab') {
				setOpen(false);
				// Save immediately on close to persist latest changes
				const body = profile ? { ...theme, profile } : theme;
				try {
					const key = `oxinv.theme.${profile || 'default'}`;
					localStorage.setItem(key, JSON.stringify(body));
				} catch {}
				fetchNui('saveThemeSettingsSilent', body).catch(() => {});
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('oxinv:toggleThemeEditor', toggle as EventListener);
			window.removeEventListener('oxinv:closeThemeEditor', handleExit as EventListener);
			closeEventNames.forEach((evt) => window.removeEventListener(evt, handleExit as EventListener));
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [theme]);

	// Expose a global event so Lua/NUI can push theme updates without Redux
	useEffect(() => {
		const listener = (ev: MessageEvent) => {
			if (!ev.data) return;
			if (ev.data.action === 'setTheme' && ev.data.data) {
				setTheme(prev => ({ ...prev, ...(ev.data.data || {}) }));
				return;
			}
			// Heuristics: close theme editor when inventory is being hidden/closed by NUI messages
			const action = typeof ev.data.action === 'string' ? ev.data.action.toLowerCase() : '';
			const visible = (ev.data.visible ?? ev.data.display ?? ev.data.show ?? ev.data.setVisible ?? ev.data.setDisplay);
			// Close if action suggests hiding/closing OR explicit flags indicate hidden
			const shouldClose =
				(action.includes('close') || action.includes('hide')) ||
				(typeof visible === 'boolean' && visible === false) ||
				(typeof ev.data.visible === 'boolean' && ev.data.visible === false) ||
				(typeof ev.data.display === 'boolean' && ev.data.display === false);
			if (shouldClose) {
				setOpen(false);
				const body = profile ? { ...theme, profile } : theme;
				try {
					const key = `oxinv.theme.${profile || 'default'}`;
					localStorage.setItem(key, JSON.stringify(body));
				} catch {}
				fetchNui('saveThemeSettingsSilent', body).catch(() => {});
			}
		};
		window.addEventListener('message', listener);
		return () => window.removeEventListener('message', listener);
	}, [theme, profile]);

	// Save as a safety net when the NUI page unloads (resource stop/reload or player disconnect)
	useEffect(() => {
		const handler = () => {
			const body = profile ? { ...theme, profile } : theme;
			try {
				const key = `oxinv.theme.${profile || 'default'}`;
				localStorage.setItem(key, JSON.stringify(body));
			} catch {}
			fetchNui('saveThemeSettingsSilent', body).catch(() => {});
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [theme, profile]);

	const saveDebounced = React.useMemo(() => debounce((payload: InventoryTheme) => {
		const body = profile ? { ...payload, profile } : payload;
		try {
			const key = `oxinv.theme.${profile || 'default'}`;
			localStorage.setItem(key, JSON.stringify(body));
		} catch {}
		fetchNui('saveThemeSettingsSilent', body).catch(() => {});
	}, 250), [profile]);

	const updateTheme = useCallback(async (partial: Partial<InventoryTheme>) => {
		setTheme(prev => {
			const next = { ...prev, ...partial } as InventoryTheme;
			saveDebounced(next);
			return next;
		});
	}, [saveDebounced]);

	const resetToDefaults = useCallback(() => {
		const next = { ...DEFAULT_THEME, ...(profile ? { profile } : {}) } as InventoryTheme;
		setTheme(next);
		applyTheme(next);
		try {
			const key = `oxinv.theme.${profile || 'default'}`;
			localStorage.setItem(key, JSON.stringify(next));
		} catch {}
		fetchNui('saveThemeSettingsSilent', next).catch(() => {});
	}, [profile]);

	const applyPreset = useCallback((name: string) => {
		const preset = PRESETS[name];
		if (!preset) return;
		const next = { ...theme, ...preset, ...(profile ? { profile } : {}) } as InventoryTheme;
		setTheme(prev => ({ ...prev, ...preset }));
		applyTheme(next);
		try {
			const key = `oxinv.theme.${profile || 'default'}`;
			localStorage.setItem(key, JSON.stringify(next));
		} catch {}
		fetchNui('saveThemeSettingsSilent', next).catch(() => {});
	}, [theme, profile]);

	const saveNow = useCallback(() => {
		const body = profile ? { ...theme, profile } : theme;
		try {
			const key = `oxinv.theme.${profile || 'default'}`;
			localStorage.setItem(key, JSON.stringify(body));
		} catch {}
		fetchNui('saveThemeSettingsSilent', body).catch(() => {});
	}, [theme, profile]);

	return (
		<>
			{open && (
				<ThemeEditor
					theme={theme}
					onChange={updateTheme}
					onClose={() => {
						setOpen(false);
						// Save-on-close to ensure latest edits are persisted immediately
						const body = profile ? { ...theme, profile } : theme;
						try {
							const key = `oxinv.theme.${profile || 'default'}`;
							localStorage.setItem(key, JSON.stringify(body));
						} catch {}
						fetchNui('saveThemeSettingsSilent', body).catch(() => {});
					}}
					onReset={resetToDefaults}
					onPreset={applyPreset}
					presets={Object.keys(PRESETS)}
					onSave={saveNow}
				/>
			)}
		</>
	);
};

export default ThemeBootstrapper;
