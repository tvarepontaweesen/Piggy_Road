import React, { useState } from 'react';
import { Check, Lock, ShoppingBag, Sparkles, X, HelpCircle } from 'lucide-react';
import { PigCharacterPreview } from './PigCharacterPreview';
import { SKINS } from '../game/constants';
import { sounds } from '../services/audio';
import { SkinId } from '../types';

interface ShopModalProps {
  totalCoins: number;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  onEquipSkin: (skinId: SkinId) => void;
  onBuySkin: (skinId: SkinId, price: number) => boolean;
  onClose: () => void;
}

const SKIN_ORDER: SkinId[] = ['classic', 'pink', 'farmer', 'ninja', 'golden'];

// Theme accents for individual skin cards
const SKIN_THEMES: Record<
  SkinId,
  {
    tag: string;
    bgGradient: string;
    pedestalBg: string;
    borderColor: string;
    accentBadge: string;
  }
> = {
  classic: {
    tag: 'DEFAULT',
    bgGradient: 'from-pink-50/80 via-rose-50/50 to-white',
    pedestalBg: 'bg-pink-100/90 border-pink-200',
    borderColor: 'border-pink-300',
    accentBadge: 'bg-pink-100 text-pink-700 border-pink-300',
  },
  pink: {
    tag: 'SWEET BOW',
    bgGradient: 'from-rose-50 via-pink-50 to-white',
    pedestalBg: 'bg-rose-100/90 border-rose-200',
    borderColor: 'border-rose-300',
    accentBadge: 'bg-rose-100 text-rose-700 border-rose-300',
  },
  farmer: {
    tag: 'COUNTRY RANCH',
    bgGradient: 'from-amber-50/80 via-yellow-50/50 to-white',
    pedestalBg: 'bg-amber-100/90 border-amber-200',
    borderColor: 'border-amber-300',
    accentBadge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  ninja: {
    tag: 'STEALTH SHADOW',
    bgGradient: 'from-slate-100/90 via-slate-50 to-white',
    pedestalBg: 'bg-slate-200 border-slate-300',
    borderColor: 'border-slate-400',
    accentBadge: 'bg-slate-800 text-slate-100 border-slate-900',
  },
  golden: {
    tag: 'ROYAL 24K',
    bgGradient: 'from-yellow-100/90 via-amber-50 to-amber-100/40',
    pedestalBg: 'bg-yellow-200/90 border-yellow-400',
    borderColor: 'border-yellow-400',
    accentBadge: 'bg-amber-400 text-yellow-950 border-amber-500',
  },
};

export const ShopModal: React.FC<ShopModalProps> = ({
  totalCoins,
  unlockedSkins,
  equippedSkin,
  onEquipSkin,
  onBuySkin,
  onClose,
}) => {
  // Confirmation state before purchasing
  const [confirmSkinId, setConfirmSkinId] = useState<SkinId | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger brief floating toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleEquip = (skinId: SkinId) => {
    if (equippedSkin === skinId) return;
    sounds.playButtonClick();
    onEquipSkin(skinId);
    showToast(`Equipped ${SKINS[skinId].name}! ✨`);
  };

  // Open the buy confirmation interaction dialog
  const handleOpenBuyConfirmation = (skinId: SkinId) => {
    const skin = SKINS[skinId];
    if (unlockedSkins.includes(skinId)) return; // Already owned!

    if (totalCoins < skin.price) {
      sounds.playInsufficientCoins();
      showToast(`Not enough coins! Need ${skin.price - totalCoins} more 🪙`);
      return;
    }

    sounds.playButtonClick();
    setConfirmSkinId(skinId);
  };

  // Confirm purchase action
  const handleConfirmPurchase = () => {
    if (!confirmSkinId) return;
    const skin = SKINS[confirmSkinId];

    if (unlockedSkins.includes(confirmSkinId) || totalCoins < skin.price) {
      setConfirmSkinId(null);
      return;
    }

    const success = onBuySkin(confirmSkinId, skin.price);
    if (success) {
      showToast(`🎉 Unlocked & Equipped ${skin.name}!`);
    }
    setConfirmSkinId(null);
  };

  const unlockedCount = unlockedSkins.length;
  const totalCount = SKIN_ORDER.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-blue-950/75 backdrop-blur-md select-none font-sans overflow-hidden pt-safe pb-safe">
      {/* Main Shop Container */}
      <div className="relative w-full max-w-4xl bg-white border-3 sm:border-4 border-blue-600 rounded-3xl md:rounded-4xl shadow-2xl text-slate-900 flex flex-col max-h-[96vh] sm:max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white border-b-3 sm:border-b-4 border-blue-700 shadow-md">
          {/* Shop Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-yellow-400 border-2 sm:border-3 border-yellow-600 flex items-center justify-center text-yellow-950 shadow-md transform -rotate-3 shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                PIGGY WARDROBE
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-blue-100 mt-0.5 hidden min-[360px]:block">
                Unlock & equip custom skins!
              </p>
            </div>
          </div>

          {/* Right: Coin Balance & Close Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Total Coins Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-yellow-400 border-2 sm:border-3 border-yellow-600 text-yellow-950 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg">
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-yellow-200 border border-yellow-500 flex items-center justify-center text-[10px] sm:text-xs font-black">
                ★
              </div>
              <span className="font-black text-sm sm:text-lg tracking-tight">
                {totalCoins.toLocaleString()}
              </span>
            </div>

            {/* Close Shop Button */}
            <button
              id="btn-close-shop"
              type="button"
              onClick={() => {
                sounds.playButtonClick();
                onClose();
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white border-2 border-white/50 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Close Shop"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Collection Status Bar */}
        <div className="bg-blue-50 px-3 sm:px-6 py-2 border-b-2 border-blue-100 flex items-center justify-between gap-2 text-xs font-black">
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-950 text-[11px] sm:text-xs">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400 shrink-0" />
            <span className="hidden sm:inline">COLLECTION PROGRESS:</span>
            <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px]">
              {unlockedCount} / {totalCount} UNLOCKED
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-24 sm:w-44 h-2.5 sm:h-3 bg-blue-200 rounded-full overflow-hidden border border-blue-300">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.round((unlockedCount / totalCount) * 100)}%` }}
            />
          </div>
        </div>

        {/* Skin Cards Grid Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/60 overscroll-contain">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {SKIN_ORDER.map((id) => {
              const skin = SKINS[id];
              const theme = SKIN_THEMES[id];
              const isUnlocked = unlockedSkins.includes(id);
              const isEquipped = equippedSkin === id;
              const canAfford = totalCoins >= skin.price;
              const isFree = skin.price === 0;

              return (
                <div
                  key={id}
                  id={`card-skin-${id}`}
                  className={`relative flex flex-col justify-between rounded-3xl p-3.5 sm:p-5 border-3 sm:border-4 transition-all duration-200 bg-gradient-to-b ${
                    theme.bgGradient
                  } ${
                    isEquipped
                      ? 'border-green-500 shadow-xl ring-3 sm:ring-4 ring-green-400/30'
                      : isUnlocked
                      ? 'border-blue-400 shadow-md hover:border-blue-500 hover:shadow-lg'
                      : canAfford
                      ? `${theme.borderColor} shadow-md hover:shadow-xl`
                      : 'border-slate-300 opacity-90 shadow-sm'
                  }`}
                >
                  {/* Top Card Row: Theme Tag & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {/* Theme tag */}
                    <span
                      className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.accentBadge}`}
                    >
                      {theme.tag}
                    </span>

                    {/* Status Badge */}
                    {isEquipped ? (
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full border border-green-600 shadow-sm">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" /> EQUIPPED
                      </span>
                    ) : isUnlocked ? (
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full border border-blue-600 shadow-sm">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" /> UNLOCKED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full border border-slate-300">
                        <Lock className="w-2.5 h-2.5" /> LOCKED
                      </span>
                    )}
                  </div>

                  {/* Large Pig Preview Pedestal */}
                  <div className="relative my-1.5 py-2 flex items-center justify-center">
                    {/* Pedestal circle */}
                    <div
                      className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-3 flex items-center justify-center shadow-inner transition-transform ${theme.pedestalBg}`}
                    >
                      <PigCharacterPreview skinId={id} size={90} animate={true} />
                    </div>

                    {/* Sparkle badge for Golden Pig */}
                    {skin.hasSparkles && (
                      <div className="absolute top-0 right-4 sm:right-6 text-amber-500 animate-bounce">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400" />
                      </div>
                    )}
                  </div>

                  {/* Skin Info */}
                  <div className="text-center my-1.5">
                    <h3 className="text-base sm:text-xl font-black text-blue-950 tracking-tight">
                      {skin.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-600 mt-0.5 leading-snug line-clamp-2 min-h-[28px] sm:min-h-[32px]">
                      {skin.description}
                    </p>

                    {/* Price display */}
                    <div className="mt-2 flex items-center justify-center">
                      {isFree ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 border border-green-400 rounded-full text-green-800 text-[10px] sm:text-xs font-black">
                          <span>🎉 FREE DEFAULT</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 border border-amber-400 rounded-full text-amber-950 text-[10px] sm:text-xs font-black">
                          <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center text-[9px] text-yellow-950 font-black">
                            ★
                          </div>
                          <span>{skin.price.toLocaleString()} COINS</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="mt-2 pt-2 border-t border-slate-200/80">
                    {isEquipped ? (
                      <button
                        id={`btn-equipped-${id}`}
                        disabled
                        className="w-full py-2 bg-green-100 border-2 border-green-500 rounded-2xl text-green-800 font-black text-xs flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>CURRENTLY EQUIPPED</span>
                      </button>
                    ) : isUnlocked ? (
                      <button
                        id={`btn-equip-${id}`}
                        type="button"
                        onClick={() => handleEquip(id)}
                        className="btn-arcade w-full py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:from-emerald-600 active:to-green-700 border-b-4 border-green-800 rounded-2xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>EQUIP SKIN</span>
                      </button>
                    ) : canAfford ? (
                      <button
                        id={`btn-buy-${id}`}
                        type="button"
                        onClick={() => handleOpenBuyConfirmation(id)}
                        className="btn-arcade w-full py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:from-amber-500 active:to-yellow-600 border-b-4 border-amber-700 rounded-2xl text-amber-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-amber-900 text-amber-900" />
                        <span>BUY • 🪙 {skin.price}</span>
                      </button>
                    ) : (
                      <button
                        id={`btn-locked-${id}`}
                        type="button"
                        disabled
                        className="w-full py-1.5 sm:py-2 bg-slate-200 border-2 border-slate-300 rounded-2xl text-slate-500 font-black text-xs flex flex-col items-center justify-center cursor-not-allowed"
                      >
                        <div className="flex items-center gap-1 text-slate-600">
                          <Lock className="w-3 h-3" />
                          <span>NOT ENOUGH COINS</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-rose-500">
                          Need {skin.price - totalCoins} more 🪙
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Footer info tip */}
        <footer className="bg-white px-3 sm:px-6 py-2 border-t-2 border-slate-200 flex items-center justify-between text-slate-500 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs truncate">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Hop & collect coins on the road to unlock skins!</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 font-black underline cursor-pointer shrink-0 ml-2"
          >
            Back
          </button>
        </footer>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 animate-bounce pointer-events-none px-2 w-max max-w-[90vw]">
          <div className="bg-blue-900 border-2 sm:border-3 border-yellow-400 text-white font-black text-xs sm:text-sm px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-300 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Interaction Modal */}
      {confirmSkinId && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white border-4 border-amber-500 rounded-3xl p-4 sm:p-6 shadow-2xl text-center text-slate-900 flex flex-col items-center">
            {/* Crown / Sparkle badge */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400 border-3 border-amber-600 text-amber-950 flex items-center justify-center shadow-lg -mt-9 sm:-mt-10 mb-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-900 text-amber-900" />
            </div>

            <h3 className="text-lg sm:text-2xl font-black text-blue-950 tracking-tight">
              Confirm Purchase
            </h3>

            {/* Prompt exact text */}
            <p className="text-sm sm:text-lg font-black text-amber-800 mt-1.5 bg-amber-50 border-2 border-amber-200 rounded-2xl px-3 py-2 w-full">
              Buy {SKINS[confirmSkinId].name} for {SKINS[confirmSkinId].price} coins?
            </p>

            {/* Pig Preview */}
            <div className="my-2 py-1 flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-100 border-3 border-amber-300 flex items-center justify-center shadow-inner">
                <PigCharacterPreview skinId={confirmSkinId} size={80} animate={true} />
              </div>
            </div>

            {/* Coin Balance Breakdown */}
            <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 my-1.5 text-xs font-black space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span>Current Balance:</span>
                <span className="text-slate-900">🪙 {totalCoins.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-amber-700">
                <span>Skin Price:</span>
                <span>- {SKINS[confirmSkinId].price.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-green-700 font-black">
                <span>Remaining Balance:</span>
                <span>🪙 {(totalCoins - SKINS[confirmSkinId].price).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-2">
              <button
                id="btn-cancel-purchase"
                type="button"
                onClick={() => {
                  sounds.playButtonClick();
                  setConfirmSkinId(null);
                }}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border-2 border-slate-300 rounded-2xl text-slate-700 font-black text-xs sm:text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-purchase"
                type="button"
                onClick={handleConfirmPurchase}
                className="btn-arcade py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:from-amber-500 active:to-yellow-500 border-b-4 border-amber-700 rounded-2xl text-amber-950 font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Confirm & Buy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
