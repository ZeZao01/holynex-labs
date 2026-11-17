window.HN_DATA = (function(){
  var months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var year=[[62,31],[48,39],[56,24],[71,42],[52,33],[60,40],[44,36],[76,44],[64,30],[51,46],[79,38],[68,29]];
  var lastYear=[[41,28],[45,30],[39,31],[52,35],[47,29],[50,33],[43,30],[58,37],[49,32],[55,34],[60,36],[57,31]];
  var cash=function(src){return src.map(function(d,i){return {label:months[i],up:d[0]*1000,down:d[1]*1000};});};
  var clients=[
    {id:'c1',name:'Atlas Engenharia',email:'financeiro@atlaseng.com.br',plan:'Enterprise',mrr:12400,seats:84,status:'Ativo',since:'2023-03-14',owner:'Rafael Nunes'},
    {id:'c2',name:'Verde Agro',email:'ti@verdeagro.com.br',plan:'Pro',mrr:2490,seats:18,status:'Pendente',since:'2024-07-02',owner:'Ana Lima'},
    {id:'c3',name:'Lumen Saúde',email:'contato@lumensaude.com',plan:'Pro',mrr:2490,seats:22,status:'Ativo',since:'2024-01-19',owner:'Caio Prado'},
    {id:'c4',name:'Porto Logística',email:'ops@portolog.com.br',plan:'Enterprise',mrr:9800,seats:61,status:'Ativo',since:'2022-11-08',owner:'Rafael Nunes'},
    {id:'c5',name:'Studio Ária',email:'oi@studioaria.design',plan:'Starter',mrr:490,seats:4,status:'Em teste',since:'2026-11-03',owner:'Ana Lima'},
    {id:'c6',name:'Nimbus Educação',email:'adm@nimbusedu.org',plan:'Pro',mrr:2490,seats:30,status:'Atrasado',since:'2023-09-27',owner:'Caio Prado'},
    {id:'c7',name:'Ferro & Filhos',email:'contas@ferroefilhos.com.br',plan:'Starter',mrr:490,seats:6,status:'Ativo',since:'2025-05-12',owner:'Rafael Nunes'},
    {id:'c8',name:'Órbita Fintech',email:'cto@orbita.finance',plan:'Enterprise',mrr:15200,seats:120,status:'Ativo',since:'2022-04-30',owner:'Ana Lima'}
  ];
  var invoices=[
    {id:'INV-2048',client:'Atlas Engenharia',kind:'Assinatura Enterprise',method:'Pix',date:'2026-11-15',time:'10:00',amount:12400,status:'Pago'},
    {id:'INV-2047',client:'Verde Agro',kind:'Assinatura Pro',method:'Boleto',date:'2026-11-14',time:'14:30',amount:2490,status:'Pendente'},
    {id:'INV-2046',client:'Porto Logística',kind:'Horas de consultoria',method:'Cartão •• 4821',date:'2026-11-12',time:'09:12',amount:6850,status:'Pago'},
    {id:'INV-2045',client:'Nimbus Educação',kind:'Assinatura Pro',method:'Boleto',date:'2026-11-05',time:'08:00',amount:2490,status:'Vencida'},
    {id:'INV-2044',client:'Órbita Fintech',kind:'Assinatura Enterprise',method:'Pix',date:'2026-11-03',time:'11:45',amount:15200,status:'Pago'},
    {id:'INV-2043',client:'Lumen Saúde',kind:'Add-on: Nex AI',method:'Cartão •• 1190',date:'2026-11-02',time:'16:20',amount:890,status:'Pago'},
    {id:'INV-2042',client:'Studio Ária',kind:'Assinatura Starter',method:'Cartão •• 7702',date:'2026-11-01',time:'07:58',amount:490,status:'Pendente'}
  ];
  var growth=[812,840,861,890,915,948,972,1010,1046,1089,1162,1248];
  var growthPrev=[690,702,716,731,748,760,777,790,806,821,838,856];
  var suggestions=[
    {icon:'chart-line',title:'Acompanhar fluxo de caixa',text:'Veja entradas, saídas e margem em tempo real, com projeções para os próximos 90 dias.',prompt:'Resuma o fluxo de caixa de novembro'},
    {icon:'shield-alert',title:'Detectar cobranças incomuns',text:'Alertas para cobranças duplicadas, estornos e picos fora do padrão de cada cliente.',prompt:'Há cobranças duplicadas este mês?'},
    {icon:'users',title:'Prever churn de clientes',text:'Identifique contas com queda de uso e receba um plano de ação para cada uma.',prompt:'Quais clientes têm risco de churn?'},
    {icon:'gauge',title:'Saúde da operação',text:'Uma nota de 0 a 100 combinando receita, inadimplência, uptime e chamados.',prompt:'Explique a nota de saúde da operação'}
  ];
  var answers={
    'Resuma o fluxo de caixa de novembro':'Em novembro entraram **R$ 79.000** e saíram **R$ 38.000**, uma margem de 51,9% — a melhor do ano. O salto veio de dois contratos Enterprise (Atlas Engenharia e Órbita Fintech). As saídas ficaram 17% abaixo de outubro, principalmente por renegociação de infraestrutura.',
    'Há cobranças duplicadas este mês?':'Encontrei **2 cobranças duplicadas**: INV-2047 (Verde Agro, R$ 2.490) foi emitida duas vezes no dia 14, e uma tentativa de cartão da Studio Ária repetiu em 01/11. Quer que eu cancele as duplicatas e avise os clientes?',
    'Quais clientes têm risco de churn?':'Três contas mostram queda de uso acima de 30% nas últimas 4 semanas: **Nimbus Educação** (fatura vencida), **Ferro & Filhos** e **Verde Agro**. Sugiro uma ligação de sucesso do cliente para a Nimbus ainda esta semana.',
    'Explique a nota de saúde da operação':'A nota atual é **92/100**. Receita e uptime (99,98%) estão excelentes; o que puxa para baixo é a inadimplência de 4,1% — concentrada em uma única conta (Nimbus Educação).'
  };
  return {months:months,cash:cash(year),cashPrev:cash(lastYear),clients:clients,invoices:invoices,growth:growth,growthPrev:growthPrev,suggestions:suggestions,answers:answers};
})();
window.HN_FMT = {
  brl: function(v){return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});},
  brl2: function(v){return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});},
  k: function(v){return 'R$'+(Math.abs(v)/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+'k';},
  date: function(s){var p=s.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
};
