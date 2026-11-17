/* Dev-only fallback: if _ds_bundle.js hasn't been compiled yet, build the namespace from component sources (sync). No-op otherwise. */
(function(){
  var NS='HolyNexDesignSystem_40df70';
  if (window[NS]) return;
  var me=document.currentScript.src; var root=me.replace(/tools\/ds-fallback\.js.*$/,'');
  var list=["core/Icon","core/Button","core/IconButton","forms/Input","forms/Select","forms/Checkbox","forms/Radio","forms/Switch","display/Card","display/Badge","display/Chip","display/Avatar","display/Progress","display/StatCard","navigation/Tabs","navigation/Breadcrumb","navigation/Pagination","feedback/Dialog","feedback/Toast","feedback/Tooltip","data/DataTable","data/BarChart","data/AreaChart","data/DonutChart","shell/Sidebar","shell/Topbar","shell/BottomNav"];
  var src='', names=[];
  list.forEach(function(p){
    var x=new XMLHttpRequest(); x.open('GET', root+'components/'+p+'.jsx', false); x.send();
    var t=x.responseText.replace(/^import .*$/mg,'').replace(/export function (\w+)/g,function(m,n){names.push(n);return 'function '+n;});
    src+=t+'\n';
  });
  src+='\nwindow["'+NS+'"]={'+names.join(',')+'};';
  var out=Babel.transform(src,{presets:['react']}).code;
  (0,eval)('(function(){'+out+'})()');
})();
