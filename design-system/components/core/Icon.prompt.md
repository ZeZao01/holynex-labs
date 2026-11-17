Renders a Lucide outline glyph from the self-hosted icon font — use for every icon in HolyNex UI.

```jsx
<Icon name="layout-dashboard" />
<Icon name="sparkles" size={20} color="var(--accent)" label="IA" />
```

- Names are Lucide kebab-case (https://lucide.dev/icons). Default 18px; 16px in dense tables, 20px in nav.
- Inherits `currentColor`; pass `color` only for accents.
