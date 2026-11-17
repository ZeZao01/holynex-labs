Modal for confirmations and short forms; becomes a bottom sheet on phones.

```jsx
<Dialog open={open} onClose={close} icon="user-plus" title="Convidar membro" description="Ele receberá um e-mail com o acesso."
  footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button>Enviar convite</Button></>}>
  <Input label="E-mail" />
</Dialog>
```

- Destructive confirmations: `icon="trash-2"` + `<Button variant="danger">`.
