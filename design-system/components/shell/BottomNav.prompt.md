Thumb-reach navigation on phones; mirrors the 4 most-used Sidebar destinations. The full Sidebar stays reachable from the Topbar hamburger.

```jsx
<BottomNav activeId={page} onNavigate={setPage} primary={{icon:'sparkles',label:'Nex AI',onClick:openAI}}
  items={[{id:'home',label:'Início',icon:'layout-dashboard'},{id:'clients',label:'Clientes',icon:'users'},{id:'billing',label:'Faturas',icon:'receipt-text'},{id:'settings',label:'Ajustes',icon:'settings'}]} />
```
