import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/* Rede de segurança: se qualquer parte do site quebrar com um erro de
   JavaScript, mostra um aviso com botão de recarregar em vez de deixar
   a tela em branco. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }
  static getDerivedStateFromError(erro) {
    return { erro };
  }
  componentDidCatch(erro, info) {
    console.error('Erro não tratado no site:', erro, info);
  }
  render() {
    if (this.state.erro) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          background: '#150907', color: '#f7f1e6', fontFamily: 'Segoe UI, Arial, sans-serif',
          padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Algo deu errado</div>
          <div style={{ fontSize: 14, opacity: 0.8, maxWidth: 360 }}>
            Tivemos um probleminha ao carregar essa página. Recarregue pra tentar de novo.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#d9a441', color: '#2a221a', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
