Sticky page header inside the content column.

```jsx
<Topbar title="Visão geral" subtitle="Acompanhe receita, clientes e operações em tempo real."
  search={{}} onMenuClick={()=>setMenu(true)}
  actions={<><IconButton icon="bell" label="Notificações" dot /><IconButton icon="circle-help" label="Ajuda" /></>}
  user={{name:'Rafael Nunes'}} />
```
