import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Check, Mail, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionManagerProps {
  shopId: string;
  currentSubscriptionTier: string;
  currentSubscriptionExpiry: string;
}

interface Payment {
  id: string;
  amount: number;
  plan_name: string;
  payment_date: string;
  status: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  { name: 'Free', price: 0, products: 1, tier: 'free', validity: 'Forever' },
  { name: 'Basic', price: 100, products: 25, tier: 'basic', validity: '45 days' },
  { name: 'Pro', price: 200, products: 75, tier: 'pro', validity: '60 days' },
  { name: 'Premium', price: 500, products: 200, tier: 'premium', validity: '90 days' }
];

const SubscriptionManager = ({ shopId, currentSubscriptionTier, currentSubscriptionExpiry }: SubscriptionManagerProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const activePlan = plans.find(plan => plan.tier === currentSubscriptionTier);
  const daysUntilExpiry = currentSubscriptionExpiry
    ? Math.ceil((new Date(currentSubscriptionExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isExpired = daysUntilExpiry <= 0;

  const getExpiryDateString = (expiryDate: string) => {
    if (!expiryDate) return 'N/A';
    const date = new Date(expiryDate);
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchPayments();
    loadRazorpayScript();
  }, [shopId]);

  useEffect(() => {
    fetchPayments();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('shop_id', shopId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
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

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!window.Razorpay) {
      toast({
        title: "Error",
        description: "Payment system not loaded. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    const options = {
      key: 'rzp_test_RW0KK4KieXIcOW',
      amount: plan.price * 100,
      currency: 'INR',
      name: 'QR Menu',
      description: `${plan.name} Plan - ${plan.products} Products`,
      handler: async function (response: any) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: {
              razorpay_payment_id: response.razorpay_payment_id,
              shop_id: shopId,
              plan_name: plan.name,
              plan_tier: plan.tier,
              amount: plan.price,
              product_limit: plan.products,
              plan_validity: plan.validity,
              current_expiry: currentSubscriptionExpiry // Pass current expiry to function
            }
          });

          if (error) throw error;

          toast({
            title: "Payment Successful!",
            description: `Your ${plan.name} plan is now active`
          });

          // Re-enable scrolling
          document.body.style.overflow = 'auto';
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error: any) {
          document.body.style.overflow = 'auto';
          toast({
            title: "Payment verification failed",
            description: error.message,
            variant: "destructive"
          });
        }
      },
      modal: {
        ondismiss: function() {
          document.body.style.overflow = 'auto';
        }
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#6366f1'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function () {
      document.body.style.overflow = 'auto';
    });
    rzp.open();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">Upgrade to add more products to your menu</p>
      </div>

      {activePlan && (
        <Card className="border-2 border-primary relative">
          <CardHeader>
            <CardTitle className="flex items-center">
              {activePlan.name} Plan
              <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                <BadgeCheck className="w-4 h-4 mr-1" /> Active Plan
              </Badge>
            </CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">₹{activePlan.price}</span>
              <span className="text-sm text-muted-foreground"> / {activePlan.validity}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Up to {activePlan.products} products</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">QR Code generation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">WhatsApp integration</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Expires: {getExpiryDateString(currentSubscriptionExpiry)}
              </p>
              {daysUntilExpiry > 0 && (
                <p className="text-sm text-muted-foreground">
                  (Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''})
                </p>
              )}
              {isExpired && (
                <p className="text-sm text-red-500 font-semibold">
                  Your plan has expired. Please recharge.
                </p>
              )}
            </div>
            {activePlan.price > 0 && (
              <Button 
                className="w-full" 
                onClick={() => handlePayment(activePlan)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now / Recharge Again
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <h3 className="text-xl font-bold mb-2">Available Plans</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.filter(plan => plan.tier !== currentSubscriptionTier).map((plan) => (
          <Card key={plan.tier}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">₹{plan.price}</span>
                <span className="text-sm text-muted-foreground"> / {plan.validity}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Up to {plan.products} products</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">QR Code generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">WhatsApp integration</span>
                </div>
              </div>
              {plan.price > 0 ? (
                <Button 
                  className="w-full" 
                  onClick={() => handlePayment(plan)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Free Plan
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need More Products?</CardTitle>
          <CardDescription>
            Contact us for a custom plan
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button variant="outline" asChild>
            <a href="mailto:venkattechstudios@gmail.com">
              <Mail className="w-4 h-4 mr-2" />
              Contact us at venkattechstudios@gmail.com
            </a>
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold mb-4">Payment History</h3>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No payments yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex justify-between items-center py-4">
                  <div>
                    <p className="font-semibold">{payment.plan_name} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{payment.amount}</p>
                    <p className="text-sm text-green-600 capitalize">{payment.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;
