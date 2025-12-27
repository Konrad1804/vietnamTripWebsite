import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/database';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  loading: boolean;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    setUsers(data || []);
  };

  useEffect(() => {
    const init = async () => {
      await refreshUsers();
      
      // Check localStorage for saved user
      const savedUserId = localStorage.getItem('vietnam_trip_user_id');
      if (savedUserId) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', savedUserId)
          .single();
        
        if (data) {
          setCurrentUser(data);
        }
      }
      
      setLoading(false);
    };

    init();
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('vietnam_trip_user_id', user.id);
    } else {
      localStorage.removeItem('vietnam_trip_user_id');
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      users,
      loading,
      refreshUsers,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
