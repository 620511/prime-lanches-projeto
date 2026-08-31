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
