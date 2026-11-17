Primary app navigation with brand, account switcher, grouped items and a footer slot. Becomes a drawer on tablets/phones.

```jsx
<Sidebar brand={{logo:'assets/logo-mark.png', name:'HolyNex'}}
  account={{name:'Rafael Nunes', subtitle:'Administrador'}}
  activeId={page} onNavigate={setPage} open={menu} onClose={()=>setMenu(false)}
  sections={[
    {title:'Menu principal', items:[{id:'home',label:'Visão geral',icon:'layout-dashboard'},{id:'ai',label:'Nex AI',icon:'sparkles'}]},
    {title:'Preferências', items:[{id:'settings',label:'Configurações',icon:'settings'}]},
  ]} />
```

- Pair with `<Topbar onMenuClick>` (hamburger shows < 1024px) and `<BottomNav>` (< 768px).
- Active item = white pill + shadow-xs on the grey app background.
