Short-lived confirmation or alert. Auto-dismiss after ~5s unless it has an action.

```jsx
<div style={{position:'fixed',right:16,bottom:16,display:'grid',gap:8,zIndex:'var(--z-toast)'}}>
  <Toast tone="success" title="Fatura enviada" description="#INV-2041 para Atlas Engenharia" onClose={dismiss} />
</div>
```
