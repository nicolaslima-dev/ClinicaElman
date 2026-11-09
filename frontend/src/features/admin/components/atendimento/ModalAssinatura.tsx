import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface DadosAssinaturaColetada {
  assinaturaBase64: string;
  nomeAssinante: string;
}

interface ModalAssinaturaProps {
  isOpen: boolean;
  onClose: () => void;
  onAssinar: (dados?: DadosAssinaturaColetada) => void;
  nomePadraoAssinante?: string;
}

export function ModalAssinatura({
  isOpen,
  onClose,
  onAssinar,
  nomePadraoAssinante = '',
}: ModalAssinaturaProps) {
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNomeAssinante(nomePadraoAssinante || '');
      setHasDrawn(false);
      setErro(null);
    }
  }, [isOpen, nomePadraoAssinante]);

  if (!isOpen) return null;

  const getCoordinates = (e: any) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
    }
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    setHasDrawn(true);
    setErro(null);
    const [x, y] = getCoordinates(e);
    setLastPos({ x, y });
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [currentX, currentY] = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = '#0B132B';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setLastPos({ x: currentX, y: currentY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limparAssinatura = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setErro(null);
  };

  const confirmarAssinatura = () => {
    if (!hasDrawn) {
      setErro('Por favor, realize a assinatura no quadro abaixo antes de confirmar.');
      return;
    }
    const canvas = signatureCanvasRef.current;
    const base64 = canvas ? canvas.toDataURL('image/png') : '';
    onAssinar({
      assinaturaBase64: base64,
      nomeAssinante: nomeAssinante.trim() || nomePadraoAssinante || 'Paciente / Responsável Legal',
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-xl border border-ink-100 flex flex-col z-10 fade-in">
        <div className="bg-white px-6 py-5 border-b border-ink-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-bold text-ink-900 flex items-center gap-2">
              <i className="ph-fill ph-signature text-brand-600"></i> Coleta de Assinatura TISS
            </h3>
            <p className="text-xs text-ink-500 mt-1">
              Assinatura do Paciente ou Responsável Legal para validação das sessões na Guia SP/SADT.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-600 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5 bg-ink-50/50 space-y-4">
          {erro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-warning-circle text-base"></i>
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">
              Nome do Assinante (Paciente ou Responsável Legal)
            </label>
            <input
              type="text"
              value={nomeAssinante}
              onChange={e => setNomeAssinante(e.target.value)}
              placeholder="Ex: Mariana Costa e Silva (ou Responsável Legal)"
              className="w-full bg-white border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:border-brand-400"
            />
          </div>

          <div className="flex flex-col items-center">
            <canvas
              ref={signatureCanvasRef}
              className="bg-white border-2 border-dashed border-brand-200 rounded-xl cursor-crosshair shadow-sm touch-none w-full max-w-[440px]"
              width="440"
              height="180"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={e => {
                e.preventDefault();
                startDrawing(e);
              }}
              onTouchMove={e => {
                e.preventDefault();
                draw(e);
              }}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
            ></canvas>
            <span className="text-[11px] text-ink-400 mt-2">
              Assine utilizando o mouse, caneta digitalizadora ou tela sensível ao toque
            </span>
          </div>
        </div>

        <div className="bg-ink-50 px-6 py-4 border-t border-ink-100 flex justify-between items-center">
          <button
            type="button"
            className="text-sm font-medium text-ink-500 hover:text-ink-700 flex items-center gap-1"
            onClick={limparAssinatura}
          >
            <i className="ph ph-eraser"></i> Limpar Quadro
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-full border border-ink-200 px-5 py-2 bg-white text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex justify-center items-center gap-2 rounded-full px-6 py-2 bg-ink-900 text-sm font-medium text-white hover:bg-ink-800 transition-colors shadow-soft"
              onClick={confirmarAssinatura}
            >
              <i className="ph ph-check-circle text-brand-300 text-lg"></i> Confirmar Assinatura
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
