Single-line text field; also the global search (with `iconLeft="search"` + `kbd`).

```jsx
<Input label="E-mail" placeholder="voce@holynex.com.br" />
<Input iconLeft="search" placeholder="Buscar qualquer coisa" kbd={['⌘','K']} />
<Input label="Valor" suffix="BRL" error="Informe um valor válido" />
```

- Labels sit above, 12px medium. Hints 12px grey; errors replace hints in danger-700.
- `variant="sunken"` for fields that live inside cards (filters, composer).
