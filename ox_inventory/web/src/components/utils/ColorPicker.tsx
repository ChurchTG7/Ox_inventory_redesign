import React, { useMemo, useState, useEffect, useRef } from 'react';

type Props = {
  value?: string;
  onChange: (val: string) => void;
};

// Very small color helper to convert rgba(...) to hex and vice-versa
const rgbaToParts = (rgba: string) => {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 };
};

const toRgbaString = (r: number, g: number, b: number, a = 1) => `rgba(${r},${g},${b},${a})`;

const componentToHex = (c: number) => {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number) => `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
};

const ColorPicker: React.FC<Props> = ({ value = '', onChange }) => {
  const parsed = useMemo(() => rgbaToParts(value), [value]);
  const [r, setR] = useState<number>(parsed?.r ?? 0);
  const [g, setG] = useState<number>(parsed?.g ?? 0);
  const [b, setB] = useState<number>(parsed?.b ?? 0);
  const [a, setA] = useState<number>(parsed?.a ?? 1);
  const [hex, setHex] = useState<string>(() => (parsed ? rgbToHex(parsed.r, parsed.g, parsed.b) : '#000000'));

  useEffect(() => {
    if (parsed) {
      setR(parsed.r);
      setG(parsed.g);
      setB(parsed.b);
      setA(parsed.a);
      setHex(rgbToHex(parsed.r, parsed.g, parsed.b));
    } else if (value && value.startsWith('#')) {
      const p = hexToRgb(value);
      setR(p.r);
      setG(p.g);
      setB(p.b);
      setA(1);
      setHex(value);
    }
  }, [value]);

  const emit = (nr: number, ng: number, nb: number, na: number) => {
    const rgba = toRgbaString(nr, ng, nb, Number(na.toFixed(2)));
    onChange(rgba);
  };

  // Preset colors with human-friendly names and swatches for the dropdown
  const presetOptions = [
    // Grays
    { value: '#000000', label: 'Black' },
    { value: '#1F2937', label: 'Charcoal' },
    { value: '#374151', label: 'Slate' },
    { value: '#9CA3AF', label: 'Gray' },
    { value: '#FFFFFF', label: 'White' },
    // Blues & Cyans
    { value: '#38BDF8', label: 'Sky' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#06B6D4', label: 'Cyan' },
    // Purples & Pinks
    { value: '#8B5CF6', label: 'Violet' },
    { value: '#A855F7', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    // Reds / Oranges / Yellows
    { value: '#EF4444', label: 'Red' },
    { value: '#F97316', label: 'Orange' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#FBBF24', label: 'Yellow' },
    // Greens
    { value: '#6EE7B7', label: 'Mint' },
    { value: '#34D399', label: 'Emerald' },
    { value: '#22C55E', label: 'Green' },
    { value: '#84CC16', label: 'Lime' },
    { value: '#14B8A6', label: 'Teal' },
  ] as const;

  const isPreset = useMemo(() => presetOptions.some(p => p.value.toLowerCase() === hex.toLowerCase()), [hex]);
  const currentPreset = useMemo(() => presetOptions.find(p => p.value.toLowerCase() === hex.toLowerCase()), [hex]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (e.target instanceof Node && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Custom preset dropdown with color swatches */}
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', minWidth: 160 }}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            title="Preset colors"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              backgroundColor: '#1f2127',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '4px 8px',
              borderRadius: 6,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              fontSize: 12,
              width: '100%'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: isPreset ? (currentPreset?.value || '#000') : 'linear-gradient(45deg, #777 0%, #bbb 100%)',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}
              />
              {isPreset ? (currentPreset?.label || 'Preset') : 'Preset Colors'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>▼</span>
          </button>
          {open && (
            <div
              role="listbox"
              className="color-picker-dropdown"
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                marginTop: 4,
                background: '#1f2127',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                maxHeight: 240,
                overflowY: 'auto',
                padding: 4
              }}
            >
              {presetOptions.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="option"
                  onClick={() => {
                    setOpen(false);
                    setHex(p.value);
                    const rgb = hexToRgb(p.value);
                    setR(rgb.r); setG(rgb.g); setB(rgb.b); setA(1);
                    emit(rgb.r, rgb.g, rgb.b, 1);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    background: hex.toLowerCase() === p.value.toLowerCase() ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: p.value,
                      border: '1px solid rgba(255,255,255,0.25)'
                    }}
                  />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={255}
              value={r}
              onChange={(e) => {
                const nr = Math.max(0, Math.min(255, Number(e.target.value || 0)));
                setR(nr);
                setHex(rgbToHex(nr, g, b));
                emit(nr, g, b, a);
              }}
            />
            <div style={{ width: 36, textAlign: 'center' }}>{r}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={255}
              value={g}
              onChange={(e) => {
                const ng = Math.max(0, Math.min(255, Number(e.target.value || 0)));
                setG(ng);
                setHex(rgbToHex(r, ng, b));
                emit(r, ng, b, a);
              }}
            />
            <div style={{ width: 36, textAlign: 'center' }}>{g}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={255}
              value={b}
              onChange={(e) => {
                const nb = Math.max(0, Math.min(255, Number(e.target.value || 0)));
                setB(nb);
                setHex(rgbToHex(r, g, nb));
                emit(r, g, nb, a);
              }}
            />
            <div style={{ width: 36, textAlign: 'center' }}>{b}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{ fontSize: 12, width: 28 }}>A</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={a}
            onChange={(e) => {
              const na = Math.max(0, Math.min(1, Number(e.target.value || 0)));
              setA(na);
              emit(r, g, b, na);
            }}
            style={{ width: 160 }}
          />
          <div style={{ width: 36, textAlign: 'center' }}>{a}</div>
        </div>
        {/** Preset swatches replaced by the single dropdown above for compactness */}
        {/** Removed duplicate preview box to keep the UI compact; the native color input already shows a swatch */}
      </div>
    </div>
  );
};

export default ColorPicker;
