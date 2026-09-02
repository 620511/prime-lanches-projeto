import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchMenu, addMenuItem, updateMenuItem, deleteMenuItem, uploadMenuImage } from './menuApi.js';
import {
  Flame, ShoppingBag, Plus, Minus, X, MapPin, Clock, Banknote,
  QrCode, CreditCard, Check, ChevronRight, ChevronLeft, Star,
  Trash2, Store, Bike, Search, MessageSquare, AlertTriangle,
  MessageCircle
} from 'lucide-react';

/* ---------------------------------------------------------------- */
/* TOKENS                                                            */
/* ---------------------------------------------------------------- */
const C = {
  void: '#150907',
  voidDeep: '#0d0503',
  ember: '#2a130c',
  emberLight: '#3c1c11',
  emberBorder: '#4a2415',
  red: '#b8232a',
  redDark: '#7d1418',
  redGlow: '#e6383f',
  gold: '#f2b13a',
  goldLight: '#ffe6a8',
  goldDim: '#c98f2c',
  cream: '#f7ead0',
  creamDim: '#cdb794',
  charcoal: '#231108',
};

const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY = "'Manrope', sans-serif";

/* Pedido vai direto pro WhatsApp da loja — sem backend, sem banco de dados */
const WHATSAPP_NUMBER = '5585999168937';

/* ---------------------------------------------------------------- */
/* DATA                                                               */
/* ---------------------------------------------------------------- */
const CATEGORIES = ['Combos', 'Hambúrguer', 'Porções', 'Bebidas', 'Pastel'];
const ADMIN_PASSCODE = '2030';


const PAYMENTS = [
  { id: 'pix', label: 'Pix', icon: QrCode, hint: 'Combinar chave com a loja no WhatsApp' },
  { id: 'card', label: 'Cartão na entrega', icon: CreditCard, hint: 'Crédito ou débito na maquininha' },
  { id: 'cash', label: 'Dinheiro', icon: Banknote, hint: 'Troco combinado com o entregador' },
];

const money = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* ---------------------------------------------------------------- */
/* WHATSAPP ORDER MESSAGE                                             */
/* ---------------------------------------------------------------- */
function buildWhatsAppMessage(order) {
  const lines = [];
  lines.push(`*Novo pedido Prime Lanches — ${order.number}*`);
  lines.push('');
  order.items.forEach((i) => lines.push(`${i.qty}x ${i.name} — ${money(i.price * i.qty)}`));
  lines.push('');
  lines.push(`Subtotal: ${money(order.subtotal)}`);
  if (order.orderType === 'entrega') {
    lines.push('Taxa de entrega: a combinar com a loja');
  }
  lines.push(`*Total: ${money(order.total)}*`);
  lines.push('');
  lines.push(order.orderType === 'entrega' ? '*Entrega*' : '*Retirada no balcão*');
  lines.push(`Nome: ${order.customer.name}`);
  lines.push(`Telefone: ${order.customer.phone}`);
  if (order.orderType === 'entrega') {
    lines.push(`Endereço: ${order.customer.address}${order.customer.complement ? `, ${order.customer.complement}` : ''}`);
  }
  lines.push(`Pagamento: ${PAYMENTS.find((p) => p.id === order.payment)?.label}`);
  if (order.customer.notes) lines.push(`Obs: ${order.customer.notes}`);
  return lines.join('\n');
}

function whatsappLink(order) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
}

/* ---------------------------------------------------------------- */
/* LOGO                                                               */
/* ---------------------------------------------------------------- */
function PrimeLogo({ size = 'md' }) {
  const dims = size === 'lg' ? 220 : 62;
  const isLg = size === 'lg';
  return (
    <img
      src="/logo.jpg"
      alt="Prime Lanches"
      style={{
        width: dims, height: dims, borderRadius: '50%', display: 'block',
        filter: isLg ? 'drop-shadow(0 12px 30px rgba(184,35,42,0.35))' : 'none',
      }}
    />
  );
}

function Field({ label, value, onChange, placeholder, icon: Icon }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, color: C.creamDim, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={13} />} {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', marginTop: 6, background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 10, padding: '11px 12px', color: C.cream, fontSize: 13.5 }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* MAIN APP                                                           */
/* ---------------------------------------------------------------- */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  ::selection { background: ${C.gold}; color: ${C.charcoal}; }
  button { font-family: inherit; cursor: pointer; }
  input, textarea, select { font-family: inherit; }
  input:focus, textarea:focus, button:focus-visible, select:focus { outline: 2px solid ${C.gold}; outline-offset: 2px; }
  @keyframes flicker { 0%,100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.08) rotate(-2deg); } }
  @keyframes flickerPlain { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.85; } }
  @keyframes emberRise { 0% { transform: translateY(0) scale(1); opacity: 0.7; } 100% { transform: translateY(-120px) scale(0.3); opacity: 0; } }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes popIn { from { opacity: 0; transform: scale(0.9);} to { opacity: 1; transform: scale(1);} }
  @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } }
  .menu-card:hover { transform: translateY(-3px); border-color: ${C.gold}; }
  .cat-chip:hover { border-color: ${C.gold}; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
`;

/* ---------------------------------------------------------------- */
/* MAIN APP                                                           */
/* ---------------------------------------------------------------- */
export default function PrimeLanches() {
  const [view, setView] = useState('store'); // store | admin
  const [activeCat, setActiveCat] = useState('Combos');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState('cart'); // cart | info | payment | sent
  const [orderType, setOrderType] = useState('entrega');
  const [form, setForm] = useState({ name: '', phone: '', address: '', complement: '', notes: '' });
  const [payment, setPayment] = useState('pix');
  const [sentOrder, setSentOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const menuPollRef = useRef(null);

  const refreshMenu = () => fetchMenu().then((items) => { setMenuItems(items); setMenuLoading(false); });

  useEffect(() => {
    refreshMenu();
    menuPollRef.current = setInterval(refreshMenu, 15000);
    return () => clearInterval(menuPollRef.current);
  }, []);

  useEffect(() => () => { clearTimeout(toastTimer.current); }, []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const addItem = (item) => {
    setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }));
    showToast(`${item.name} adicionado`);
  };
  const decItem = (id) => setCart((c) => {
    const next = { ...c };
    if (!next[id]) return c;
    next[id] -= 1;
    if (next[id] <= 0) delete next[id];
    return next;
  });
  const removeItem = (id) => setCart((c) => { const n = { ...c }; delete n[id]; return n; });

  const cartItems = useMemo(() =>
    Object.entries(cart).map(([id, qty]) => ({ ...menuItems.find((m) => m.id === id), qty }))
  , [cart, menuItems]);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const filteredMenu = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return menuItems.filter((m) => m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
    }
    return menuItems.filter((m) => m.cat === activeCat);
  }, [activeCat, query, menuItems]);

  const scrollToCat = (cat) => { setQuery(''); setActiveCat(cat); };

  const canGoInfo = cartItems.length > 0;
  const canGoPayment = form.name.trim() && form.phone.trim() &&
    (orderType === 'retirada' || form.address.trim());

  const confirmOrder = () => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const order = {
      id,
      number: 'PL' + id.slice(-4).toUpperCase(),
      createdAt: new Date().toISOString(),
      customer: { ...form },
      orderType,
      items: cartItems.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal, total,
      payment,
    };
    setSentOrder(order);
    setStep('sent');
    window.open(whatsappLink(order), '_blank');
  };

  const startNewOrder = () => {
    setCart({});
    setStep('cart');
    setCartOpen(false);
    setSentOrder(null);
    setForm({ name: '', phone: '', address: '', complement: '', notes: '' });
  };

  if (view === 'admin') {
    return <AdminPanel onExit={() => setView('store')} onMenuChange={refreshMenu} />;
  }

  return (
    <div style={{
      minHeight: '100vh', background: `radial-gradient(ellipse at 50% -10%, ${C.ember} 0%, ${C.void} 45%, ${C.voidDeep} 100%)`,
      fontFamily: FONT_BODY, color: C.cream, position: 'relative', overflowX: 'hidden',
    }}>
      <style>{GLOBAL_CSS}</style>

      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {[...Array(10)].map((_, i) => (
          <span key={i} style={{
            position: 'absolute', bottom: `${(i * 37) % 100}%`, left: `${(i * 53) % 100}%`,
            width: 4, height: 4, borderRadius: '50%', background: i % 2 ? C.gold : C.red,
            opacity: 0.5, animation: `emberRise ${5 + (i % 5)}s linear infinite`, animationDelay: `${i * 0.7}s`,
          }} />
        ))}
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(10px)', background: 'rgba(21,9,7,0.85)', borderBottom: `1px solid ${C.emberBorder}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PrimeLogo size="sm" />
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: '0.02em', color: C.goldLight }}>PRIME LANCHES</div>
              <div style={{ fontSize: 11, color: C.creamDim, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Aberto agora · pedido em 25–35 min
              </div>
            </div>
          </div>
          <button onClick={() => { setCartOpen(true); setStep(sentOrder ? 'sent' : 'cart'); }} style={{
            position: 'relative', background: `linear-gradient(180deg, ${C.goldLight}, ${C.gold})`, color: C.charcoal,
            border: 'none', borderRadius: 999, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: 800, fontSize: 14, boxShadow: '0 6px 16px rgba(242,177,58,0.25)',
          }}>
            <ShoppingBag size={17} />
            <span>Sacola</span>
            {cartCount > 0 && step === 'cart' && (
              <span style={{
                position: 'absolute', top: -6, right: -6, background: C.red, color: C.cream,
                borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, border: `2px solid ${C.void}`,
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '48px 20px 32px', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 340px', minWidth: 280 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(184,35,42,0.18)',
            border: `1px solid ${C.red}`, color: C.goldLight, borderRadius: 999, padding: '5px 12px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 18,
          }}>
            <Flame size={13} style={{ animation: 'flickerPlain 1.8s ease-in-out infinite' }} /> NA CHAPA TODOS OS DIAS
          </div>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontSize: 'clamp(38px, 6vw, 64px)', lineHeight: 0.95, margin: 0,
            background: 'linear-gradient(180deg, #ffe6a8, #f2b13a 60%, #c98f2c)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>O SABOR QUE<br />PEGA FOGO.</h1>
          <p style={{ color: C.creamDim, fontSize: 16, lineHeight: 1.6, margin: '18px 0 26px', maxWidth: 440 }}>
            Burgers artesanais, blend na hora e molhos exclusivos. Monte seu pedido e finalize direto no WhatsApp com a loja.
          </p>
          <button onClick={() => scrollToCat('Combos')} style={{
            background: `linear-gradient(180deg, ${C.redGlow}, ${C.redDark})`, color: C.cream, border: 'none',
            borderRadius: 12, padding: '13px 24px', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 20px rgba(184,35,42,0.35)',
          }}>Ver cardápio <ChevronRight size={17} /></button>
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 260 }}>
          <PrimeLogo size="lg" />
        </div>
      </section>

      <div style={{ position: 'sticky', top: 66, zIndex: 20, background: `linear-gradient(180deg, ${C.void} 60%, transparent)`, paddingTop: 8 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
            <Search size={16} color={C.creamDim} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar no cardápio…"
              style={{ background: 'transparent', border: 'none', color: C.cream, fontSize: 14, width: '100%' }} aria-label="Buscar no cardápio" />
          </div>
          {!query && (
            <div className="scrollbar-hide" style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {CATEGORIES.map((cat) => {
                const active = cat === activeCat;
                return (
                  <button key={cat} className="cat-chip" onClick={() => scrollToCat(cat)} style={{
                    flexShrink: 0, borderRadius: 999, padding: '9px 18px', fontSize: 13.5, fontWeight: 700,
                    border: `1.5px solid ${active ? C.gold : C.emberBorder}`,
                    background: active ? 'rgba(242,177,58,0.14)' : 'transparent',
                    color: active ? C.goldLight : C.creamDim, transition: 'all 0.2s ease',
                  }}>{cat}</button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '10px 20px 80px' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: '0.03em', color: C.cream, margin: '10px 0 16px' }}>
          {query ? `Resultados para "${query}"` : activeCat}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {menuLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: C.creamDim, padding: '40px 0' }}>Carregando cardápio…</div>
          ) : filteredMenu.map((item) => (
            <div key={item.id} className="menu-card" style={{ background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, border-color 0.2s ease', opacity: item.available === false ? 0.55 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: C.emberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden' }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
                </div>
                {item.available === false ? (
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', color: C.creamDim, background: C.emberLight, border: `1px solid ${C.emberBorder}`, borderRadius: 999, padding: '3px 9px' }}>Esgotado</span>
                ) : item.tag && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', color: C.charcoal, background: item.tag === 'Mais pedido' ? C.gold : C.goldLight, borderRadius: 999, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {item.tag === 'Mais pedido' && <Star size={10} fill={C.charcoal} />}{item.tag}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 4 }}>{item.name}</div>
              <p style={{ color: C.creamDim, fontSize: 13, lineHeight: 1.5, margin: 0, flex: 1 }}>{item.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.goldLight, letterSpacing: '0.01em' }}>{money(item.price)}</span>
                {item.available === false ? (
                  <span style={{ fontSize: 12, color: C.creamDim, fontWeight: 700 }}>Indisponível hoje</span>
                ) : cart[item.id] ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.emberLight, borderRadius: 999, padding: '4px 6px' }}>
                    <button aria-label="Diminuir" onClick={() => decItem(item.id)} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${C.emberBorder}`, background: 'transparent', color: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={13} /></button>
                    <span style={{ fontWeight: 800, fontSize: 13, minWidth: 14, textAlign: 'center' }}>{cart[item.id]}</span>
                    <button aria-label="Aumentar" onClick={() => addItem(item)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: C.gold, color: C.charcoal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => addItem(item)} style={{ background: `linear-gradient(180deg, ${C.redGlow}, ${C.redDark})`, color: C.cream, border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Adicionar</button>
                )}
              </div>
            </div>
          ))}
          {!menuLoading && filteredMenu.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: C.creamDim, padding: '40px 0' }}>Nenhum item encontrado. Tente outra busca.</div>
          )}
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${C.emberBorder}`, padding: '28px 20px', textAlign: 'center', color: C.creamDim, fontSize: 12.5 }}>
        <div>Prime Lanches · O MELHOR! — pedidos online todos os dias, 15h às 22h</div>
        <button onClick={() => setView('admin')} style={{ marginTop: 10, background: 'transparent', border: 'none', color: C.creamDim, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 5, opacity: 0.7 }}>
          <Store size={13} /> Área da loja
        </button>
      </footer>

      {cartCount > 0 && !cartOpen && step === 'cart' && (
        <button onClick={() => setCartOpen(true)} style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
          background: `linear-gradient(180deg, ${C.redGlow}, ${C.redDark})`, color: C.cream, border: 'none',
          borderRadius: 999, padding: '13px 26px', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 10px 26px rgba(184,35,42,0.4)', animation: 'popIn 0.25s ease',
        }}><ShoppingBag size={17} /> {cartCount} {cartCount === 1 ? 'item' : 'itens'} · {money(total)}</button>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: C.charcoal, color: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, animation: 'fadeUp 0.2s ease' }}>{toast}</div>
      )}

      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(440px, 100%)', background: C.void, borderLeft: `1px solid ${C.emberBorder}`, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.28s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C.emberBorder}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.goldLight, letterSpacing: '0.02em' }}>
                {step === 'cart' && 'SUA SACOLA'}
                {step === 'info' && 'ENTREGA'}
                {step === 'payment' && 'PAGAMENTO'}
                {step === 'sent' && 'PEDIDO ENVIADO'}
              </div>
              <button onClick={() => setCartOpen(false)} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: C.creamDim }}><X size={22} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {step === 'cart' && (
                cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', color: C.creamDim, marginTop: 60 }}>
                    <ShoppingBag size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
                    <div>Sua sacola está vazia.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {cartItems.map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 46, height: 46, borderRadius: 10, background: C.ember, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{item.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                          <div style={{ color: C.goldLight, fontSize: 13, fontWeight: 700 }}>{money(item.price * item.qty)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.ember, borderRadius: 999, padding: '4px 6px' }}>
                          <button onClick={() => decItem(item.id)} aria-label="Diminuir" style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${C.emberBorder}`, background: 'transparent', color: C.cream }}><Minus size={12} /></button>
                          <span style={{ fontSize: 13, fontWeight: 800, minWidth: 12, textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => addItem(item)} aria-label="Aumentar" style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: C.gold, color: C.charcoal }}><Plus size={12} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} aria-label={`Remover ${item.name}`} style={{ background: 'transparent', border: 'none', color: C.creamDim }}><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {step === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12.5, color: C.creamDim, fontWeight: 700 }}>Como você quer receber?</label>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      {[{ id: 'entrega', label: 'Entrega', icon: Bike }, { id: 'retirada', label: 'Retirar na loja', icon: Store }].map((o) => (
                        <button key={o.id} onClick={() => setOrderType(o.id)} style={{
                          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px',
                          borderRadius: 12, border: `1.5px solid ${orderType === o.id ? C.gold : C.emberBorder}`,
                          background: orderType === o.id ? 'rgba(242,177,58,0.12)' : 'transparent', color: orderType === o.id ? C.goldLight : C.creamDim,
                        }}><o.icon size={18} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{o.label}</span></button>
                      ))}
                    </div>
                  </div>
                  <Field label="Nome" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Seu nome" />
                  <Field label="Telefone / WhatsApp" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="(00) 00000-0000" />
                  {orderType === 'entrega' && (
                    <>
                      <Field label="Endereço" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Rua, número, bairro" icon={MapPin} />
                      <div style={{ fontSize: 12, color: C.creamDim, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} /> Taxa de entrega combinada direto com a loja no WhatsApp
                      </div>
                      <Field label="Complemento (opcional)" value={form.complement} onChange={(v) => setForm((f) => ({ ...f, complement: v }))} placeholder="Apto, bloco, referência" />
                    </>
                  )}
                  <div>
                    <label style={{ fontSize: 12.5, color: C.creamDim, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={13} /> Observações (opcional)</label>
                    <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Sem cebola, ponto da carne, etc."
                      rows={2} style={{ width: '100%', marginTop: 6, background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 10, padding: 10, color: C.cream, fontSize: 13.5, resize: 'vertical' }} />
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PAYMENTS.map((p) => (
                    <button key={p.id} onClick={() => setPayment(p.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 12, textAlign: 'left',
                      border: `1.5px solid ${payment === p.id ? C.gold : C.emberBorder}`,
                      background: payment === p.id ? 'rgba(242,177,58,0.1)' : 'transparent',
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: C.ember, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.goldLight, flexShrink: 0 }}><p.icon size={18} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.cream }}>{p.label}</div>
                        <div style={{ fontSize: 12, color: C.creamDim }}>{p.hint}</div>
                      </div>
                      {payment === p.id && <Check size={18} color={C.gold} />}
                    </button>
                  ))}
                  <div style={{ fontSize: 11.5, color: C.creamDim, background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 10, padding: 10, display: 'flex', gap: 8 }}>
                    <MessageCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Ao confirmar, seu pedido abre no WhatsApp da loja — é lá que vocês combinam pagamento e horário.</span>
                  </div>
                </div>
              )}

              {step === 'sent' && sentOrder && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 22 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(180deg, #25D366, #1aa851)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                    }}><MessageCircle size={30} color="#fff" /></div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>Pedido enviado para o WhatsApp da loja</div>
                    <div style={{ fontSize: 12.5, color: C.creamDim, marginTop: 4 }}>Se o WhatsApp não abriu automaticamente, toque no botão abaixo.</div>
                  </div>
                  <a href={whatsappLink(sentOrder)} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none',
                    background: 'linear-gradient(180deg, #25D366, #1aa851)', color: '#fff', borderRadius: 12, padding: '13px', fontWeight: 800, fontSize: 14.5, marginBottom: 20,
                  }}><MessageCircle size={17} /> Abrir WhatsApp com o pedido</a>
                  <div style={{ background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 13, color: C.creamDim, marginBottom: 8 }}>Pedido {sentOrder.number}</div>
                    {sentOrder.items.map((i) => (
                      <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>{i.qty}x {i.name}</span><span>{money(i.price * i.qty)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.emberBorder}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span>Total</span><span style={{ color: C.goldLight }}>{money(sentOrder.total)}</span>
                    </div>
                  </div>
                  <button onClick={startNewOrder} style={{ width: '100%', marginTop: 20, background: `linear-gradient(180deg, ${C.goldLight}, ${C.gold})`, color: C.charcoal, border: 'none', borderRadius: 12, padding: '13px', fontWeight: 800, fontSize: 14.5 }}>Fazer novo pedido</button>
                </div>
              )}
            </div>

            {step !== 'sent' && (
              <div style={{ borderTop: `1px solid ${C.emberBorder}`, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.creamDim, marginBottom: 4 }}><span>Subtotal</span><span>{money(subtotal)}</span></div>
                {orderType === 'entrega' && step !== 'cart' && (
                  <div style={{ fontSize: 11.5, color: C.creamDim, marginBottom: 4 }}>Taxa de entrega: a combinar no WhatsApp</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, margin: '8px 0 14px' }}><span>Total</span><span style={{ color: C.goldLight }}>{money(total)}</span></div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {step !== 'cart' && (
                    <button onClick={() => setStep(step === 'payment' ? 'info' : 'cart')} style={{ flexShrink: 0, background: C.ember, border: `1px solid ${C.emberBorder}`, color: C.cream, borderRadius: 12, padding: '13px 16px', fontWeight: 700, display: 'flex', alignItems: 'center' }}><ChevronLeft size={18} /></button>
                  )}
                  {step === 'cart' && (
                    <button disabled={!canGoInfo} onClick={() => setStep('info')} style={{ flex: 1, background: canGoInfo ? `linear-gradient(180deg, ${C.redGlow}, ${C.redDark})` : C.emberBorder, color: canGoInfo ? C.cream : C.creamDim, border: 'none', borderRadius: 12, padding: '13px', fontWeight: 800, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Continuar <ChevronRight size={16} /></button>
                  )}
                  {step === 'info' && (
                    <button disabled={!canGoPayment} onClick={() => setStep('payment')} style={{ flex: 1, background: canGoPayment ? `linear-gradient(180deg, ${C.redGlow}, ${C.redDark})` : C.emberBorder, color: canGoPayment ? C.cream : C.creamDim, border: 'none', borderRadius: 12, padding: '13px', fontWeight: 800, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Ir para pagamento <ChevronRight size={16} /></button>
                  )}
                  {step === 'payment' && (
                    <button onClick={confirmOrder} style={{ flex: 1, background: 'linear-gradient(180deg, #25D366, #1aa851)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 800, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <MessageCircle size={16} /> Enviar pedido no WhatsApp
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* ÁREA DA LOJA — gestão de cardápio via Supabase                    */
/* ---------------------------------------------------------------- */
function AdminPanel({ onExit, onMenuChange }) {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const refresh = () => fetchMenu().then((m) => { setMenuItems(m); setMenuLoading(false); });

  useEffect(() => { if (authed) refresh(); }, [authed]);

  const submitCode = (e) => {
    e.preventDefault();
    if (code === ADMIN_PASSCODE) { setAuthed(true); setError(''); }
    else setError('Código incorreto.');
  };

  const toggleAvailable = async (item) => {
    const next = item.available === false;
    setMenuItems((items) => items.map((m) => (m.id === item.id ? { ...m, available: next } : m)));
    try { await updateMenuItem(item.id, { available: next }); onMenuChange?.(); }
    catch (e) { console.error(e); refresh(); }
  };
  const changePrice = async (id, price) => {
    setMenuItems((items) => items.map((m) => (m.id === id ? { ...m, price } : m)));
    try { await updateMenuItem(id, { price }); onMenuChange?.(); }
    catch (e) { console.error(e); refresh(); }
  };
  const remove = async (id) => {
    setMenuItems((items) => items.filter((m) => m.id !== id));
    try { await deleteMenuItem(id); onMenuChange?.(); }
    catch (e) { console.error(e); refresh(); }
  };
  const add = async (newItem) => {
    try {
      const created = await addMenuItem(newItem);
      setMenuItems((items) => [...items, created]);
      onMenuChange?.();
    } catch (e) {
      console.error(e);
      alert('Não foi possível adicionar o item. Confira a conexão com o Supabase.');
    }
  };
  const changeImage = async (id, file) => {
    try {
      const imageUrl = await uploadMenuImage(file, id);
      setMenuItems((items) => items.map((m) => (m.id === id ? { ...m, imageUrl } : m)));
      await updateMenuItem(id, { imageUrl });
      onMenuChange?.();
    } catch (e) {
      console.error(e);
      alert('Não foi possível enviar a foto. Confira se o bucket "menu-images" existe e está público no Supabase.');
    }
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: C.void, color: C.cream, fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{GLOBAL_CSS}</style>
        <form onSubmit={submitCode} style={{ background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 16, padding: 28, width: 320, textAlign: 'center' }}>
          <Store size={26} color={C.goldLight} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.goldLight, marginBottom: 4, letterSpacing: '0.02em' }}>ÁREA DA LOJA</div>
          <p style={{ fontSize: 12.5, color: C.creamDim, margin: '0 0 16px' }}>Código de acesso da equipe</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} type="password" placeholder="••••"
            style={{ width: '100%', textAlign: 'center', letterSpacing: '0.3em', background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 10, padding: '11px', color: C.cream, fontSize: 16, marginBottom: 10 }} />
          {error && <div style={{ color: C.redGlow, fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button type="submit" style={{ width: '100%', background: `linear-gradient(180deg, ${C.goldLight}, ${C.gold})`, color: C.charcoal, border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, marginBottom: 10 }}>Entrar</button>
          <button type="button" onClick={onExit} style={{ background: 'transparent', border: 'none', color: C.creamDim, fontSize: 12.5 }}>Voltar ao cardápio</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.void, color: C.cream, fontFamily: FONT_BODY }}>
      <style>{GLOBAL_CSS}</style>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(21,9,7,0.92)', borderBottom: `1px solid ${C.emberBorder}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Store size={20} color={C.goldLight} />
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: '0.02em', color: C.goldLight }}>CARDÁPIO DA LOJA</span>
        </div>
        <button onClick={onExit} style={{ background: C.ember, border: `1px solid ${C.emberBorder}`, color: C.cream, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700 }}>Sair</button>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
        <div style={{ fontSize: 12.5, color: C.creamDim, background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 10, padding: 12, marginBottom: 20, display: 'flex', gap: 8 }}>
          <MessageCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Os pedidos continuam chegando direto no WhatsApp da loja. Esta tela só controla o que aparece no cardápio para o cliente — as mudanças aparecem para todo mundo em poucos segundos.</span>
        </div>
        <MenuTab items={menuItems} loading={menuLoading} onToggle={toggleAvailable} onPrice={changePrice} onDelete={remove} onAdd={add} onImage={changeImage} />
      </main>
    </div>
  );
}

function MenuTab({ items, loading, onToggle, onPrice, onDelete, onAdd, onImage }) {
  const [form, setForm] = useState({ name: '', desc: '', price: '', cat: CATEGORIES[0], emoji: '🍔', tag: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingImageId, setPendingImageId] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const price = parseFloat(form.price.replace(',', '.'));
    if (!form.name.trim() || isNaN(price) || price <= 0) {
      setFormError('Preencha nome e um preço válido.');
      return;
    }
    setSubmitting(true);
    await onAdd({ name: form.name.trim(), desc: form.desc.trim(), price, cat: form.cat, emoji: form.emoji || '🍔', tag: form.tag.trim() || null });
    setSubmitting(false);
    setForm({ name: '', desc: '', price: '', cat: form.cat, emoji: '🍔', tag: '' });
    setFormError('');
  };

  const handleImagePick = async (id, file) => {
    if (!file) return;
    setPendingImageId(id);
    await onImage(id, file);
    setPendingImageId(null);
  };

  if (loading) return <div style={{ textAlign: 'center', color: C.creamDim, padding: 40 }}>Carregando cardápio…</div>;

  const grouped = CATEGORIES.map((cat) => ({ cat, items: items.filter((i) => i.cat === cat) }));

  return (
    <div>
      <form onSubmit={submit} style={{ background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 14, padding: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.goldLight, marginBottom: 12, letterSpacing: '0.02em' }}>ADICIONAR ITEM</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do item"
            style={{ background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 8, padding: '9px 10px', color: C.cream, fontSize: 13 }} />
          <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Preço (ex: 24.90)"
            inputMode="decimal" style={{ background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 8, padding: '9px 10px', color: C.cream, fontSize: 13 }} />
          <select value={form.cat} onChange={(e) => setForm((f) => ({ ...f, cat: e.target.value }))}
            style={{ background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 8, padding: '9px 10px', color: C.cream, fontSize: 13 }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="Emoji 🍔 (usado até você enviar uma foto)" maxLength={2}
            style={{ background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 8, padding: '9px 10px', color: C.cream, fontSize: 13 }} />
        </div>
        <input value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} placeholder="Descrição"
          style={{ width: '100%', background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 8, padding: '9px 10px', color: C.cream, fontSize: 13, marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="Selo (opcional): Novo, Picante…"
            style={{ flex: 1, minWidth: 160, background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 8, padding: '9px 10px', color: C.cream, fontSize: 13 }} />
          <button type="submit" disabled={submitting} style={{ background: `linear-gradient(180deg, ${C.goldLight}, ${C.gold})`, color: C.charcoal, border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: submitting ? 0.6 : 1 }}><Plus size={14} /> {submitting ? 'Adicionando…' : 'Adicionar'}</button>
        </div>
        <div style={{ fontSize: 11.5, color: C.creamDim, marginTop: 8 }}>A foto do produto se envia depois de criado — adiciona aqui e depois clica em "Foto" na lista abaixo.</div>
        {formError && <div style={{ color: C.redGlow, fontSize: 12, marginTop: 8 }}>{formError}</div>}
      </form>

      {grouped.map(({ cat, items: catItems }) => catItems.length > 0 && (
        <div key={cat} style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: FONT_DISPLAY, fontSize: 14, letterSpacing: '0.03em', color: C.creamDim, margin: '0 0 10px' }}>{cat.toUpperCase()}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.ember, border: `1px solid ${C.emberBorder}`, borderRadius: 10, padding: '10px 12px', opacity: item.available === false ? 0.55 : 1, flexWrap: 'wrap' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.emberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: 11.5, color: C.creamDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ color: C.creamDim, fontSize: 12 }}>R$</span>
                  <input defaultValue={item.price} type="number" step="0.10" onBlur={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > 0) onPrice(item.id, v);
                  }} style={{ width: 64, background: C.void, border: `1px solid ${C.emberBorder}`, borderRadius: 6, padding: '5px 6px', color: C.cream, fontSize: 12.5 }} />
                </div>
                <label style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '6px 10px', cursor: 'pointer',
                  border: `1px solid ${C.emberBorder}`, color: C.creamDim, display: 'flex', alignItems: 'center', gap: 4,
                  opacity: pendingImageId === item.id ? 0.5 : 1,
                }}>
                  {pendingImageId === item.id ? 'Enviando…' : (item.imageUrl ? 'Trocar foto' : 'Foto')}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={pendingImageId === item.id}
                    onChange={(e) => handleImagePick(item.id, e.target.files?.[0])} />
                </label>
                <button onClick={() => onToggle(item)} style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '6px 10px',
                  border: `1px solid ${item.available === false ? C.gold : C.emberBorder}`,
                  background: item.available === false ? 'rgba(242,177,58,0.14)' : 'transparent',
                  color: item.available === false ? C.goldLight : C.creamDim,
                }}>{item.available === false ? 'Reativar' : 'Esgotado'}</button>
                <button onClick={() => onDelete(item.id)} aria-label={`Excluir ${item.name}`} style={{ flexShrink: 0, background: 'transparent', border: 'none', color: C.redGlow }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {items.length === 0 && <div style={{ textAlign: 'center', color: C.creamDim, padding: 20 }}>Nenhum item no cardápio ainda.</div>}
    </div>
  );
}
