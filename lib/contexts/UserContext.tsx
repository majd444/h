"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@/hooks/useAuth0';
import Cookies from 'js-cookie';

// Define subscription plans with their respective message limits
const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    messageLimit: 250,
    price: 0
  },
  BASIC: {
    name: 'Basic',
    messageLimit: 2500,
    price: 10
  },
  PRO: {
    name: 'Pro',
    messageLimit: 6000,
    price: 20
  }
};

// User data type definition
type UserData = {
  auth0Id: string;
  email: string;
  name: string;
  picture?: string;
  subscriptionPlan: 'FREE' | 'BASIC' | 'PRO';
  messageLimit: number;
  messagesUsed: number;
  lastUpdated: string;
};

// Context type definition
type UserContextType = {
  userData: UserData | null;
  isLoading: boolean;
  saveUserProfile: (profile: any) => void;
  updateSubscriptionPlan: (plan: 'FREE' | 'BASIC' | 'PRO') => void;
  incrementMessageCount: (count?: number) => boolean;
  remainingMessages: number;
  hasReachedLimit: boolean;
};

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserContextProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth0();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage on initial load
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedUser = localStorage.getItem(`user_data_${user.sub}`);
      
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      } else {
        // If no stored user data, create default with FREE plan
        const newUserData: UserData = {
          auth0Id: user.sub!,
          email: user.email!,
          name: user.name!,
          picture: user.picture,
          subscriptionPlan: 'FREE',
          messageLimit: SUBSCRIPTION_PLANS.FREE.messageLimit,
          messagesUsed: 0,
          lastUpdated: new Date().toISOString()
        };
        
        setUserData(newUserData);
        localStorage.setItem(`user_data_${user.sub}`, JSON.stringify(newUserData));
      }
    }
    
    setIsLoading(false);
  }, [isAuthenticated, user]);

  // Check for subscription from cookies
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if payment_completed cookie exists
      const paymentCompleted = Cookies.get('payment_completed');
      
      if (paymentCompleted === 'true') {
        // Check if there's a selected plan in localStorage
        const selectedPlan = localStorage.getItem('selectedPlan');
        
        if (selectedPlan) {
          const planData = JSON.parse(selectedPlan);
          let subscriptionType: 'FREE' | 'BASIC' | 'PRO';
          
          // Determine subscription type based on price
          if (planData.price === 0) {
            subscriptionType = 'FREE';
          } else if (planData.price === 10 || planData.title === 'Basic') {
            subscriptionType = 'BASIC';
          } else if (planData.price === 20 || planData.title === 'Pro') {
            subscriptionType = 'PRO';
          } else {
            // Default to FREE if not matching
            subscriptionType = 'FREE';
          }
          
          // Update the user subscription
          updateSubscriptionPlan(subscriptionType);
          
          // Clean up the localStorage
          localStorage.removeItem('selectedPlan');
          // Note: We don't clear the payment_completed cookie as it may be needed
          // for other parts of the application
        }
      }
    }
  }, [isAuthenticated, user]);

  // Save user profile
  const saveUserProfile = (profile: any) => {
    if (!user) return;
    
    const updatedUserData: UserData = {
      ...userData!,
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    
    setUserData(updatedUserData);
    localStorage.setItem(`user_data_${user.sub}`, JSON.stringify(updatedUserData));
  };

  // Update subscription plan
  const updateSubscriptionPlan = (plan: 'FREE' | 'BASIC' | 'PRO') => {
    if (!user || !userData) return;
    
    const updatedUserData: UserData = {
      ...userData,
      subscriptionPlan: plan,
      messageLimit: SUBSCRIPTION_PLANS[plan].messageLimit,
      lastUpdated: new Date().toISOString()
    };
    
    setUserData(updatedUserData);
    localStorage.setItem(`user_data_${user.sub}`, JSON.stringify(updatedUserData));
    
    // Save subscription plan in cookie for 1 year
    Cookies.set('subscription_plan', plan, { 
      expires: 365, 
      path: '/', 
      sameSite: 'strict'
    });
  };

  // Increment message count
  const incrementMessageCount = (count: number = 1): boolean => {
    if (!user || !userData) return false;
    
    const newCount = userData.messagesUsed + count;
    
    // Check if user has reached their limit
    if (newCount > userData.messageLimit) {
      return false; // Can't send more messages
    }
    
    const updatedUserData: UserData = {
      ...userData,
      messagesUsed: newCount,
      lastUpdated: new Date().toISOString()
    };
    
    setUserData(updatedUserData);
    localStorage.setItem(`user_data_${user.sub}`, JSON.stringify(updatedUserData));
    return true;
  };

  // Calculate remaining messages
  const remainingMessages = userData ? Math.max(0, userData.messageLimit - userData.messagesUsed) : 0;
  
  // Check if user has reached their message limit
  const hasReachedLimit = userData ? userData.messagesUsed >= userData.messageLimit : false;

  const value = {
    userData,
    isLoading,
    saveUserProfile,
    updateSubscriptionPlan,
    incrementMessageCount,
    remainingMessages,
    hasReachedLimit
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserContextProvider');
  }
  return context;
};
