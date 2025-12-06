import { createClient } from '@supabase/supabase-js';

// ================================================================
// ENV CONFIG
// ================================================================

// use proper syntax (no unusual spacing like import.meta.env. VITE...)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Validate
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase configuration in .env');
}

if (!supabaseServiceKey) {
  console.warn('⚠️ SERVICE_ROLE key missing — Admin features disabled');
}

// ================================================================
// CREATE CLIENTS
// ================================================================

// Normal client (RLS enabled)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (RLS bypassed) — only if key exists
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// ================================================================
// HELPERS (SAFE RETURNS WITH OPTIONAL VALUES)
// ================================================================

// Example: fetch all users
export async function getAllUsers() {
  const { data, error } = await supabaseAdmin
    ?.from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false }) ?? { data: null, error: null };

  if (error) {
    console.error('Error fetching users:', error);
    return null;
  }
  return data ?? [];
}

// Example: update user role
export async function updateUserRole(id: string, role: string) {
  if (!supabaseAdmin) {
    throw new Error('SERVICE_ROLE key missing — cannot update user roles.');
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .update({ role })
    .eq('id', id);

  if (error) {
    console.error('Update role error:', error);
    return null;
  }
  return data?.[0] ?? null;
}


// ====================================================================
// AUTHENTICATION & ADMIN ACCESS (NO DATABASE QUERIES!)
// ====================================================================

/**
 * Get current authenticated user
 * ✅ Direct from auth.getUser() - NO RLS issues
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return user;
}

/**
 * Check if current user is admin
 * ✅ Checks JWT metadata - NO database queries - NO RLS issues
 */
export async function checkAdminAccess(): Promise<boolean> {
  // 1. Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("❌ Auth error or no user:", authError?.message);
    return false;
  }

  // 2. Read role from user_profiles (REAL source of truth)
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.log("❌ Error fetching user profile:", profileError.message);
    return false;
  }

  const isAdmin = profile?.role === "admin";

  console.log("🔎 Admin Check:", {
    email: user.email,
    dbRole: profile?.role,
    isAdmin,
  });

  return isAdmin;
}


/**
 * Get current admin (returns admin info or null)
 * ✅ Uses JWT metadata - NO RLS queries
 */
export async function getCurrentAdmin() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Verify admin status
    const isAdmin = await checkAdminAccess();

    if (!isAdmin) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'admin',
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('Error getting current admin:', error);
    return null;
  }
}

// ====================================================================
// ADMIN USERS MANAGEMENT (Uses service role to bypass RLS)
// ====================================================================

export async function getAdminUsers(page = 1, limit = 10) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from('admin_users')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { adminUsers: data || [], total: count || 0 };
}

export async function createAdminUser(userId: string, role: string = 'admin') {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .insert([
      {
        id: userId,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateAdminUser(userId: string, updates: any) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deactivateAdminUser(userId: string) {
  return updateAdminUser(userId, {
    is_active: false,
  });
}

export async function deleteAdminUser(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { error } = await supabaseAdmin
    .from('admin_users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}

// ====================================================================
// USER PROFILES MANAGEMENT (Uses service role to bypass RLS)
// ====================================================================

export async function getUserProfiles(
  page = 1,
  limit = 10,
  role?: string,
  search?: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact' });

  if (role && role !== 'all') {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { profiles: data || [], total: count || 0 };
}

export async function getUserProfile(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createUserProfile(profileData: any) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .insert([profileData])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateUserProfile(userId: string, updates: any) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function blockUser(userId: string) {
  return updateUserProfile(userId, { is_blocked: true });
}

export async function unblockUser(userId: string) {
  return updateUserProfile(userId, { is_blocked: false });
}

export async function deleteUser(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  // Delete from auth
  await supabaseAdmin.auth.admin.deleteUser(userId);

  // Delete from user_profiles
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}

// ====================================================================
// FACULTY REQUESTS MANAGEMENT
// ====================================================================

export async function getFacultyRequests(
  page = 1,
  limit = 10,
  status: string = 'all'
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('faculty_requests')
    .select('*', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return { requests: data || [], total: count || 0 };
}

export async function getFacultyRequest(requestId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('faculty_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) throw error;
  return data;
}

export async function approveFacultyRequest(
  requestId: string,
  adminId: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('faculty_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq('id', requestId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function rejectFacultyRequest(
  requestId: string,
  adminId: string,
  reason: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('faculty_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq('id', requestId)
    .select();

  if (error) throw error;
  return data?.[0];
}

// ====================================================================
// SUBJECT MANAGEMENT
// ====================================================================

export async function getSubjects(
  page = 1,
  limit = 10,
  status: string = 'active',
  search?: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('subjects')
    .select('*', { count: 'exact' });

  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'archived') {
    query = query.eq('is_active', false);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { subjects: data || [], total: count || 0 };
}

export async function createSubject(
  subjectData: any,
  createdBy: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('subjects')
    .insert([
      {
        ...subjectData,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateSubject(subjectId: string, updates: any) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('subjects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subjectId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function archiveSubject(subjectId: string) {
  return updateSubject(subjectId, { is_active: false });
}

export async function activateSubject(subjectId: string) {
  return updateSubject(subjectId, { is_active: true });
}

export async function deleteSubject(subjectId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { error } = await supabaseAdmin
    .from('subjects')
    .delete()
    .eq('id', subjectId);

  if (error) throw error;
}

// ====================================================================
// SUBJECT ASSIGNMENTS (Faculty to Subject Mapping)
// ====================================================================

export async function getSubjectAssignments(subjectId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('subject_assignments')
    .select('*, faculty:faculty_id(id, email, full_name)')
    .eq('subject_id', subjectId);

  if (error) throw error;
  return data || [];
}

export async function getFacultyList() {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, full_name')
    .eq('role', 'faculty')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

export async function assignFacultyToSubject(
  subjectId: string,
  facultyIds: string[],
  assignedBy: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const assignments = facultyIds.map((faculty_id) => ({
    subject_id: subjectId,
    faculty_id,
    assigned_by: assignedBy,
    assigned_at: new Date().toISOString(),
    role: 'instructor',
  }));

  const { data, error } = await supabaseAdmin
    .from('subject_assignments')
    .insert(assignments)
    .select();

  if (error) throw error;
  return data;
}

export async function removeFacultyFromSubject(
  subjectId: string,
  facultyId: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { error } = await supabaseAdmin
    .from('subject_assignments')
    .delete()
    .eq('subject_id', subjectId)
    .eq('faculty_id', facultyId);

  if (error) throw error;
}

// ====================================================================
// ACTIVITY LOGS (Audit Trail)
// ====================================================================

export async function getActivityLogs(
  page = 1,
  limit = 10,
  action?: string,
  resourceType?: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('activity_logs')
    .select('*', { count: 'exact' });

  if (action && action !== 'all') {
    query = query.eq('action', action);
  }

  if (resourceType && resourceType !== 'all') {
    query = query.eq('target_type', resourceType);
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { logs: data || [], total: count || 0 };
}

export async function logActivity(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  description: string,
  oldValues?: any,
  newValues?: any
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('activity_logs')
    .insert([
      {
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        description,
        old_values: oldValues,
        new_values: newValues,
        ip_address: null,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

// ====================================================================
// API KEYS MANAGEMENT
// ====================================================================

export async function getAPIKeys(createdBy?: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  let query = supabaseAdmin.from('api_keys').select('*');

  if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  const { data, error } = await query
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAPIKey(
  keyName: string,
  serviceType: string,
  createdBy: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const apiKey = generateAPIKey();

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert([
      {
        key_name: keyName,
        key_value: apiKey,
        service_type: serviceType,
        created_by: createdBy,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deleteAPIKey(keyId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { error } = await supabaseAdmin
    .from('api_keys')
    .delete()
    .eq('id', keyId);

  if (error) throw error;
}

export async function updateAPIKeyUsage(keyId: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('id', keyId);

  if (error) throw error;
}

// ====================================================================
// SYSTEM SETTINGS
// ====================================================================

export async function getSystemSettings(key?: string) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  let query = supabaseAdmin.from('system_settings').select('*');

  if (key) {
    query = query.eq('key', key);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateSystemSetting(
  key: string,
  value: any,
  description: string,
  updatedBy: string
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .upsert({
      key,
      value,
      description,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

// ====================================================================
// ANALYTICS
// ====================================================================

export async function getAnalyticsOverview() {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  // Total Students
  const { count: totalStudents } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Total Subjects
  const { count: totalSubjects } = await supabaseAdmin
    .from('subjects')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Average Score from submissions
  const { data: avgData } = await supabaseAdmin
    .from('submissions')
    .select('total_score');

  const averageScore =
    avgData && avgData.length > 0
      ? avgData.reduce((sum: number, s: any) => sum + (s.total_score || 0), 0) /
        avgData.length
      : 0;

  // Completion Rate (submitted vs total sessions)
  const { count: completedSubmissions } = await supabaseAdmin
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  const { count: totalSessions } = await supabaseAdmin
    .from('test_sessions')
    .select('*', { count: 'exact', head: true });

  const completionRate =
    totalSessions && totalSessions > 0
      ? (completedSubmissions! / totalSessions) * 100
      : 0;

  return {
    totalStudents: totalStudents || 0,
    totalCourses: totalSubjects || 0,
    averageScore: Math.round(averageScore * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
  };
}

export async function getStudentPerformanceData() {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select('student_id, total_score, test_sessions!submissions_test_session_id_fkey(id)')
    .order('student_id', { ascending: true });

  if (error) throw error;

  // Group by student
  const performance = data?.reduce((acc: any, submission: any) => {
    const existing = acc.find(
      (p: any) => p.student_id === submission.student_id
    );
    if (existing) {
      existing.scores.push(submission.total_score || 0);
    } else {
      acc.push({
        student_id: submission.student_id,
        scores: [submission.total_score || 0],
      });
    }
    return acc;
  }, []);

  return (
    performance?.map((p: any) => ({
      name: `Student ${p.student_id.slice(0, 8)}`,
      averageScore:
        Math.round(
          (p.scores.reduce((a: number, b: number) => a + b, 0) /
            p.scores.length) *
            100
        ) / 100,
      totalTests: p.scores.length,
      completedTests: p.scores.length,
    })) || []
  );
}

export async function getQuestionAnalyticsData() {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('id, question_text, difficulty, correct_answer, marks');

  if (error) throw error;

  // Get submission answers
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('answers');

  return (
    data?.map((question: any) => {
      let correctCount = 0;
      let totalAttempts = 0;

      submissions?.forEach((submission: any) => {
        if (submission.answers && submission.answers[question.id]) {
          totalAttempts++;
          if (submission.answers[question.id] === question.correct_answer) {
            correctCount++;
          }
        }
      });

      return {
        question: question.question_text.substring(0, 50),
        difficulty: question.difficulty,
        correctAnswers: correctCount,
        totalAttempts: totalAttempts || 1,
        successRate:
          totalAttempts > 0
            ? Math.round((correctCount / totalAttempts) * 100 * 100) / 100
            : 0,
      };
    }) || []
  );
}

export async function getActivityMetrics() {
  if (!supabaseAdmin) {
    throw new Error('Service role key not configured');
  }

  // Get last 7 days
  const days = 7;
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Logins (from test_sessions)
    const { count: logins } = await supabaseAdmin
      .from('test_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', `${dateStr}T00:00:00`)
      .lt('started_at', `${dateStr}T23:59:59`);

    // Submissions
    const { count: submissions } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', `${dateStr}T00:00:00`)
      .lt('submitted_at', `${dateStr}T23:59:59`);

    // New users
    const { count: newUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${dateStr}T23:59:59`);

    data.push({
      date: new Date(date).toLocaleDateString(),
      logins: logins || 0,
      submissions: submissions || 0,
      newUsers: newUsers || 0,
    });
  }

  return data;
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

function generateAPIKey(): string {
  const prefix = 'sk_';
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;

  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}