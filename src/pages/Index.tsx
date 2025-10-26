import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { QrCode, Store, Smartphone, CreditCard, Check } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">QRPlate</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Digital Menu for Your Shop
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create your QR menu in minutes. Let customers view your products and order via WhatsApp instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">View Demo</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Store className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Easy Setup</CardTitle>
                <CardDescription>
                  Create your shop in minutes. Add products, logo, and start sharing.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <QrCode className="w-12 h-12 text-primary mb-4" />
                <CardTitle>QR Code Menu</CardTitle>
                <CardDescription>
                  Generate and download QR codes. Customers scan and view your menu instantly.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Smartphone className="w-12 h-12 text-primary mb-4" />
                <CardTitle>WhatsApp Orders</CardTitle>
                <CardDescription>
                  Orders redirect to your WhatsApp with pre-filled messages. No app needed.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section className="container mx-auto px-4 py-20 bg-secondary/10 rounded-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Free', price: '₹0', products: 1, validity: 'Forever' },
              { name: 'Basic', price: '₹100', products: 25, validity: '45 days' },
              { name: 'Pro', price: '₹200', products: 75, validity: '60 days' },
              { name: 'Premium', price: '₹500', products: 200, validity: '90 days' }
            ].map((plan) => (
              <Card key={plan.name} className={plan.name === 'Basic' ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">{plan.validity}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">Up to {plan.products} products</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">QR Code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">WhatsApp Orders</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link to="/signup">Start Your Free Shop</Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join local shops using QRPlate to grow their business.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">Create Your Shop Now</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 QRPlate. All rights reserved.</p>
          <p className="mt-2">
            Need more products? Contact{' '}
            <a href="mailto:venkattechstudios@gmail.com" className="text-primary hover:underline">
              venkattechstudios@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
