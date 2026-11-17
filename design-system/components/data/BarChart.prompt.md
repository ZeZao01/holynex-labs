Monthly in/out comparison (diverging) or simple column series.

```jsx
<BarChart height={180} highlight={5} format={v => 'R$' + (v/1000) + 'k'}
  data={[{label:'Jan',up:6200,down:3100},{label:'Fev',up:4800,down:3900}]} />
```
