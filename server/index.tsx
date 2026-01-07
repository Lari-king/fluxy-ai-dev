/*import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Logger middleware
app.use('*', logger(console.log));

// Helper function to get or create demo user
async function getOrCreateDemoUser() {
  const demoUserId = 'demo-user-beba2fa3';
  const demoUser = {
    id: demoUserId,
    email: 'demo@flux.app',
    name: 'Utilisateur Démo',
  };

  // Check if demo user exists
  const existingProfile = await kv.get(`user:${demoUserId}:profile`);
  
  if (!existingProfile) {
    // Initialize demo user data
    await kv.set(`user:${demoUserId}:profile`, {
      ...demoUser,
      createdAt: new Date().toISOString(),
    });

    // Initialize empty data structures
    await kv.set(`user:${demoUserId}:accounts`, []);
    await kv.set(`user:${demoUserId}:transactions`, []);
    await kv.set(`user:${demoUserId}:budgets`, []);
    await kv.set(`user:${demoUserId}:goals`, []);
    await kv.set(`user:${demoUserId}:people`, []);
    await kv.set(`user:${demoUserId}:categories`, [
      { id: 'famille', name: 'Famille', color: '#3B82F6', icon: 'users' },
      { id: 'investissements', name: 'Investissements', color: '#10B981', icon: 'trending-up' },
      { id: 'plaisir', name: 'Plaisir', color: '#F59E0B', icon: 'smile' },
      { id: 'dette', name: 'Dette', color: '#EF4444', icon: 'alert-circle' },
      { id: 'logement', name: 'Logement', color: '#8B5CF6', icon: 'home' },
      { id: 'transport', name: 'Transport', color: '#EC4899', icon: 'car' },
      { id: 'sante', name: 'Santé', color: '#14B8A6', icon: 'heart' },
      { id: 'alimentation', name: 'Alimentation', color: '#F97316', icon: 'shopping-cart' },
    ]);
    await kv.set(`user:${demoUserId}:rules`, []);
    await kv.set(`user:${demoUserId}:patrimoine`, []);
    await kv.set(`user:${demoUserId}:simulator`, []);
    await kv.set(`user:${demoUserId}:settings`, {
      theme: 'light',
      currency: '€',
      language: 'fr',
    });
  }

  return demoUser;
}

// Helper function to get user from access token
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return null;
  }

  // Check if it's the public anon key (demo mode)
  if (accessToken === Deno.env.get('SUPABASE_ANON_KEY')) {
    return await getOrCreateDemoUser();
  }

  // Otherwise, validate the JWT token
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
  };
}

// Health check
app.get('/make-server-beba2fa3/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * Sign up a new user
 * Body: { email, password, name }
 */
/*
app.post('/make-server-beba2fa3/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating user during signup:', error);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user data in KV store
    const userId = data.user.id;
    await kv.set(`user:${userId}:profile`, {
      id: userId,
      email,
      name: name || '',
      createdAt: new Date().toISOString(),
    });

    // Initialize empty data structures
    await kv.set(`user:${userId}:accounts`, []);
    await kv.set(`user:${userId}:transactions`, []);
    await kv.set(`user:${userId}:budgets`, []);
    await kv.set(`user:${userId}:goals`, []);
    await kv.set(`user:${userId}:people`, []);
    await kv.set(`user:${userId}:categories`, [
      { id: 'famille', name: 'Famille', color: '#3B82F6', icon: 'users' },
      { id: 'investissements', name: 'Investissements', color: '#10B981', icon: 'trending-up' },
      { id: 'plaisir', name: 'Plaisir', color: '#F59E0B', icon: 'smile' },
      { id: 'dette', name: 'Dette', color: '#EF4444', icon: 'alert-circle' },
      { id: 'logement', name: 'Logement', color: '#8B5CF6', icon: 'home' },
      { id: 'transport', name: 'Transport', color: '#EC4899', icon: 'car' },
      { id: 'sante', name: 'Santé', color: '#14B8A6', icon: 'heart' },
      { id: 'alimentation', name: 'Alimentation', color: '#F97316', icon: 'shopping-cart' },
    ]);
    await kv.set(`user:${userId}:rules`, []);
    await kv.set(`user:${userId}:settings`, {
      theme: 'light',
      currency: '€',
      language: 'fr',
    });

    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || '',
      }
    });
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get current user session
 * Requires: Authorization header with access token
 */
/*
app.get('/make-server-beba2fa3/auth/session', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get user profile from KV store
    const profile = await kv.get(`user:${user.id}:profile`);

    return c.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || '',
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// USER PROFILE ROUTES
// ============================================================================

/**
 * Get user profile
 * Requires: Authorization header
 */
/*
app.get('/make-server-beba2fa3/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}:profile`);
    const settings = await kv.get(`user:${user.id}:settings`);

    return c.json({ 
      profile: profile || {},
      settings: settings || {},
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Update user profile
 * Requires: Authorization header
 * Body: { name?, theme?, currency?, language? }
 */
/*
app.put('/make-server-beba2fa3/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();

    // Update profile if name is provided
    if (updates.name !== undefined) {
      const profile = await kv.get(`user:${user.id}:profile`) || {};
      await kv.set(`user:${user.id}:profile`, {
        ...profile,
        name: updates.name,
      });
    }

    // Update settings if other fields are provided
    const settingsUpdates: any = {};
    if (updates.theme) settingsUpdates.theme = updates.theme;
    if (updates.currency) settingsUpdates.currency = updates.currency;
    if (updates.language) settingsUpdates.language = updates.language;

    if (Object.keys(settingsUpdates).length > 0) {
      const settings = await kv.get(`user:${user.id}:settings`) || {};
      await kv.set(`user:${user.id}:settings`, {
        ...settings,
        ...settingsUpdates,
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// ACCOUNTS ROUTES
// ============================================================================

/**
 * Get all accounts for a user
 */
/*
app.get('/make-server-beba2fa3/accounts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accounts = await kv.get(`user:${user.id}:accounts`) || [];

    return c.json({ accounts });
  } catch (error) {
    console.error('Error getting accounts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Create or update accounts
 * Body: { accounts: [...] }
 */
/*
app.post('/make-server-beba2fa3/accounts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { accounts } = await c.req.json();

    await kv.set(`user:${user.id}:accounts`, accounts);

    return c.json({ success: true, accounts });
  } catch (error) {
    console.error('Error saving accounts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// TRANSACTIONS ROUTES
// ============================================================================

/**
 * Get all transactions for a user
 */
/*
app.get('/make-server-beba2fa3/transactions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const transactions = await kv.get(`user:${user.id}:transactions`) || [];

    return c.json({ transactions });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Create or update transactions
 * Body: { transactions: [...] }
 */
/*
app.post('/make-server-beba2fa3/transactions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { transactions } = await c.req.json();

    await kv.set(`user:${user.id}:transactions`, transactions);

    return c.json({ success: true, transactions });
  } catch (error) {
    console.error('Error saving transactions:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// RECURRING GROUPS ROUTES
// ============================================================================

/**
 * Get all recurring groups for a user
 */
/*
app.get('/make-server-beba2fa3/recurring-groups', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groups = await kv.get(`user:${user.id}:recurring-groups`) || [];

    return c.json({ groups });
  } catch (error) {
    console.error('Error getting recurring groups:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Create a new recurring group
 * Body: { groupId, transactionIds, sharedData }
 */
/*
app.post('/make-server-beba2fa3/recurring-groups', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId, transactionIds, sharedData } = await c.req.json();

    if (!groupId || !transactionIds || !Array.isArray(transactionIds)) {
      return c.json({ error: 'Invalid request data' }, 400);
    }

    // Get existing groups
    const groups = await kv.get(`user:${user.id}:recurring-groups`) || [];

    // Add new group
    const newGroup = {
      id: groupId,
      transactionIds,
      sharedData,
      createdAt: new Date().toISOString(),
    };

    groups.push(newGroup);

    // Save updated groups
    await kv.set(`user:${user.id}:recurring-groups`, groups);

    return c.json({ success: true, group: newGroup });
  } catch (error) {
    console.error('Error creating recurring group:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Update a recurring group
 * Body: { groupId, transactionIds, sharedData }
 */
/*
app.put('/make-server-beba2fa3/recurring-groups/:groupId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const { transactionIds, sharedData } = await c.req.json();

    // Get existing groups
    const groups = await kv.get(`user:${user.id}:recurring-groups`) || [];

    // Find and update the group
    const groupIndex = groups.findIndex((g: any) => g.id === groupId);

    if (groupIndex === -1) {
      return c.json({ error: 'Group not found' }, 404);
    }

    groups[groupIndex] = {
      ...groups[groupIndex],
      transactionIds: transactionIds || groups[groupIndex].transactionIds,
      sharedData: sharedData || groups[groupIndex].sharedData,
      updatedAt: new Date().toISOString(),
    };

    // Save updated groups
    await kv.set(`user:${user.id}:recurring-groups`, groups);

    return c.json({ success: true, group: groups[groupIndex] });
  } catch (error) {
    console.error('Error updating recurring group:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Delete a recurring group
 */
/*
app.delete('/make-server-beba2fa3/recurring-groups/:groupId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');

    // Get existing groups
    const groups = await kv.get(`user:${user.id}:recurring-groups`) || [];

    // Filter out the group to delete
    const filteredGroups = groups.filter((g: any) => g.id !== groupId);

    if (filteredGroups.length === groups.length) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Save updated groups
    await kv.set(`user:${user.id}:recurring-groups`, filteredGroups);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring group:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// CATEGORIES ROUTES
// ============================================================================

app.get('/make-server-beba2fa3/categories', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const categories = await kv.get(`user:${user.id}:categories`) || [];

    return c.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-beba2fa3/categories', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { categories } = await c.req.json();

    await kv.set(`user:${user.id}:categories`, categories);

    return c.json({ success: true, categories });
  } catch (error) {
    console.error('Error saving categories:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// BUDGETS ROUTES
// ============================================================================

app.get('/make-server-beba2fa3/budgets', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const budgets = await kv.get(`user:${user.id}:budgets`) || [];

    return c.json({ budgets });
  } catch (error) {
    console.error('Error getting budgets:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-beba2fa3/budgets', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { budgets } = await c.req.json();

    await kv.set(`user:${user.id}:budgets`, budgets);

    return c.json({ success: true, budgets });
  } catch (error) {
    console.error('Error saving budgets:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// GOALS ROUTES
// ============================================================================

app.get('/make-server-beba2fa3/goals', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const goals = await kv.get(`user:${user.id}:goals`) || [];

    return c.json({ goals });
  } catch (error) {
    console.error('Error getting goals:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-beba2fa3/goals', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { goals } = await c.req.json();

    await kv.set(`user:${user.id}:goals`, goals);

    return c.json({ success: true, goals });
  } catch (error) {
    console.error('Error saving goals:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// PEOPLE ROUTES
// ============================================================================

/**
 * Calculate financial impact for each person based on transactions
 */
/*
function calculatePeopleImpact(people: any[], transactions: any[]) {
  return people.map(person => {
    // Filter transactions for this person
    const personTransactions = transactions.filter(txn => txn.personId === person.id);
    
    // Calculate income (positive amounts)
    const income = personTransactions
      .filter(txn => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);
    
    // Calculate expenses (negative amounts)
    const expenses = personTransactions
      .filter(txn => txn.amount < 0)
      .reduce((sum, txn) => sum + txn.amount, 0);
    
    // Calculate total impact
    const totalImpact = income + expenses;
    
    return {
      ...person,
      income,
      expenses,
      totalImpact,
      transactionCount: personTransactions.length,
    };
  });
}

app.get('/make-server-beba2fa3/people', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const people = await kv.get(`user:${user.id}:people`) || [];

    return c.json({ people });
  } catch (error) {
    console.error('Error getting people:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get people with calculated financial impact from transactions
 */
/*
app.get('/make-server-beba2fa3/people/impact', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get both people and transactions
    const people = await kv.get(`user:${user.id}:people`) || [];
    const transactions = await kv.get(`user:${user.id}:transactions`) || [];

    // Calculate impact for each person
    const peopleWithImpact = calculatePeopleImpact(people, transactions);

    return c.json({ people: peopleWithImpact });
  } catch (error) {
    console.error('Error calculating people impact:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-beba2fa3/people', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { people } = await c.req.json();

    await kv.set(`user:${user.id}:people`, people);

    return c.json({ success: true, people });
  } catch (error) {
    console.error('Error saving people:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// URL EXTRACTION ROUTE
// ============================================================================

/**
 * Extract product/page information from a URL
 * Body: { url: string }
 */
/*
app.post('/make-server-beba2fa3/extract-url-info', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { url: rawUrl } = await c.req.json();

    if (!rawUrl) {
      return c.json({ error: 'URL is required' }, 400);
    }

    // Clean and validate URL
    let cleanUrl = rawUrl.trim();
    
    // Extract URL from text if needed (e.g., "Title https://example.com › path")
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      cleanUrl = urlMatch[0];
    }
    
    // Remove special characters like › and spaces at the end
    cleanUrl = cleanUrl.replace(/[›»]\s*.*$/, '').trim();
    
    // Validate URL format
    try {
      const urlObj = new URL(cleanUrl);
      cleanUrl = urlObj.href;
    } catch (e) {
      return c.json({ 
        error: 'Invalid URL format', 
        details: `Please enter a valid URL (e.g., https://example.com)`,
        received: rawUrl 
      }, 400);
    }

    // Fetch the URL content
    try {
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        return c.json({ error: 'Failed to fetch URL' }, 400);
      }

      const html = await response.text();

      // Extract meta information
      const extractedInfo: any = {
        url: cleanUrl,
        title: '',
        description: '',
        image: '',
        price: '',
        brand: '',
        siteName: '',
      };

      // Extract title
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch) {
        extractedInfo.title = titleMatch[1].trim();
      }

      // Extract Open Graph and meta tags
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
      if (ogTitleMatch) extractedInfo.title = ogTitleMatch[1];

      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
      if (ogDescMatch) extractedInfo.description = ogDescMatch[1];

      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
      if (ogImageMatch) extractedInfo.image = ogImageMatch[1];

      const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
      if (ogSiteNameMatch) extractedInfo.siteName = ogSiteNameMatch[1];

      // Extract price (common patterns)
      const pricePatterns = [
        /["']price["'][^>]*content=["']([0-9.,]+)["']/i,
        /["']og:price:amount["'][^>]*content=["']([0-9.,]+)["']/i,
        /<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>([0-9.,€$£¥\s]+)</i,
      ];

      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match) {
          extractedInfo.price = match[1].trim();
          break;
        }
      }

      // Try to extract brand from URL or content
      const urlObj = new URL(cleanUrl);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const brandFromUrl = hostname.split('.')[0];
      extractedInfo.brand = extractedInfo.siteName || brandFromUrl;

      // Try to get a logo (favicon or brand logo)
      const logoPatterns = [
        /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']*)["']/i,
        /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["']/i,
      ];

      for (const pattern of logoPatterns) {
        const match = html.match(pattern);
        if (match) {
          let logoUrl = match[1];
          // Make absolute URL if relative
          if (logoUrl.startsWith('/')) {
            logoUrl = `${urlObj.protocol}//${urlObj.hostname}${logoUrl}`;
          }
          extractedInfo.brandLogo = logoUrl;
          break;
        }
      }

      return c.json({ 
        success: true, 
        info: extractedInfo,
      });
    } catch (fetchError: any) {
      console.error('Error fetching URL:', fetchError);
      return c.json({ 
        error: 'Failed to extract information from URL',
        details: fetchError.message,
      }, 400);
    }
  } catch (error) {
    console.error('Error in URL extraction:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// PATRIMOINE ROUTES
// ============================================================================

app.get('/make-server-beba2fa3/patrimoine', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const assets = await kv.get(`user:${user.id}:patrimoine`) || [];

    return c.json({ assets });
  } catch (error) {
    console.error('Error getting patrimoine:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-beba2fa3/patrimoine', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { assets } = await c.req.json();

    await kv.set(`user:${user.id}:patrimoine`, assets);

    return c.json({ success: true, assets });
  } catch (error) {
    console.error('Error saving patrimoine:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// SIMULATOR ROUTES
// ============================================================================

app.get('/make-server-beba2fa3/simulator', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const scenarios = await kv.get(`user:${user.id}:simulator`) || [];

    return c.json({ scenarios });
  } catch (error) {
    console.error('Error getting simulator scenarios:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-beba2fa3/simulator', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { scenarios } = await c.req.json();

    await kv.set(`user:${user.id}:simulator`, scenarios);

    return c.json({ success: true, scenarios });
  } catch (error) {
    console.error('Error saving simulator scenarios:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// RULES ROUTES (for auto-categorization)
// ============================================================================

app.get('/make-server-beba2fa3/rules', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const rules = await kv.get(`user:${user.id}:rules`) || [];

    return c.json({ rules });
  } catch (error) {
    console.error('Error getting rules:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-beba2fa3/rules', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { rules } = await c.req.json();

    await kv.set(`user:${user.id}:rules`, rules);

    return c.json({ success: true, rules });
  } catch (error) {
    console.error('Error saving rules:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Start server
Deno.serve(app.fetch);*/