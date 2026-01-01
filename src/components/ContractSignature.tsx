import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Eraser, Check } from 'lucide-react';

interface ContractSignatureProps {
  onSign: (signature: string) => void;
  isLoading: boolean;
}

const ContractSignature = ({ onSign, isLoading }: ContractSignatureProps) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signature = canvas.toDataURL('image/png');
    onSign(signature);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground mb-2">{t('contracts.signatureInstructions')}</p>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="border rounded bg-white cursor-crosshair w-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          <Eraser className="h-4 w-4 mr-2" />
          {t('contracts.clearSignature')}
        </Button>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
        />
        <Label htmlFor="terms" className="text-sm leading-relaxed">
          {t('contracts.termsAgreement')}
        </Label>
      </div>

      <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">{t('contracts.legalNotice')}</p>
        <p>{t('contracts.legalNoticeText')}</p>
      </div>

      <Button
        className="w-full"
        onClick={handleSign}
        disabled={!hasSignature || !agreedToTerms || isLoading}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        {t('contracts.confirmSignature')}
      </Button>
    </div>
  );
};

export default ContractSignature;
