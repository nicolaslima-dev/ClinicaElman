import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalAssinaturaProps {
  isOpen: boolean;
  onClose: () => void;
  onAssinar: () => void;
}

export function ModalAssinatura({ isOpen, onClose, onAssinar }: ModalAssinaturaProps) {
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

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
    ctx.lineWidth = 3;
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
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-xl border border-ink-100 flex flex-col z-10">
        <div className="bg-white px-6 py-5 border-b border-ink-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-bold text-ink-900 flex items-center gap-2">
              <i className="ph-fill ph-signature text-brand-600"></i> Coleta de Assinatura
            </h3>
            <p className="text-sm text-ink-500 mt-1">O paciente deve assinar no quadro abaixo.</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors">
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>
        <div className="px-6 py-6 bg-ink-50/50 flex justify-center">
          <canvas
            ref={signatureCanvasRef}
            className="bg-white border-2 border-dashed border-brand-200 rounded-xl cursor-crosshair shadow-sm touch-none"
            width="400"
            height="200"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault();
              startDrawing(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              draw(e);
            }}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          ></canvas>
        </div>
        <div className="bg-ink-50 px-6 py-4 border-t border-ink-100 flex justify-between items-center">
          <button type="button" className="text-sm font-medium text-ink-500 hover:text-ink-700" onClick={limparAssinatura}>
            <i className="ph ph-eraser mr-1"></i> Limpar
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-ink-200 shadow-sm px-4 py-2 bg-white text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex justify-center items-center gap-2 rounded-lg border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              onClick={onAssinar}
            >
              <i className="ph ph-check-circle"></i> Assinar e Gerar PDF
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
