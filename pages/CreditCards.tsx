import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard } from '../types';
import { CARD_IMAGES } from '../constants';

const CreditCards: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [cardNetwork, setCardNetwork] = useState<'Visa' | 'Visa Débito' | 'Mastercard' | 'Mastercard Débito' | 'American Express' | 'Mercadolibre'>('Visa');
  const [cardBgImage, setCardBgImage] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'creditCards'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const cardsList: CreditCard[] = [];
      snapshot.forEach((doc: any) => {
        cardsList.push({ id: doc.id, ...doc.data() } as CreditCard);
      });
      
      setCards(cardsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCreateCard = async () => {
    if (!currentUser || !cardName || !cardLast4) return;
    
    await addDoc(collection(db, 'creditCards'), {
      name: cardName,
      last4: cardLast4,
      network: cardNetwork,
      bgImage: cardBgImage || CARD_IMAGES[cardNetwork],
      userId: currentUser.uid
    });
    
    setShowCardModal(false);
    setCardName('');
    setCardLast4('');
    setCardNetwork('Visa');
    setCardBgImage('');
    setShowImagePicker(false);
  };

  const handleUpdateCard = async () => {
    if (!editingCard) return;
    
    await updateDoc(doc(db, 'creditCards', editingCard.id), {
      name: cardName || editingCard.name,
      last4: cardLast4 || editingCard.last4,
      network: cardNetwork || editingCard.network,
      bgImage: cardBgImage || editingCard.bgImage
    });
    
    setEditingCard(null);
    setShowCardModal(false);
    setCardName('');
    setCardLast4('');
    setCardNetwork('Visa');
    setCardBgImage('');
    setShowImagePicker(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarjeta?')) return;
    await deleteDoc(doc(db, 'creditCards', cardId));
    setShowMenu(null);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-10 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="flex items-center p-4 pb-2 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white flex size-10 shrink-0 items-center justify-center">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Tarjetas de Crédito</h1>
          <div className="flex size-10 shrink-0 items-center justify-center"></div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-md mx-auto w-full">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando tarjetas...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No hay tarjetas. Agrega una nueva.</div>
        ) : (
          <div className="space-y-3">
            {cards.map(card => (
              <div key={card.id} className="relative flex items-center gap-4 bg-white dark:bg-slate-800/50 p-4 min-h-[72px] justify-between rounded-xl shadow-sm border border-slate-100 dark:border-none">
                <div className="flex items-center gap-4">
                  <div 
                    className="bg-center bg-no-repeat aspect-video bg-contain h-6 w-10 shrink-0" 
                    style={{ backgroundImage: `url("${card.bgImage}")` }}
                  ></div>
                  <div className="flex flex-col justify-center">
                    <p className="text-slate-900 dark:text-white text-base font-medium line-clamp-1">{card.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal line-clamp-2">•••• {card.last4}</p>
                  </div>
                </div>
                <div className="shrink-0 relative">
                  <button 
                    onClick={() => setShowMenu(showMenu === card.id ? null : card.id)}
                    className="text-slate-500 dark:text-slate-400 flex size-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-xl">more_horiz</span>
                  </button>
                  {showMenu === card.id && (
                    <div className="absolute right-0 top-10 z-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-[120px]">
                      <button
                        onClick={() => {
                          setEditingCard(card);
                          setCardName(card.name);
                          setCardLast4(card.last4);
                          setCardNetwork(card.network);
                          setCardBgImage(card.bgImage);
                          setShowImagePicker(false);
                          setShowCardModal(true);
                          setShowMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-20">
        <button 
          onClick={() => {
            setEditingCard(null);
            setCardName('');
            setCardLast4('');
            setCardNetwork('Visa');
            setCardBgImage('');
            setShowImagePicker(false);
            setShowCardModal(true);
          }}
          className="flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-background-dark shadow-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined" style={{fontSize: '28px'}}>add</span>
        </button>
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowCardModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
              </h2>
              <button onClick={() => setShowCardModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
                  placeholder="Ej: Banco Principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Últimos 4 dígitos</label>
                <input
                  type="text"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Tarjeta</label>
                <select
                  value={cardNetwork}
                  onChange={(e) => {
                    const newNetwork = e.target.value as CreditCard['network'];
                    setCardNetwork(newNetwork);
                    setCardBgImage(CARD_IMAGES[newNetwork]);
                  }}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary"
                >
                  <option value="Visa">Visa</option>
                  <option value="Visa Débito">Visa Débito</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Mastercard Débito">Mastercard Débito</option>
                  <option value="American Express">American Express</option>
                  <option value="Mercadolibre">Mercadolibre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Imagen de Tarjeta</label>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(!showImagePicker)}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary flex items-center justify-between"
                >
                  <span className="text-slate-500 dark:text-slate-400">
                    {cardBgImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </span>
                  <span className="material-symbols-outlined text-xl">
                    {showImagePicker ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {showImagePicker && (
                  <div className="mt-2 grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
                    {Object.entries(CARD_IMAGES).map(([name, imageUrl]) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setCardBgImage(imageUrl);
                          setCardNetwork(name as CreditCard['network']);
                          setShowImagePicker(false);
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          cardBgImage === imageUrl
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                        }`}
                      >
                        <div
                          className="bg-center bg-no-repeat bg-contain h-12 w-20"
                          style={{ backgroundImage: `url("${imageUrl}")` }}
                        ></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 text-center">{name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {cardBgImage && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div
                      className="bg-center bg-no-repeat bg-contain h-10 w-16 shrink-0"
                      style={{ backgroundImage: `url("${cardBgImage}")` }}
                    ></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                      {Object.entries(CARD_IMAGES).find(([_, url]) => url === cardBgImage)?.[0] || 'Imagen personalizada'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCardBgImage('')}
                      className="text-red-500 hover:text-red-600"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={editingCard ? handleUpdateCard : handleCreateCard}
                className="w-full bg-primary text-background-dark text-lg font-bold h-12 rounded-xl"
              >
                {editingCard ? 'Guardar Cambios' : 'Agregar Tarjeta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCards;
