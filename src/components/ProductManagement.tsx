import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageUpload from './ImageUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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

interface ProductManagementProps {
  shopId: string;
  productLimit: number;
  currentCount: number;
  isExpired: boolean;
}

const ProductManagement = ({ shopId, productLimit, currentCount, isExpired }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    mrp: '',
    offer_price: '',
    description: '',
    quantity_description: '',
    category: '',
    image_url: '',
    stock_status: 'available',
  });

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const productsWithLocalStorage = (data || []).map(product => {
        const localMrp = localStorage.getItem(`product_${product.id}_mrp`);
        const localOfferPrice = localStorage.getItem(`product_${product.id}_offer_price`);
        const localQuantityDescription = localStorage.getItem(`product_${product.id}_quantity_description`);
        const localStockStatus = localStorage.getItem(`product_${product.id}_stock_status`);

        const updatedProduct = { ...product };
        if (localMrp !== null) updatedProduct.mrp = parseFloat(localMrp);
        if (localOfferPrice !== null) updatedProduct.offer_price = parseFloat(localOfferPrice);
        if (localQuantityDescription !== null) updatedProduct.quantity_description = localQuantityDescription;
        if (localStockStatus !== null) updatedProduct.stock_status = localStockStatus as 'available' | 'limited_stock' | 'out_of_stock';
        
        return updatedProduct;
      });

      setProducts(productsWithLocalStorage);
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

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      mrp: '',
      offer_price: '',
      description: '',
      quantity_description: '',
      category: '',
      image_url: '',
      stock_status: 'available',
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      mrp: product.mrp?.toString() || '',
      offer_price: product.offer_price?.toString() || '', // Safely access offer_price
      description: product.description || '',
      quantity_description: product.quantity_description || '',
      category: product.category || '',
      image_url: product.image_url || '',
      stock_status: product.stock_status || 'available',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct && currentCount >= productLimit) {
      toast({
        title: "Product limit reached",
        description: "Please upgrade your plan to add more products",
        variant: "destructive"
      });
      return;
    }

    try {
      // Separate data for Supabase and local storage
      const supabaseProductData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        image_url: formData.image_url,
        shop_id: shopId
      };

      const localStorageProductData = {
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        offer_price: formData.offer_price ? parseFloat(formData.offer_price) : parseFloat(formData.price),
        quantity_description: formData.quantity_description,
        stock_status: formData.stock_status as 'available' | 'limited_stock' | 'out_of_stock',
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(supabaseProductData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Success", description: "Product updated" });
        // Save product details to local storage
        localStorage.setItem(`product_${editingProduct.id}_mrp`, localStorageProductData.mrp?.toString() || '');
        localStorage.setItem(`product_${editingProduct.id}_offer_price`, localStorageProductData.offer_price.toString());
        localStorage.setItem(`product_${editingProduct.id}_quantity_description`, localStorageProductData.quantity_description || '');
        localStorage.setItem(`product_${editingProduct.id}_stock_status`, localStorageProductData.stock_status);
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(supabaseProductData)
          .select()
          .single();

        if (error) throw error;
        toast({ title: "Success", description: "Product added" });
        // Save product details to local storage for new product
        if (newProduct) {
          localStorage.setItem(`product_${newProduct.id}_mrp`, localStorageProductData.mrp?.toString() || '');
          localStorage.setItem(`product_${newProduct.id}_offer_price`, localStorageProductData.offer_price.toString());
          localStorage.setItem(`product_${newProduct.id}_quantity_description`, localStorageProductData.quantity_description || '');
          localStorage.setItem(`product_${newProduct.id}_stock_status`, localStorageProductData.stock_status);
        }
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Product deleted" });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const canAddProduct = currentCount < productLimit && !isExpired;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {currentCount} / {productLimit} products
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button disabled={!canAddProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit' : 'Add'} Product</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update' : 'Add'} product details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (Original Price - ₹)</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  placeholder="e.g., 999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer_price">Offer Price (Discounted Price - ₹) *</Label>
                <Input
                  id="offer_price"
                  type="number"
                  step="0.01"
                  value={formData.offer_price}
                  onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                  required
                  placeholder="e.g., 599"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_description">Quantity Description</Label>
                <Input
                  id="quantity_description"
                  value={formData.quantity_description}
                  onChange={(e) => setFormData({ ...formData, quantity_description: e.target.value })}
                  placeholder="e.g., 1KG, Half KG, Combo Pack"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Beverages, Starters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_status">Stock Status</Label>
                <Select
                  value={formData.stock_status}
                  onValueChange={(value) => setFormData({ ...formData, stock_status: value as 'available' | 'limited_stock' | 'out_of_stock' })}
                >
                  <SelectTrigger id="stock_status">
                    <SelectValue placeholder="Select stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available 🟢</SelectItem>
                    <SelectItem value="limited_stock">Limited Stock 🟡</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock 🔴</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <ImageUpload
                currentImageUrl={formData.image_url}
                onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                label="Product Image"
                folder="products"
              />
              <Button type="submit" className="w-full">
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!canAddProduct && (
        <Alert>
          <AlertDescription>
            {isExpired 
              ? "Your subscription has expired. Renew to add more products."
              : "You've reached your product limit. Upgrade to add more."}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products yet</p>
            <p className="text-sm text-muted-foreground">Add your first product to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{product.name}</span>
                  <div className="flex flex-col items-end">
                    {product.mrp && product.mrp > product.offer_price && (
                      <span className="text-sm text-muted-foreground line-through">₹{product.mrp}</span>
                    )}
                    <span className="text-lg font-bold text-primary">₹{product.offer_price}</span>
                    {product.mrp && product.mrp > product.offer_price && (
                      <span className="text-xs text-green-600">
                        {Math.round(((product.mrp - product.offer_price) / product.mrp) * 100)}% OFF
                      </span>
                    )}
                  </div>
                </CardTitle>
                {product.category && (
                  <CardDescription>{product.category}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {product.quantity_description && (
                  <p className="text-sm text-muted-foreground">Quantity: {product.quantity_description}</p>
                )}
                {product.description && (
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
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
              </CardContent>
              <CardContent className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
