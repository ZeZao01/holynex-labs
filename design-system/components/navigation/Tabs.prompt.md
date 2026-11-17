Switch views inside a card (`underline`) or filter a dataset (`segmented`).

```jsx
<Tabs value={tab} onChange={setTab} items={[{id:'in',label:'Entradas',meta:'(R$ 4.800)'},{id:'out',label:'Saídas',meta:'(R$ 3.500)'}]} fullWidth />
<Tabs variant="segmented" size="sm" value={p} onChange={setP} items={['Dia','Semana','Mês']} />
```
