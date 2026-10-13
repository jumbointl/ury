// Textos del autopedido (QR / kiosco / tablet) en varios idiomas. Pedido de Pablo 13-10-2026.
// El cliente no inicia sesión: el idioma sale de ?lang=, de localStorage 'ury_language' (si la
// tablet la configuró el personal), del navegador, o del idioma del sitio que manda el servidor.
type Dict = Record<string, string>
const T: Record<string, Dict> = {
  en: {
    invoice_title: 'Invoice details', invoice_hint: 'Enter your tax ID or ID number and name to get the invoice in your name; otherwise it goes as final consumer.', doc_label: 'Tax ID (RUC) or ID number', name_label: 'Name or company name', bill_with_name: 'Request bill with invoice in my name', bill_no_name: 'Request bill without name', cancel: 'Cancel', invoice_to: 'Invoice to: {name}',
    loading_menu: 'Loading menu…', starting_up: 'Starting up…',
    device_error: 'This device could not be started. Please contact staff.', device_bootstrap_error: 'Unable to bootstrap this device.',
    missing_code: 'This link is missing an ordering code. Please rescan the QR code on your table.',
    load_error: 'Unable to load the menu. Please rescan the QR code.', order_error: 'Could not place the order. Please try again.',
    bill_error: 'Could not request the bill. Please ask staff for help.', payment_error: 'Could not start online payment. Please pay at the counter.',
    start_over_confirm: 'Start over? Your current cart will be cleared.', new_order_confirm: 'Start a new order? Current cart will be cleared.',
    pickup_title: 'Order for Pickup', table_title: 'Table {table}', order: 'Order', start_over: 'Start Over', new_order: 'New Order',
    your_order: 'Your order so far', pickup_code: 'Pickup code: {code}', total: 'Total',
    starting_payment: 'Starting payment…', pay_online: 'Pay Online',
    payment_request_created: 'Payment request created ({amount} {currency}) — a staff member will assist with payment.',
    bill_requested: 'Bill requested — staff notified', request_bill: 'Request Bill', in_cart: 'In cart: {qty}',
    remove_one: 'Remove one {item}', add_one: 'Add one more {item}', items_one: '{n} item', items_other: '{n} items',
    placing: 'Placing order…', place_order: 'Place Order', cart: 'Cart', tap_to_add: 'Tap a menu item to add it to your cart.',
    still_there: 'Still there?', im_here: "I'm still here", other: 'Other', all: 'All', menu_categories: 'Menu categories',
    assign_tablet: 'Assign This Tablet', enter_pin: 'Enter staff PIN', pin_entry: 'PIN entry', continue: 'Continue',
    enter_table: 'Enter table name or code', table_placeholder: 'e.g. T12', assigning: 'Assigning…', assign_table: 'Assign Table', back: 'Back',
    not_provisioned: 'This tablet is not provisioned. Please contact staff.',
    assign_error: 'Could not assign this table. Please check the PIN and try again.',
  },
  es: {
    invoice_title: 'Datos para la factura', invoice_hint: 'Cargá tu RUC o cédula y tu nombre para que la factura salga a tu nombre; si no, va como consumidor final.', doc_label: 'RUC o cédula', name_label: 'Nombre o razón social', bill_with_name: 'Pedir la cuenta con factura a mi nombre', bill_no_name: 'Pedir la cuenta sin nombre', cancel: 'Cancelar', invoice_to: 'Factura a nombre de: {name}',
    loading_menu: 'Cargando el menú…', starting_up: 'Iniciando…',
    device_error: 'No se pudo iniciar este dispositivo. Avisá al personal.', device_bootstrap_error: 'No se pudo iniciar este dispositivo.',
    missing_code: 'A este enlace le falta el código de pedido. Volvé a escanear el QR de tu mesa.',
    load_error: 'No se pudo cargar el menú. Volvé a escanear el QR.', order_error: 'No se pudo enviar el pedido. Probá de nuevo.',
    bill_error: 'No se pudo pedir la cuenta. Pedile ayuda al personal.', payment_error: 'No se pudo iniciar el pago en línea. Pagá en caja.',
    start_over_confirm: '¿Empezar de nuevo? Se vacía el carrito.', new_order_confirm: '¿Nuevo pedido? Se vacía el carrito actual.',
    pickup_title: 'Pedido para retirar', table_title: 'Mesa {table}', order: 'Pedido', start_over: 'Empezar de nuevo', new_order: 'Nuevo pedido',
    your_order: 'Tu pedido hasta ahora', pickup_code: 'Código de retiro: {code}', total: 'Total',
    starting_payment: 'Iniciando el pago…', pay_online: 'Pagar en línea',
    payment_request_created: 'Pago solicitado ({amount} {currency}): el personal te va a ayudar a pagar.',
    bill_requested: 'Cuenta pedida: ya avisamos al personal', request_bill: 'Pedir la cuenta', in_cart: 'En el carrito: {qty}',
    remove_one: 'Quitar un {item}', add_one: 'Agregar otro {item}', items_one: '{n} artículo', items_other: '{n} artículos',
    placing: 'Enviando el pedido…', place_order: 'Hacer el pedido', cart: 'Carrito', tap_to_add: 'Tocá un plato para agregarlo al carrito.',
    still_there: '¿Seguís ahí?', im_here: 'Sigo acá', other: 'Otros', all: 'Todos', menu_categories: 'Categorías del menú',
    assign_tablet: 'Asignar esta tablet', enter_pin: 'Ingresá el PIN del personal', pin_entry: 'Ingreso de PIN', continue: 'Continuar',
    enter_table: 'Ingresá el nombre o código de la mesa', table_placeholder: 'p. ej. Mesa 5', assigning: 'Asignando…', assign_table: 'Asignar mesa', back: 'Volver',
    not_provisioned: 'Esta tablet no está registrada. Avisá al personal.',
    assign_error: 'No se pudo asignar la mesa. Revisá el PIN y probá de nuevo.',
  },
  pt: {
    invoice_title: 'Dados para a nota fiscal', invoice_hint: 'Informe seu RUC ou documento e seu nome para a nota sair em seu nome; se não, vai como consumidor final.', doc_label: 'RUC ou documento', name_label: 'Nome ou razão social', bill_with_name: 'Pedir a conta com nota em meu nome', bill_no_name: 'Pedir a conta sem nome', cancel: 'Cancelar', invoice_to: 'Nota em nome de: {name}',
    loading_menu: 'Carregando o cardápio…', starting_up: 'Iniciando…',
    device_error: 'Não foi possível iniciar este dispositivo. Avise a equipe.', device_bootstrap_error: 'Não foi possível iniciar este dispositivo.',
    missing_code: 'Este link não tem o código do pedido. Escaneie novamente o QR da sua mesa.',
    load_error: 'Não foi possível carregar o cardápio. Escaneie o QR novamente.', order_error: 'Não foi possível enviar o pedido. Tente novamente.',
    bill_error: 'Não foi possível pedir a conta. Peça ajuda à equipe.', payment_error: 'Não foi possível iniciar o pagamento on-line. Pague no caixa.',
    start_over_confirm: 'Recomeçar? O carrinho será esvaziado.', new_order_confirm: 'Novo pedido? O carrinho atual será esvaziado.',
    pickup_title: 'Pedido para retirada', table_title: 'Mesa {table}', order: 'Pedido', start_over: 'Recomeçar', new_order: 'Novo pedido',
    your_order: 'Seu pedido até agora', pickup_code: 'Código de retirada: {code}', total: 'Total',
    starting_payment: 'Iniciando o pagamento…', pay_online: 'Pagar on-line',
    payment_request_created: 'Pagamento solicitado ({amount} {currency}): a equipe vai ajudar com o pagamento.',
    bill_requested: 'Conta pedida: a equipe foi avisada', request_bill: 'Pedir a conta', in_cart: 'No carrinho: {qty}',
    remove_one: 'Remover um {item}', add_one: 'Adicionar mais um {item}', items_one: '{n} item', items_other: '{n} itens',
    placing: 'Enviando o pedido…', place_order: 'Fazer o pedido', cart: 'Carrinho', tap_to_add: 'Toque um item para adicioná-lo ao carrinho.',
    still_there: 'Ainda está aí?', im_here: 'Ainda estou aqui', other: 'Outros', all: 'Todos', menu_categories: 'Categorias do cardápio',
    assign_tablet: 'Atribuir este tablet', enter_pin: 'Digite o PIN da equipe', pin_entry: 'Entrada do PIN', continue: 'Continuar',
    enter_table: 'Digite o nome ou código da mesa', table_placeholder: 'ex.: Mesa 5', assigning: 'Atribuindo…', assign_table: 'Atribuir mesa', back: 'Voltar',
    not_provisioned: 'Este tablet não está registrado. Avise a equipe.',
    assign_error: 'Não foi possível atribuir a mesa. Verifique o PIN e tente novamente.',
  },
  'zh-TW': {
    invoice_title: '發票資料', invoice_hint: '輸入您的統編（RUC）或證件號碼與姓名，發票將開立在您的名下；否則以一般消費者開立。', doc_label: 'RUC 或證件號碼', name_label: '姓名或公司名稱', bill_with_name: '結帳並開立我的發票', bill_no_name: '結帳（不開立抬頭）', cancel: '取消', invoice_to: '發票抬頭：{name}',
    loading_menu: '載入菜單中…', starting_up: '啟動中…',
    device_error: '無法啟動此裝置，請聯絡服務人員。', device_bootstrap_error: '無法啟動此裝置。',
    missing_code: '此連結缺少點餐代碼，請重新掃描桌上的 QR code。',
    load_error: '無法載入菜單，請重新掃描 QR code。', order_error: '無法送出訂單，請再試一次。',
    bill_error: '無法要求結帳，請聯絡服務人員。', payment_error: '無法開始線上付款，請至櫃檯付款。',
    start_over_confirm: '要重新開始嗎？購物車將被清空。', new_order_confirm: '要開始新訂單嗎？目前的購物車將被清空。',
    pickup_title: '外帶自取訂單', table_title: '桌號 {table}', order: '訂單', start_over: '重新開始', new_order: '新訂單',
    your_order: '您目前的訂單', pickup_code: '取餐代碼：{code}', total: '合計',
    starting_payment: '正在開始付款…', pay_online: '線上付款',
    payment_request_created: '已建立付款請求（{amount} {currency}），服務人員將協助您付款。',
    bill_requested: '已要求結帳，已通知服務人員', request_bill: '要求結帳', in_cart: '購物車：{qty}',
    remove_one: '減少一份{item}', add_one: '再加一份{item}', items_one: '{n} 項', items_other: '{n} 項',
    placing: '送出訂單中…', place_order: '送出訂單', cart: '購物車', tap_to_add: '點選菜單項目加入購物車。',
    still_there: '還在嗎？', im_here: '我還在', other: '其他', all: '全部', menu_categories: '菜單分類',
    assign_tablet: '指派此平板', enter_pin: '請輸入員工 PIN', pin_entry: '輸入 PIN', continue: '繼續',
    enter_table: '請輸入桌名或代碼', table_placeholder: '例如：Mesa 5', assigning: '指派中…', assign_table: '指派桌號', back: '返回',
    not_provisioned: '此平板尚未登記，請聯絡服務人員。',
    assign_error: '無法指派桌號，請確認 PIN 後再試。',
  },
  zh: {
    invoice_title: '发票信息', invoice_hint: '输入您的税号（RUC）或证件号码和姓名，发票将开在您的名下；否则按普通消费者开具。', doc_label: 'RUC 或证件号码', name_label: '姓名或公司名称', bill_with_name: '结账并开具我的发票', bill_no_name: '结账（不开抬头）', cancel: '取消', invoice_to: '发票抬头：{name}',
    loading_menu: '加载菜单中…', starting_up: '启动中…',
    device_error: '无法启动此设备，请联系服务人员。', device_bootstrap_error: '无法启动此设备。',
    missing_code: '此链接缺少点餐代码，请重新扫描桌上的二维码。',
    load_error: '无法加载菜单，请重新扫描二维码。', order_error: '无法提交订单，请再试一次。',
    bill_error: '无法请求结账，请联系服务人员。', payment_error: '无法开始在线支付，请到柜台付款。',
    start_over_confirm: '要重新开始吗？购物车将被清空。', new_order_confirm: '要开始新订单吗？当前购物车将被清空。',
    pickup_title: '自取订单', table_title: '桌号 {table}', order: '订单', start_over: '重新开始', new_order: '新订单',
    your_order: '您目前的订单', pickup_code: '取餐代码：{code}', total: '合计',
    starting_payment: '正在开始付款…', pay_online: '在线支付',
    payment_request_created: '已创建付款请求（{amount} {currency}），服务人员将协助您付款。',
    bill_requested: '已请求结账，已通知服务人员', request_bill: '请求结账', in_cart: '购物车：{qty}',
    remove_one: '减少一份{item}', add_one: '再加一份{item}', items_one: '{n} 项', items_other: '{n} 项',
    placing: '提交订单中…', place_order: '提交订单', cart: '购物车', tap_to_add: '点击菜单项目加入购物车。',
    still_there: '还在吗？', im_here: '我还在', other: '其他', all: '全部', menu_categories: '菜单分类',
    assign_tablet: '指派此平板', enter_pin: '请输入员工 PIN', pin_entry: '输入 PIN', continue: '继续',
    enter_table: '请输入桌名或代码', table_placeholder: '例如：Mesa 5', assigning: '指派中…', assign_table: '指派桌号', back: '返回',
    not_provisioned: '此平板尚未登记，请联系服务人员。',
    assign_error: '无法指派桌号，请确认 PIN 后再试。',
  },
}
const ALIAS: Record<string, string> = { 'pt-BR': 'pt', 'pt-PT': 'pt', 'zh-CN': 'zh', 'zh-Hans': 'zh', 'zh-Hant': 'zh-TW', 'zh-HK': 'zh-TW', 'zh-MO': 'zh-TW' }

function normalize(l: string | null | undefined): string | null {
  if (!l) return null
  if (T[l]) return l
  if (ALIAS[l]) return ALIAS[l]
  const base = l.split('-')[0]
  return T[base] ? base : null
}

let explicit: string | null = null
try {
  explicit = normalize(new URLSearchParams(window.location.search).get('lang')) || normalize(localStorage.getItem('ury_language'))
} catch {
  explicit = null
}
let fromBrowser: string | null = null
for (const l of navigator.languages || [navigator.language]) {
  fromBrowser = normalize(l)
  if (fromBrowser) break
}
let fromSite: string | null = null

export function currentLanguage(): string {
  return explicit || fromBrowser || fromSite || 'en'
}

/** Idioma del sitio que manda el servidor en el contexto: sólo se usa si el navegador no pide uno conocido. */
export function setSiteLanguage(l: string | null | undefined) {
  fromSite = normalize(l)
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const lang = currentLanguage()
  let s = (T[lang] && T[lang][key]) || T.en[key] || key
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]))
  return s
}

export function tItems(n: number): string {
  return t(n === 1 ? 'items_one' : 'items_other', { n })
}
