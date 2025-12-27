import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import type { RouteItem, Suggestion, Todo, Place, User } from '@/types/database';

export function PDFExportButton() {
  const [loading, setLoading] = useState(false);

  const exportPDF = async () => {
    setLoading(true);
    
    try {
      // Fetch all required data
      const [routeRes, suggestionsRes, todosRes, placesRes, usersRes] = await Promise.all([
        supabase
          .from('route_items')
          .select('*, place:places(*)')
          .order('order_index'),
        supabase
          .from('suggestions')
          .select('*, creator:users(*), votes(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('todos')
          .select('*, assignee:users!todos_assignee_id_fkey(*)')
          .eq('status', 'open')
          .order('due_date'),
        supabase.from('places').select('*'),
        supabase.from('users').select('*'),
      ]);

      const routeItems = routeRes.data || [];
      const suggestions = suggestionsRes.data || [];
      const todos = todosRes.data || [];
      const places = placesRes.data || [];
      const users = usersRes.data || [];

      // Calculate scores for suggestions
      const suggestionsWithScores = suggestions.map(s => ({
        ...s,
        score: (s.votes || []).reduce((acc: number, v: { value: number }) => acc + v.value, 0)
      }));

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Vietnam Trip Planner', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Exported: ${new Date().toLocaleString('de-DE')}`, pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0);

      yPos += 15;

      // Route section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Route', 14, yPos);
      yPos += 8;

      const routeData = routeItems.map((item: RouteItem & { place: Place }, index: number) => [
        `#${index + 1}`,
        item.place?.name || 'Unknown',
        item.start_date ? new Date(item.start_date).toLocaleDateString('de-DE') : '-',
        item.status.replace('_', ' ').toUpperCase(),
        item.notes || '-'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Ort', 'Datum', 'Status', 'Notizen']],
        body: routeData,
        theme: 'striped',
        headStyles: { fillColor: [45, 106, 79] },
        styles: { fontSize: 9 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Suggestions per place (Top 3)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Vorschläge pro Ort', 14, yPos);
      yPos += 8;

      for (const routeItem of routeItems as (RouteItem & { place: Place })[]) {
        const placeSuggestions = suggestionsWithScores
          .filter(s => s.place_id === routeItem.place_id)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        if (placeSuggestions.length > 0) {
          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(routeItem.place?.name || 'Unknown', 14, yPos);
          yPos += 6;

          const suggestionData = placeSuggestions.map((s, i) => [
            `${i + 1}.`,
            s.title,
            s.category,
            `Score: ${s.score}`,
            s.cost_estimate || '-'
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [['#', 'Titel', 'Kategorie', 'Score', 'Kosten']],
            body: suggestionData,
            theme: 'grid',
            headStyles: { fillColor: [200, 120, 70] },
            styles: { fontSize: 8 },
            margin: { left: 14 },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Open Todos
      if (todos.length > 0) {
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Offene ToDos', 14, yPos);
        yPos += 8;

        const todoData = todos.map((todo: Todo & { assignee?: User }) => [
          todo.title,
          todo.assignee?.name || '-',
          todo.due_date ? new Date(todo.due_date).toLocaleDateString('de-DE') : '-'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Titel', 'Zugewiesen an', 'Fällig']],
          body: todoData,
          theme: 'striped',
          headStyles: { fillColor: [70, 130, 180] },
          styles: { fontSize: 9 },
        });
      }

      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Seite ${i} von ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      doc.save(`vietnam-trip-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF erfolgreich exportiert!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Fehler beim PDF-Export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={exportPDF}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Export PDF</span>
    </Button>
  );
}
