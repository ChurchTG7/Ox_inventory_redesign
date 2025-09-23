// Central function to map a partial theme object to CSS variables.
// Keeps logic isolated so installation only needs one import + call.

export type InventoryTheme = {
	// Optional: profile key for per-player persistence (ignored by applyTheme)
	profile?: string;
	weightBar?: string; // legacy: used as both fg/bg if newer fields are unset
	weightBarFg?: string;
	weightBarBg?: string;
	durability?: string;
	playerName?: string;
	itemSlot?: string;
	hover?: string;
	shadow?: string;
	hotslotShadow?: string;
	gradientStart?: string;
	gradientEnd?: string;
	gradientDirection?: 'up' | 'down' | 'left' | 'right';
	gradientMode?: 'linear' | 'radial-inner' | 'radial-outer';
	gradientStartMode?: 'slot' | 'highlight';
	gradientSize?: number; // 0-100 (% radius/stop for radial modes)
	hotbarLeft?: boolean; // when true, display first 5 player slots as a left column
	// Controls (inventory buttons/inputs)
	controlBg?: string;
	controlHover?: string;
	controlText?: string;
	// Hotbar (first five slots)
	hotslotBg?: string;
	hotslotSync?: boolean; // true: use itemSlot; false: use hotslotBg
};

// Only CSS variable-backed keys should be listed here. Non-var keys (like boolean flags)
// are handled separately via root attributes.
const VAR_MAP: Partial<Record<keyof InventoryTheme, string>> = {
	weightBar: '--theme-weightbar',
	weightBarFg: '--theme-weightbar-fg',
	weightBarBg: '--theme-weightbar-bg',
	durability: '--theme-durability',
	playerName: '--theme-playername',
	itemSlot: '--theme-itemslot',
	hover: '--theme-hover',
	shadow: '--theme-shadow',
	hotslotShadow: '--theme-hotslot-shadow',
	controlBg: '--theme-ctrl-bg',
	controlHover: '--theme-ctrl-hover',
	controlText: '--theme-ctrl-text',
	hotslotBg: '--theme-hotslot-bg',
	gradientStart: '--theme-grad-start',
	gradientEnd: '--theme-grad-end',
	gradientDirection: '--theme-grad-direction',
	gradientMode: '--theme-grad-mode',
	gradientStartMode: '--theme-grad-start-mode',
	gradientSize: '--theme-grad-size',
	hotbarLeft: '--theme-hotbar-left',
};

// --- Color normalization helpers ---
function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

function componentToHex(c: number) {
	const h = clamp(Math.round(c), 0, 255).toString(16);
	return h.length === 1 ? '0' + h : h;
}

function hexToRgb(hex: string) {
	const h = hex.replace('#', '').trim();
	if (h.length === 3) {
		return {
			r: parseInt(h[0] + h[0], 16),
			g: parseInt(h[1] + h[1], 16),
			b: parseInt(h[2] + h[2], 16),
		};
	}
	return {
		r: parseInt(h.substring(0, 2), 16) || 0,
		g: parseInt(h.substring(2, 4), 16) || 0,
		b: parseInt(h.substring(4, 6), 16) || 0,
	};
}

const RGB_RE = /^\s*rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)\s*$/i;
const RGBA_RE = /^\s*rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?(?:\.\d+)?)\s*\)\s*$/i;

export function normalizeColor(input: string | undefined | null): string | undefined {
	if (!input) return undefined;
	const v = String(input).trim();
	if (v.startsWith('#')) {
		const { r, g, b } = hexToRgb(v);
		return `rgba(${clamp(r, 0, 255)},${clamp(g, 0, 255)},${clamp(b, 0, 255)},1)`;
	}
	let m = v.match(RGBA_RE);
	if (m) {
		const r = clamp(Number(m[1]), 0, 255);
		const g = clamp(Number(m[2]), 0, 255);
		const b = clamp(Number(m[3]), 0, 255);
		const a = clamp(Number(m[4]), 0, 1);
		return `rgba(${r},${g},${b},${a})`;
	}
	m = v.match(RGB_RE);
	if (m) {
		const r = clamp(Number(m[1]), 0, 255);
		const g = clamp(Number(m[2]), 0, 255);
		const b = clamp(Number(m[3]), 0, 255);
		return `rgba(${r},${g},${b},1)`;
	}
	// Unknown string, return as-is to avoid breaking custom values
	return v;
}

export function applyTheme(theme: InventoryTheme | null | undefined) {
	if (!theme) return;
	const root = document.documentElement;
	if (!root) return;
	for (const key in theme) {
		const k = key as keyof InventoryTheme;
		const cssVar = VAR_MAP[k];
		const val = theme[k];
		if (!cssVar || val == null) continue;
		// Non-color keys handling
		if (k === 'gradientSize') {
			const num = Math.max(0, Math.min(100, Number(val)));
			root.style.setProperty(cssVar, `${num}%`);
			continue;
		}
		if (k === 'hotbarLeft') {
			root.setAttribute('data-left-hotslots', val ? 'true' : 'false');
			continue;
		}
		const normalized = normalizeColor(String(val));
		root.style.setProperty(cssVar, normalized ?? String(val));
	}
	// Provide derived fallbacks if some vars missing
	// Bridge legacy weightBar -> new fg/bg if not provided
	if (theme.weightBar && !theme.weightBarFg) {
		const v = normalizeColor(theme.weightBar) || theme.weightBar;
		root.style.setProperty('--theme-weightbar-fg', v);
	}
	if (theme.weightBar && !theme.weightBarBg) {
		const v = normalizeColor(theme.weightBar) || theme.weightBar;
		root.style.setProperty('--theme-weightbar-bg', v);
	}
	if (!theme.gradientEnd && theme.itemSlot) {
		root.style.setProperty('--theme-grad-end', theme.itemSlot);
	}
	const startMode = theme.gradientStartMode || 'slot';
	if (startMode === 'slot') {
		if (theme.itemSlot) root.style.setProperty('--theme-grad-start', theme.itemSlot);
	} else {
		if (theme.gradientStart) {
			const val = normalizeColor(theme.gradientStart) || theme.gradientStart;
			root.style.setProperty('--theme-grad-start', val);
		}
	}
	// Root attributes used by CSS to decide gradient rendering without per-slot data attrs
	root.setAttribute('data-grad-mode', theme.gradientMode || 'linear');
	root.setAttribute('data-grad-direction', theme.gradientDirection || 'down');
	// Layout attribute for left-stacked hotslots (player inventory)
	root.setAttribute('data-left-hotslots', theme.hotbarLeft ? 'true' : 'false');
	// Hotbar color sync control
	if (typeof theme.hotslotSync === 'boolean') {
		root.setAttribute('data-hotslot-sync', theme.hotslotSync ? 'true' : 'false');
	}
	// Basic shadow -> inner/outer usage (keep both, consumer CSS can decide)
	if (theme.shadow) {
		root.style.setProperty('--inner-shadow', `0 2px 6px ${theme.shadow}`);
		root.style.setProperty('--outer-shadow', `0 10px 30px ${theme.shadow}`);
	}
}

