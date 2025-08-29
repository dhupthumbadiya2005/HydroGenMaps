import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, DollarSign, Calendar } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  location: string;
  type: string;
  investment: number;
  dateAdded: string;
  notes: string;
  status: 'active' | 'planned' | 'completed';
}

const assetTypes = [
  'Hydrogen Production Plant',
  'Electrolyzer Facility',
  'Storage Infrastructure',
  'Distribution Network',
  'Fuel Cell Installation',
  'Research Facility'
];

// Mock initial data
const initialAssets: Asset[] = [
  {
    id: '1',
    name: 'Green Hydrogen Plant - Texas',
    location: 'Houston, TX',
    type: 'Hydrogen Production Plant',
    investment: 50000000,
    dateAdded: '2024-01-15',
    notes: 'Large-scale green hydrogen production facility with renewable energy integration.',
    status: 'planned'
  },
  {
    id: '2',
    name: 'Electrolyzer Station - California',
    location: 'Los Angeles, CA',
    type: 'Electrolyzer Facility',
    investment: 25000000,
    dateAdded: '2024-02-20',
    notes: 'High-efficiency PEM electrolyzer for industrial hydrogen supply.',
    status: 'active'
  }
];

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: '',
    investment: '',
    notes: '',
    status: 'planned' as Asset['status']
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      type: '',
      investment: '',
      notes: '',
      status: 'planned'
    });
    setEditingAsset(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.type) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const assetData: Asset = {
      id: editingAsset?.id || Date.now().toString(),
      name: formData.name,
      location: formData.location,
      type: formData.type,
      investment: parseFloat(formData.investment) || 0,
      dateAdded: editingAsset?.dateAdded || new Date().toISOString().split('T')[0],
      notes: formData.notes,
      status: formData.status
    };

    if (editingAsset) {
      setAssets(prev => prev.map(asset => 
        asset.id === editingAsset.id ? assetData : asset
      ));
      toast({
        title: "Asset updated",
        description: "Asset has been successfully updated.",
      });
    } else {
      setAssets(prev => [...prev, assetData]);
      toast({
        title: "Asset created",
        description: "New asset has been added to your portfolio.",
      });
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      location: asset.location,
      type: asset.type,
      investment: asset.investment.toString(),
      notes: asset.notes,
      status: asset.status
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
    toast({
      title: "Asset deleted",
      description: "Asset has been removed from your portfolio.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'planned': return 'bg-warning text-warning-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const totalInvestment = assets.reduce((sum, asset) => sum + asset.investment, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground">
            Manage your hydrogen infrastructure investments
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter asset name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Asset Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investment">Investment Amount</Label>
                  <Input
                    id="investment"
                    type="number"
                    value={formData.investment}
                    onChange={(e) => setFormData(prev => ({ ...prev, investment: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Asset['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this asset..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-gradient">
                  {editingAsset ? 'Update Asset' : 'Create Asset'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assets.length}</p>
              <p className="text-muted-foreground">Total Assets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
              <p className="text-muted-foreground">Total Investment</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assets.filter(a => a.status === 'active').length}</p>
              <p className="text-muted-foreground">Active Assets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets List */}
      <div className="space-y-4">
        {assets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your hydrogen infrastructure portfolio by adding your first asset.
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="btn-gradient">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{asset.name}</h3>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{asset.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>{formatCurrency(asset.investment)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Added {asset.dateAdded}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">{asset.type}</p>
                      {asset.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{asset.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(asset)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(asset.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};