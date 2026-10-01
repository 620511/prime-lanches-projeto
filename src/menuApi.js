import { supabase } from './supabaseClient.js';

const IMAGE_BUCKET = 'menu-images';

function fromDb(row) {
  return {
    id: row.id,
    cat: row.cat,
    name: row.name,
    desc: row.description,
    price: Number(row.price),
    emoji: row.emoji,
    tag: row.tag,
    available: row.available,
    imageUrl: row.image_url || null,
  };
}

function toDb(item) {
  return {
    id: item.id,
    cat: item.cat,
    name: item.name,
    description: item.desc,
    price: item.price,
    emoji: item.emoji,
    tag: item.tag,
    available: item.available,
    image_url: item.imageUrl ?? null,
  };
}

export async function uploadMenuImage(file, itemId) {
  const ext = file.name.split('.').pop();
  const path = `${itemId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchMenu() {
  const { data, error } = await supabase.from('menu').select('*').order('cat');
  if (error) {
    console.error('Erro ao buscar cardápio:', error.message);
    return [];
  }
  return data.map(fromDb);
}

export async function addMenuItem(item) {
  const id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + Date.now().toString(36).slice(-4);
  const row = toDb({ ...item, id, available: true });
  const { data, error } = await supabase.from('menu').insert([row]).select();
  if (error) throw error;
  return fromDb(data[0]);
}

export async function updateMenuItem(id, fields) {
  const row = {};
  if ('price' in fields) row.price = fields.price;
  if ('available' in fields) row.available = fields.available;
  if ('desc' in fields) row.description = fields.desc;
  if ('name' in fields) row.name = fields.name;
  if ('imageUrl' in fields) row.image_url = fields.imageUrl;
  const { error } = await supabase.from('menu').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('menu').delete().eq('id', id);
  if (error) throw error;
}


const PAYMENT_LABELS = {
  pix: 'Pix',
  card: 'Cartão na entrega',
  cash: 'Dinheiro',
};

// Registra um evento no histórico do JARVIS. Nunca deve derrubar o
// fluxo do pedido: se o log falhar, só avisamos no console.
async function registrarEventoJarvis(type, orderId, payload) {
  const { error } = await supabase
    .from('jarvis_events')
    .insert([{ type, order_id: orderId, payload }]);
  if (error) console.error('[JARVIS] Falha ao registrar evento:', error.message);
}

export async function createOrder(order) {
  const row = {
    id: order.id,
    number: order.number,
    created_at: order.createdAt,
    customer: order.customer,
    order_type: order.orderType,
    items: order.items,
    subtotal: order.subtotal,
    total: order.total,
    payment: order.payment,
    payment_label: PAYMENT_LABELS[order.payment] || order.payment,
    status: 'novo',
  };

  const { data, error } = await supabase.from('orders').insert([row]).select().single();
  if (error) throw error;

  registrarEventoJarvis('ORDER_CREATED', data.id, {
    numero: data.number,
    cliente: data.customer?.name,
    total: data.total,
  });

  return data;
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function updateOrderStatus(id, status) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;

  registrarEventoJarvis('ORDER_STATUS_CHANGED', id, { para: status });
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;

  registrarEventoJarvis('ORDER_DELETED', id, null);
}

/**
 * Busca os pedidos do mês corrente pra cima — usado pelo relatório de
 * vendas (dia/semana/mês). Separado do fetchOrders() do painel
 * operacional porque aquele é limitado aos 100 mais recentes (o
 * suficiente pro dia a dia, mas pode não cobrir o mês inteiro numa
 * loja com bastante movimento).
 */
export async function fetchOrdersParaRelatorio() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('id, number, created_at, total, status')
    .gte('created_at', inicioMes.toISOString())
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) throw error;
  return data || [];
}

export async function fetchOrderById(id) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

/**
 * Assina atualizações de UM pedido específico — usado pela tela de
 * acompanhamento do cliente. Chama onAtualizar(pedido) sempre que o
 * status mudar (ex: a loja aceitou, colocou em preparo, etc).
 */
export function assinarPedido(orderId, onAtualizar) {
  const canal = supabase
    .channel(`pedido-${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => onAtualizar(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(canal);
}

/**
 * Assina o Realtime do Supabase para receber pedidos novos assim que
 * são gravados no banco — sem depender do polling de 8 em 8 segundos.
 * Chame isso uma vez (ex: dentro de um useEffect) e guarde o retorno
 * para cancelar a assinatura (unsubscribe) ao desmontar o componente.
 *
 * onNovoPedido(pedido) é chamado com a linha completa do pedido inserido.
 */
export function assinarNovosPedidos(onNovoPedido) {
  const canal = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => onNovoPedido(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(canal);
}
