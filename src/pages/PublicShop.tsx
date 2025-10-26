import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, MapPin, Phone, Search, Download, ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Shop {
  id: string;
  slug: string;
  shop_name: string;
  description: string;
  address: string;
  logo_url: string;
  whatsapp_number: string;
  open_time: string | null;
  close_time: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  offer_price: number;
  description: string | null;
  quantity_description: string | null;
  category: string | null;
  image_url: string | null;
  stock_status: 'available' | 'limited_stock' | 'out_of_stock';
}

interface CartItem extends Product {
  quantity: number;
}

const formatTime = (time24: string | null) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const PublicShop = () => {
  const { slug } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    fetchShopData();
  }, [slug]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const fetchShopData = async () => {
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (shopError) throw shopError;
      
      const updatedShopData = { ...shopData };
      const localOpenTime = localStorage.getItem(`shop_${shopData.id}_open_time`);
      const localCloseTime = localStorage.getItem(`shop_${shopData.id}_close_time`);
      if (localOpenTime !== null) {
        updatedShopData.open_time = localOpenTime;
      }
      if (localCloseTime !== null) {
        updatedShopData.close_time = localCloseTime;
      }
      setShop(updatedShopData); // Set shop state with local storage overrides

      // Products data from Supabase
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('category', { ascending: true });

      if (productsError) throw productsError;
      

      // Apply local storage overrides for product details
      const productsWithLocalStorageOverrides = (productsData || []).map(product => {
        const updatedProduct = { ...product };
        const localMrp = localStorage.getItem(`product_${product.id}_mrp`);
        const localOfferPrice = localStorage.getItem(`product_${product.id}_offer_price`);
        const localQuantityDescription = localStorage.getItem(`product_${product.id}_quantity_description`);
        const localStockStatus = localStorage.getItem(`product_${product.id}_stock_status`);

        if (localMrp !== null) updatedProduct.mrp = parseFloat(localMrp);
        if (localOfferPrice !== null) updatedProduct.offer_price = parseFloat(localOfferPrice);
        if (localQuantityDescription !== null) updatedProduct.quantity_description = localQuantityDescription;
        if (localStockStatus !== null) updatedProduct.stock_status = localStockStatus as 'available' | 'limited_stock' | 'out_of_stock';
        
        return updatedProduct;
      });

      setProducts(productsWithLocalStorageOverrides);

      // Extract unique categories from products with local storage overrides
      const uniqueCategories = Array.from(
        new Set(productsWithLocalStorageOverrides?.map(p => p.category).filter(Boolean))
      );
      setCategories(uniqueCategories);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast({
      title: "Added to cart",
      description: `${product.name} added to your order.`
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + delta } : item
      ).filter(item => item.quantity > 0); // Remove if quantity drops to 0 or less
      return updatedCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== productId));
    toast({
      title: "Removed from cart",
      description: "Product removed from your order."
    });
  };

  const isShopOpen = () => {
    if (!shop?.open_time || !shop?.close_time) {
      return true; // Assume open if times are not set
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const [openHour, openMinute] = shop.open_time.split(':').map(Number);
    const openTime = openHour * 60 + openMinute;

    const [closeHour, closeMinute] = shop.close_time.split(':').map(Number);
    const closeTime = closeHour * 60 + closeMinute;

    // Handle cases where closing time is on the next day (e.g., 9 PM - 2 AM)
    if (openTime > closeTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    } else {
      return currentTime >= openTime && currentTime <= closeTime;
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.offer_price || item.price) * item.quantity, 0);
  };

  const sendWhatsAppOrder = () => {
    if (!shop?.whatsapp_number) {
      toast({
        title: "WhatsApp not configured",
        description: "This shop hasn't set up WhatsApp ordering yet",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some products to your cart before ordering.",
        variant: "destructive"
      });
      return;
    }

    let message = `🛒 *New Order from ${shop.shop_name}*\n`;

    if (customerName) {
      message += `👤 Customer Name: ${customerName}\n`;
    }
    if (customerNumber) {
      message += `📞 Customer Number: ${customerNumber}\n`;
    }
    if (customerAddress) {
      message += `🏠 Delivery Address: ${customerAddress}\n`;
    }

      const now = new Date();
      const orderDateTime = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      message += `🗓️ Order Date & Time: ${orderDateTime}\n\n`;
      message += `📦 Items Ordered:\n`;
    cart.forEach((item, index) => {
      const itemPrice = (item.offer_price !== null && !isNaN(item.offer_price))
        ? item.offer_price
        : (item.price !== null && !isNaN(item.price) ? item.price : 0); // Fallback to 0 if both are invalid
      const itemTotal = itemPrice * item.quantity;
      message += `${index + 1}. ${item.name}`;
      if (item.quantity_description) {
        message += ` (${item.quantity_description})`;
      }
      message += ` x ${item.quantity} - ₹${itemTotal.toFixed(2)}\n`;
    });
    message += `💰 Total Amount: ₹${calculateTotal().toFixed(2)}\n`;
    message += `🙏 Please confirm my order!`;

    const whatsappUrl = `https://wa.me/${shop.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setCart([]); // Clear cart after sending order
    setIsCartOpen(false);
    setCustomerName(''); // Clear customer name
    setCustomerNumber(''); // Clear customer number
    toast({
      title: "Order Sent!",
      description: "Your order has been sent to the shop owner via WhatsApp."
    });
  };

  const downloadQR = async () => {
    if (!shop) return;

    const url = window.location.href;
    try {
      const qrDataUrl = await QRCode.toDataURL(url, { width: 1000 });
      const link = document.createElement('a');
      link.download = `${shop.shop_name}-menu-qr.png`;
      link.href = qrDataUrl;
      link.click();
      
      toast({
        title: "QR Code Downloaded",
        description: "Share this QR code with your customers"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not generate QR code",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Shop Not Found</h1>
          <p className="text-muted-foreground">This shop doesn't exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {shop.logo_url && (
              <img 
                src={shop.logo_url} 
                alt={shop.shop_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{shop.shop_name}</h1>
              {shop.description && (
                <p className="text-muted-foreground">{shop.description}</p>
              )}
            </div>
            <Button onClick={downloadQR} variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
          
          {(shop.address || shop.whatsapp_number || (shop.open_time && shop.close_time)) && (
            <div className="mt-4 space-y-2">
              {shop.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {shop.address}
                </div>
              )}
              {shop.open_time && shop.close_time && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isShopOpen() ? (
                    <span className="text-green-600">✅ Open Now - Accepting Orders</span>
                  ) : (
                    <span className="text-red-600">🕒 Currently Closed - Orders will be accepted during working hours</span>
                  )}
                  <span className="ml-2">({formatTime(shop.open_time)} - {formatTime(shop.close_time)})</span>
                </div>
              )}
              {shop.whatsapp_number && (
                <a 
                  href={`https://wa.me/${shop.whatsapp_number}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp: {shop.whatsapp_number}
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <main className="container mx-auto px-4 pb-8">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-32 sm:h-40 md:h-48 object-cover"
                  />
                )}
                <CardHeader className="p-3"> {/* Reduced padding */}
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base sm:text-lg leading-tight">{product.name}</CardTitle>
                    <div className="flex flex-col items-end text-right">
                      {product.mrp && product.mrp > product.offer_price && (
                        <span className="text-xs text-muted-foreground line-through">₹{product.mrp}</span>
                      )}
                      <span className="text-base sm:text-lg font-bold text-primary">₹{product.offer_price}</span>
                      {product.mrp && product.mrp > product.offer_price && (
                        <span className="text-xs text-green-600">
                          {Math.round(((product.mrp - product.offer_price) / product.mrp) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  {product.category && (
                    <Badge variant="secondary" className="mt-1 self-start">{product.category}</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1">
                  {product.quantity_description && (
                    <p className="text-xs text-muted-foreground">{product.quantity_description}</p>
                  )}
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {product.stock_status === 'available' && (
                      <Badge variant="outline" className="text-green-500 border-green-500">Available 🟢</Badge>
                    )}
                    {product.stock_status === 'limited_stock' && (
                      <Badge variant="outline" className="text-yellow-500 border-yellow-500">Limited Stock 🟡</Badge>
                    )}
                    {product.stock_status === 'out_of_stock' && (
                      <Badge variant="outline" className="text-red-500 border-red-500">Out of Stock 🔴</Badge>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-2 text-sm"
                    onClick={() => addToCart(product)}
                    disabled={!isShopOpen() || product.stock_status === 'out_of_stock'}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {cart.length > 0 && (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button 
              className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg"
              size="icon"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg flex flex-col">
            <SheetHeader>
              <SheetTitle>Your Order</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 py-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-2">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    {item.quantity_description && (
                      <p className="text-sm text-muted-foreground">{item.quantity_description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">₹{item.offer_price || item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span>{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="border-t pt-4">
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Your Name (Optional)</Label>
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerNumber">Your WhatsApp Number (Optional)</Label>
                  <Input
                    id="customerNumber"
                    type="tel"
                    placeholder="e.g., 919876543210"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., 919876543210)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Your Address (Optional)</Label>
                  <Textarea
                    id="customerAddress"
                    placeholder="Enter your delivery address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center font-bold text-lg mb-4">
                <span>Total:</span>
                <span>₹{calculateTotal()}</span>
              </div>
              <Button className="w-full" onClick={sendWhatsAppOrder}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Final Order (WhatsApp)
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default PublicShop;
