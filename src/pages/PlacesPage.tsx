import { useState, useEffect } from 'react';
import { MapPin, Plus, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  place_id: string;
  title: string;
  description?: string;
  category: string;
  link?: string;
  cost_estimate?: string;
  created_at: string;
  created_by?: string;
  creator?: { name: string };
  votes?: { user_id: string; value: number }[];
  score: number;
}

interface Place {
  id: string;
  name: string;
  region?: string;
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'activity', link: '', cost_estimate: '' });
  const { currentUser } = useUser();
  const { writeLog } = useAuditLog();

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlace) fetchSuggestions(selectedPlace.id);
  }, [selectedPlace]);

  const fetchPlaces = async () => {
    const { data } = await supabase.from('places').select('*').order('name');
    setPlaces(data || []);
    if (data?.length) setSelectedPlace(data[0]);
    setLoading(false);
  };

  const fetchSuggestions = async (placeId: string) => {
    const { data } = await supabase
      .from('suggestions')
      .select('*, creator:users(*), votes(*)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    const withScores = (data || []).map(s => ({
      ...s,
      score: (s.votes || []).reduce((acc: number, v: { value: number }) => acc + v.value, 0)
    }));
    setSuggestions(withScores);
  };

  const handleAddSuggestion = async () => {
    if (!formData.title.trim() || !selectedPlace) {
      toast.error('Titel ist erforderlich');
      return;
    }

    // Basic URL validation
    if (formData.link && !/^https?:\/\/.+/.test(formData.link)) {
      toast.error('Link muss eine gültige URL sein');
      return;
    }

    const { data, error } = await supabase.from('suggestions').insert({
      place_id: selectedPlace.id,
      title: formData.title.trim(),
      description: formData.description || null,
      category: formData.category as any,
      link: formData.link || null,
      cost_estimate: formData.cost_estimate || null,
      created_by: currentUser?.id,
    }).select().single();

    if (error) {
      toast.error('Fehler beim Erstellen');
      return;
    }

    await writeLog('create', 'suggestion', data.id, null, data);
    setFormData({ title: '', description: '', category: 'activity', link: '', cost_estimate: '' });
    setShowForm(false);
    fetchSuggestions(selectedPlace.id);
    toast.success('Vorschlag hinzugefügt');
  };

  const handleVote = async (suggestion: Suggestion, value: number) => {
    if (!currentUser) {
      toast.error('Bitte wähle zuerst einen Benutzer');
      return;
    }

    const existingVote = suggestion.votes?.find(v => v.user_id === currentUser.id);

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote
        await supabase.from('votes').delete().eq('suggestion_id', suggestion.id).eq('user_id', currentUser.id);
        await writeLog('delete', 'vote', suggestion.id, { value: existingVote.value }, null);
      } else {
        // Update vote
        await supabase.from('votes').update({ value }).eq('suggestion_id', suggestion.id).eq('user_id', currentUser.id);
        await writeLog('update', 'vote', suggestion.id, { value: existingVote.value }, { value });
      }
    } else {
      // Create vote
      await supabase.from('votes').insert({ suggestion_id: suggestion.id, user_id: currentUser.id, value });
      await writeLog('create', 'vote', suggestion.id, null, { value });
    }

    fetchSuggestions(selectedPlace!.id);
  };

  const categoryColors: Record<string, string> = {
    activity: 'bg-jade-light text-jade',
    food: 'bg-terracotta-light text-terracotta',
    hotel: 'bg-ocean-light text-ocean',
    transport: 'bg-gold-light text-gold',
    other: 'bg-muted text-muted-foreground',
  };

  const sortedByScore = [...suggestions].sort((a, b) => b.score - a.score);
  const sortedByNew = [...suggestions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold">Orte & Vorschläge</h1>
        </div>

        {/* Place selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {places.map((place) => (
            <Button
              key={place.id}
              variant={selectedPlace?.id === place.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPlace(place)}
              className="gap-2"
            >
              <MapPin className="w-4 h-4" />
              {place.name}
            </Button>
          ))}
        </div>

        {selectedPlace && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedPlace.name}</h2>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="w-4 h-4" />Vorschlag</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neuer Vorschlag für {selectedPlace.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input placeholder="Titel *" value={formData.title} onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))} />
                    <Textarea placeholder="Beschreibung" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} />
                    <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activity">Aktivität</SelectItem>
                        <SelectItem value="food">Essen</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="other">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Link (optional)" value={formData.link} onChange={(e) => setFormData(f => ({ ...f, link: e.target.value }))} />
                    <Input placeholder="Geschätzte Kosten (optional)" value={formData.cost_estimate} onChange={(e) => setFormData(f => ({ ...f, cost_estimate: e.target.value }))} />
                    <Button onClick={handleAddSuggestion} className="w-full">Hinzufügen</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="top">
              <TabsList className="mb-4">
                <TabsTrigger value="top">Top (nach Score)</TabsTrigger>
                <TabsTrigger value="new">Neu</TabsTrigger>
              </TabsList>

              <TabsContent value="top" className="space-y-3">
                {sortedByScore.map((s) => <SuggestionCard key={s.id} suggestion={s} onVote={handleVote} colors={categoryColors} currentUserId={currentUser?.id} />)}
              </TabsContent>

              <TabsContent value="new" className="space-y-3">
                {sortedByNew.map((s) => <SuggestionCard key={s.id} suggestion={s} onVote={handleVote} colors={categoryColors} currentUserId={currentUser?.id} />)}
              </TabsContent>
            </Tabs>

            {suggestions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Noch keine Vorschläge für diesen Ort</div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function SuggestionCard({ suggestion, onVote, colors, currentUserId }: { suggestion: Suggestion; onVote: (s: Suggestion, v: number) => void; colors: Record<string, string>; currentUserId?: string }) {
  const userVote = suggestion.votes?.find(v => v.user_id === currentUserId);

  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <Button size="icon" variant="ghost" className={cn("h-8 w-8", userVote?.value === 1 && "text-jade bg-jade-light")} onClick={() => onVote(suggestion, 1)}>
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <span className={cn("font-bold text-lg", suggestion.score > 0 ? "text-jade" : suggestion.score < 0 ? "text-destructive" : "text-muted-foreground")}>{suggestion.score}</span>
            <Button size="icon" variant="ghost" className={cn("h-8 w-8", userVote?.value === -1 && "text-destructive bg-destructive/10")} onClick={() => onVote(suggestion, -1)}>
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{suggestion.title}</h3>
              <Badge className={colors[suggestion.category]}>{suggestion.category}</Badge>
            </div>
            {suggestion.description && <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {suggestion.cost_estimate && <span>~{suggestion.cost_estimate}</span>}
              {suggestion.link && <a href={suggestion.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary"><ExternalLink className="w-3 h-3" />Link</a>}
              <span>von {suggestion.creator?.name || 'Unbekannt'}</span>
              <span>{new Date(suggestion.created_at).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
