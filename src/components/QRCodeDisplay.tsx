import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, QrCode as QrCodeIcon, Share2, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  url: string;
  shopName: string;
}

const QRCodeDisplay = ({ url, shopName }: QRCodeDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );

      // Also generate data URL for download
      QRCode.toDataURL(url, { width: 1000 }).then(setQrDataUrl);
    }
  }, [url]);

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `${shopName}-qr-code.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  const shareQR = async () => {
    if (navigator.share && qrDataUrl) {
      try {
        const blob = await (await fetch(qrDataUrl)).blob();
        const file = new File([blob], `${shopName}-qr-code.png`, { type: 'image/png' });
        await navigator.share({
          title: `${shopName} QR Code`,
          text: `Scan this QR code to view ${shopName}`,
          files: [file]
        });
        toast({ title: "Success", description: "QR code shared successfully!" });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({
          title: "Share failed",
          description: "Could not share QR code. Attempting to copy link instead.",
          variant: "destructive"
        });
        copyLink(); // Fallback to copying the link
      }
    } else {
      toast({
        title: "Share not supported",
        description: "Copying link instead.",
        variant: "default"
      });
      copyLink(); // Fallback to copying the link
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Shop link copied to clipboard"
    });
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shopName,
          text: `Check out ${shopName}`,
          url: url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCodeIcon className="w-5 h-5 text-primary" />
          <CardTitle>Your Shop QR Code</CardTitle>
        </div>
        <CardDescription>
          Customers can scan this to view your menu
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg">
          <canvas ref={canvasRef} />
        </div>
        <div className="text-sm text-center text-muted-foreground break-all px-4">
          {url}
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button onClick={downloadQR} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={shareQR} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share QR
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button onClick={copyLink} variant="secondary">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={shareLink} variant="secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
