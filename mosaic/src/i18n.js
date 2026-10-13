// Textos de Mosaic (pantalla de cocina) en varios idiomas. Pedido de Pablo 13-10-2026.
// El idioma se comparte con el POS de URY: localStorage 'ury_language' (es, pt, zh-TW, zh, en).
const T = {
  en: {
    not_permitted: 'Not Permitted', login_to_access: 'Log in to access this page.', login: 'Login',
    no_active_orders: 'No active orders for {production}', confirm: 'Confirm', serve: 'Serve',
    aggregator: 'Aggregator', aggregator_id: 'Aggregator ID', order: 'Order', old_qty: 'Old Qty', takeaway: 'Takeaway',
    duplicate_kot: '( Duplicate KOT ( CHECK WITH CAPTAIN ) )', order_delayed: 'Order Delayed', invoice: 'Invoice', order_no: 'Order #',
    table: 'Table', time: 'Time', online: 'You are online', offline: 'You are Offline',
    type_cancelled: 'Cancelled', type_partially_cancelled: 'Partially cancelled', type_duplicate: 'Duplicate', type_modified: 'Order Modified',
    production_unit: 'Production Unit', active: 'Active', served: 'Served', total: 'Total', click_to_view: 'Click to view KOTs',
    loading_dashboard: 'Loading Production Dashboard...', switch_to_dashboard: 'Switch to Dashboard', logout: 'Logout', language: 'Language',
    username: 'Username:', password: 'Password:', sign_in: 'Sign in',
  },
  es: {
    not_permitted: 'Sin permiso', login_to_access: 'Iniciá sesión para ver esta pantalla.', login: 'Iniciar sesión',
    no_active_orders: 'No hay pedidos activos en {production}', confirm: 'Confirmar', serve: 'Servir',
    aggregator: 'Agregador', aggregator_id: 'ID agregador', order: 'Pedido', old_qty: 'Cant. anterior', takeaway: 'Para llevar',
    duplicate_kot: '( Comanda duplicada ( CONSULTAR AL ENCARGADO ) )', order_delayed: 'Pedido demorado', invoice: 'Cuenta', order_no: 'Pedido Nº',
    table: 'Mesa', time: 'Hora', online: 'Conectado', offline: 'Sin conexión',
    type_cancelled: 'Anulado', type_partially_cancelled: 'Anulado en parte', type_duplicate: 'Duplicado', type_modified: 'Pedido modificado',
    production_unit: 'Unidad de producción', active: 'Activos', served: 'Servidos', total: 'Total', click_to_view: 'Tocá para ver las comandas',
    loading_dashboard: 'Cargando el tablero de producción...', switch_to_dashboard: 'Ir al tablero', logout: 'Cerrar sesión', language: 'Idioma',
    username: 'Usuario:', password: 'Contraseña:', sign_in: 'Entrar',
  },
  pt: {
    not_permitted: 'Sem permissão', login_to_access: 'Faça login para ver esta tela.', login: 'Entrar',
    no_active_orders: 'Não há pedidos ativos em {production}', confirm: 'Confirmar', serve: 'Servir',
    aggregator: 'Agregador', aggregator_id: 'ID agregador', order: 'Pedido', old_qty: 'Qtd. anterior', takeaway: 'Para viagem',
    duplicate_kot: '( Comanda duplicada ( CONFIRMAR COM O RESPONSÁVEL ) )', order_delayed: 'Pedido atrasado', invoice: 'Conta', order_no: 'Pedido nº',
    table: 'Mesa', time: 'Hora', online: 'Conectado', offline: 'Sem conexão',
    type_cancelled: 'Cancelado', type_partially_cancelled: 'Cancelado em parte', type_duplicate: 'Duplicado', type_modified: 'Pedido alterado',
    production_unit: 'Unidade de produção', active: 'Ativos', served: 'Servidos', total: 'Total', click_to_view: 'Toque para ver as comandas',
    loading_dashboard: 'Carregando o painel de produção...', switch_to_dashboard: 'Ir ao painel', logout: 'Sair', language: 'Idioma',
    username: 'Usuário:', password: 'Senha:', sign_in: 'Entrar',
  },
  'zh-TW': {
    not_permitted: '無權限', login_to_access: '請登入以檢視此頁面。', login: '登入',
    no_active_orders: '{production} 目前沒有進行中的訂單', confirm: '確認', serve: '出餐',
    aggregator: '外送平台', aggregator_id: '平台單號', order: '訂單', old_qty: '原數量', takeaway: '外帶',
    duplicate_kot: '（重複廚房單（請與領班確認））', order_delayed: '訂單延遲', invoice: '帳單', order_no: '訂單號',
    table: '桌號', time: '時間', online: '已連線', offline: '離線',
    type_cancelled: '已取消', type_partially_cancelled: '部分取消', type_duplicate: '重複', type_modified: '訂單已修改',
    production_unit: '製作單位', active: '進行中', served: '已出餐', total: '合計', click_to_view: '點選查看廚房單',
    loading_dashboard: '載入製作看板中...', switch_to_dashboard: '前往看板', logout: '登出', language: '語言',
    username: '帳號：', password: '密碼：', sign_in: '登入',
  },
  zh: {
    not_permitted: '无权限', login_to_access: '请登录以查看此页面。', login: '登录',
    no_active_orders: '{production} 目前没有进行中的订单', confirm: '确认', serve: '出餐',
    aggregator: '外卖平台', aggregator_id: '平台单号', order: '订单', old_qty: '原数量', takeaway: '外带',
    duplicate_kot: '（重复厨房单（请与领班确认））', order_delayed: '订单延迟', invoice: '账单', order_no: '订单号',
    table: '桌号', time: '时间', online: '已连接', offline: '离线',
    type_cancelled: '已取消', type_partially_cancelled: '部分取消', type_duplicate: '重复', type_modified: '订单已修改',
    production_unit: '制作单位', active: '进行中', served: '已出餐', total: '合计', click_to_view: '点击查看厨房单',
    loading_dashboard: '加载制作看板中...', switch_to_dashboard: '前往看板', logout: '退出', language: '语言',
    username: '账号：', password: '密码：', sign_in: '登录',
  },
};
const ALIAS = { 'pt-BR': 'pt', 'zh-CN': 'zh', 'zh-Hans': 'zh', 'zh-Hant': 'zh-TW', 'zh-HK': 'zh-TW' };
export const LANGUAGES = [['es', 'Español'], ['pt', 'Português'], ['zh-TW', '繁體中文'], ['zh', '简体中文'], ['en', 'English']];

export function currentLanguage() {
  let l = null;
  try { l = localStorage.getItem('ury_language'); } catch (e) { /* sin storage */ }
  if (!l && typeof navigator !== 'undefined') l = navigator.language || '';
  l = ALIAS[l] || l;
  if (T[l]) return l;
  const base = String(l || '').split('-')[0];
  return T[base] ? base : 'en';
}

export function setLanguage(l) {
  try { localStorage.setItem('ury_language', l); } catch (e) { /* sin storage */ }
  window.location.reload();
}

export function t(key, vars) {
  const l = currentLanguage();
  let s = (T[l] && T[l][key]) || T.en[key] || key;
  if (vars) Object.keys(vars).forEach((k) => { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}

/** Tipo de comanda (valor de URY en inglés) traducido para mostrar. */
export function kotType(type) {
  const m = { Cancelled: 'type_cancelled', 'Partially cancelled': 'type_partially_cancelled', Duplicate: 'type_duplicate', 'Order Modified': 'type_modified' };
  return m[type] ? t(m[type]) : type;
}

export default { t, kotType, currentLanguage, setLanguage, LANGUAGES };
