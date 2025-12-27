import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

type ActionType = 'create' | 'update' | 'delete' | 'reorder';
type EntityType = 'route_item' | 'suggestion' | 'vote' | 'todo' | 'place' | 'user';

export function useAuditLog() {
  const { currentUser } = useUser();

  const writeLog = async (
    actionType: ActionType,
    entityType: EntityType,
    entityId: string,
    beforeData?: Record<string, unknown> | null,
    afterData?: Record<string, unknown> | null
  ) => {
    const { error } = await supabase.from('audit_logs').insert({
      action_type: actionType as any,
      entity_type: entityType as any,
      entity_id: entityId,
      actor_id: currentUser?.id || null,
      before_json: beforeData || null,
      after_json: afterData || null,
    });

    if (error) {
      console.error('Error writing audit log:', error);
    }
  };

  return { writeLog };
}
