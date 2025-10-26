import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { LogOut, Store, Package, CreditCard, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageUpload from '@/components/ImageUpload';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ProductManagement from '@/components/ProductManagement';
import SubscriptionManager from '@/components/SubscriptionManager';

interface Shop {
  id: string;
  slug: string;
  shop_name: string;
  description: string;
  address: string;
  logo_url: string;
  whatsapp_number: string;
  open_time: string;
  close_time: string;
  product_limit: number;
  current_products_count: number;
  subscription_tier: string;
  subscription_expiry: string;
  plan_validity: string;
}

const ShopAdmin = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    address: '',
    whatsapp_number: '',
    logo_url: '',
    open_time: '',
    close_time: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }
    fetchShop();
  }, [user, slug]);

  const fetchShop = async () => {
    if (!user) return; // Ensure user is available before fetching

    try {
      let { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .eq('owner_user_id', user.id) // Use user.id directly as we've checked for user
        .single();

      if (error) {
        console.error("Supabase fetchShop error:", error);
        throw error;
      }

      if (!data) {
        // Retry fetching the shop a few times with a delay, in case of data propagation delay
        let retries = 3;
        while (!data && retries > 0) {
          console.log(`Shop not found, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
          const { data: retryData, error: retryError } = await supabase
            .from('shops')
            .select('*')
            .eq('slug', slug)
            .eq('owner_user_id', user?.id)
            .single();
          
          if (retryError) {
            console.error("Supabase fetchShop retry error:", retryError);
            throw retryError;
          }
          data = retryData;
          retries--;
        }

        if (!data) {
          toast({
            title: "Shop not found",
            description: "You don't have access to this shop or it hasn't been created yet.",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }
      }

      const planValidityMap: { [key: string]: string } = {
        'free': 'Forever',
        'basic': '45 days',
        'pro': '60 days',
        'premium': '90 days',
      };

      setShop({
        ...data,
        plan_validity: planValidityMap[data.subscription_tier] || 'N/A'
      });

      // Load timings from local storage, overriding Supabase data if available
      const localOpenTime = localStorage.getItem(`shop_${data.id}_open_time`);
      const localCloseTime = localStorage.getItem(`shop_${data.id}_close_time`);

      setFormData({
        shop_name: data.shop_name || '',
        description: data.description || '',
        address: data.address || '',
        whatsapp_number: data.whatsapp_number || '',
        logo_url: data.logo_url || '',
        open_time: localOpenTime !== null ? localOpenTime : (data.open_time || ''),
        close_time: localCloseTime !== null ? localCloseTime : (data.close_time || '')
      });
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

  const handleSave = async () => {
    if (!shop) return;

    setSaving(true);
    try {
      // Save shop timings to local storage
      localStorage.setItem(`shop_${shop.id}_open_time`, formData.open_time);
      localStorage.setItem(`shop_${shop.id}_close_time`, formData.close_time);

      // Include open_time and close_time in the Supabase update
      const { error } = await supabase
        .from('shops')
        .update(formData) // Update with all formData, including open_time and close_time
        .eq('id', shop.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shop details updated"
      });

      fetchShop();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isExpired = shop?.subscription_expiry 
    ? new Date(shop.subscription_expiry) < new Date() 
    : false;

  const daysUntilExpiry = shop?.subscription_expiry
    ? Math.ceil((new Date(shop.subscription_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const showExpiryWarning = daysUntilExpiry > 0 && daysUntilExpiry <= 3;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!shop) {
    return null;
  }

  const shopUrl = `${window.location.origin}/shop/${shop.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Store className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-center sm:text-left">{shop.shop_name}</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => window.open(`/shop/${shop.slug}`, '_blank')} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Shop
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isExpired && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Your subscription has expired. Please recharge to add new products.
            </AlertDescription>
          </Alert>
        )}

        {showExpiryWarning && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. 
              Consider renewing to avoid interruption.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="shop" className="w-full">
          <TabsList className="grid w-full grid-flow-col auto-cols-max overflow-x-auto sm:grid-cols-3">
            <TabsTrigger value="shop" className="whitespace-nowrap">
              <Store className="w-4 h-4 mr-2" />
              Shop Details
            </TabsTrigger>
            <TabsTrigger value="products" className="whitespace-nowrap">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="billing" className="whitespace-nowrap">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Information</CardTitle>
                  <CardDescription>
                    Update your shop details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop_name">Shop Name</Label>
                    <Input
                      id="shop_name"
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      placeholder="919876543210"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., 919876543210)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="open_time">Open Time</Label>
                    <Input
                      id="open_time"
                      type="time"
                      value={formData.open_time}
                      onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close_time">Close Time</Label>
                    <Input
                      id="close_time"
                      type="time"
                      value={formData.close_time}
                      onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                    />
                  </div>
                  <ImageUpload
                    currentImageUrl={formData.logo_url}
                    onImageUploaded={(url) => setFormData({ ...formData, logo_url: url })}
                    label="Shop Logo"
                    folder="logos"
                  />
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <QRCodeDisplay url={shopUrl} shopName={shop.shop_name} />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Plan:</span>
                      <span className="font-semibold capitalize">{shop.subscription_tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Validity:</span>
                      <span className="font-semibold">{shop.plan_validity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Products:</span>
                      <span className="font-semibold">
                        {shop.current_products_count} / {shop.product_limit}
                      </span>
                    </div>
                    {shop.subscription_expiry && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expires:</span>
                        <span className="font-semibold">
                          {new Date(shop.subscription_expiry).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement 
              shopId={shop.id} 
              productLimit={shop.product_limit}
              currentCount={shop.current_products_count}
              isExpired={isExpired}
            />
          </TabsContent>

          <TabsContent value="billing">
            <div className="flex justify-center">
              <div className="w-full"> {/* Removed max-w-md to allow full width on larger screens */}
                <SubscriptionManager 
                  shopId={shop.id} 
                  currentSubscriptionTier={shop.subscription_tier}
                  currentSubscriptionExpiry={shop.subscription_expiry}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ShopAdmin;
