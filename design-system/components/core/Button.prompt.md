Pill-shaped action button; one `primary` per view, `dark` for the paired secondary CTA, `secondary` for everything else.

```jsx
<Button variant="primary" iconRight="arrow-up-right">Enviar</Button>
<Button variant="secondary" iconLeft="download">Exportar</Button>
<Button variant="dark" size="lg" fullWidth shape="rounded">Continuar</Button>
```

- Variants: primary · dark · secondary · soft · ghost · danger. Sizes sm/md/lg (32/40/48px).
- `shape="rounded"` (10px radius) only for full-width submit buttons inside cards.
- `loading` swaps the left icon for a spinner and disables the button.
