import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileContextType {
  profileData: any;
  isLoading: boolean;
  updateProfileData: (data: any) => void;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile data when user changes
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        setIsLoading(true);
        console.log('=== PROFILE CONTEXT: Loading profile for user:', user.id);
        try {
          // Add cache-busting with timestamp to force fresh data
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          console.log('=== PROFILE CONTEXT: Loaded data:', data);
          console.log('=== PROFILE CONTEXT: Error (if any):', error);
          console.log('=== PROFILE CONTEXT: Auth user metadata:', user.user_metadata);
          
          if (error) {
            console.error('=== PROFILE CONTEXT: Error loading profile - RLS or DB issue?', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            // Still set data to null but don't throw
            setProfileData(null);
          } else if (data) {
            console.log('=== PROFILE CONTEXT: Successfully loaded full_name:', data.full_name);
            setProfileData(data);
          }
        } catch (error) {
          console.error('=== PROFILE CONTEXT: Exception loading profile:', error);
          setProfileData(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('=== PROFILE CONTEXT: No user ID, clearing profile');
        setProfileData(null);
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const updateProfileData = (data: any) => {
    console.log('=== PROFILE CONTEXT: Updating profile data:', data);
    setProfileData(data);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('=== PROFILE CONTEXT: Refreshing profile from database');
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('=== PROFILE CONTEXT: Error refreshing profile:', error);
        } else if (data) {
          console.log('=== PROFILE CONTEXT: Refreshed profile - new full_name:', data.full_name);
          setProfileData(data);
        }
      } catch (error) {
        console.error('=== PROFILE CONTEXT: Exception refreshing profile:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <ProfileContext.Provider value={{ profileData, isLoading, updateProfileData, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}