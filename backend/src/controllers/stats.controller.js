import { supabase } from '../config/supabase.js';

// Get teacher dashboard stats
export async function getTeacherDashboardStats(req, res) {
  try {
    const { instructorId } = req.params;
    const { batchId } = req.query;

    // Build query for assignments
    let assignmentsQuery = supabase
      .from('assignments')
      .select('assignment_id, status, due_date')
      .eq('instructor_id', instructorId);

    if (batchId) {
      assignmentsQuery = assignmentsQuery.eq('batch_id', batchId);
    }

    const { data: assignments, error: assignmentsError } = await assignmentsQuery;

    if (assignmentsError) throw assignmentsError;

    // Get active assignments
    const activeAssignments = assignments?.filter(a => a.status === 'active') || [];
    const activeAssignmentIds = activeAssignments.map(a => a.assignment_id);

    // Get total students in batch(es)
    let studentsQuery = supabase
      .from('students')
      .select('student_id', { count: 'exact' });

    if (batchId) {
      studentsQuery = studentsQuery.eq('batch_id', batchId);
    }

    const { count: totalStudents, error: studentsError } = await studentsQuery;

    if (studentsError) throw studentsError;

    // Get submissions for active assignments (include student_id for proper filtering)
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('submission_id, assignment_id, student_id, score, max_score, status')
      .in('assignment_id', activeAssignmentIds.length > 0 ? activeAssignmentIds : [0]);

    if (submissionsError) throw submissionsError;

    // Calculate stats
    const submittedCount = submissions?.length || 0;
    const avgScore = submissions && submissions.length > 0
      ? Math.round((submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length))
      : 0;

    // Get students who might need help (low scores or no submissions)
    let studentsListQuery = supabase
      .from('students')
      .select(`
        student_id,
        roll_no,
        users:user_id (
          name,
          email
        )
      `);

    if (batchId) {
      studentsListQuery = studentsListQuery.eq('batch_id', batchId);
    }

    const { data: allStudents, error: allStudentsError } = await studentsListQuery;

    if (allStudentsError) throw allStudentsError;

    const studentsNeedHelp = [];
    if (allStudents) {
      for (const student of allStudents) {
        // Get actual student submissions by fetching with student_id
        const { data: studentSubs } = await supabase
          .from('submissions')
          .select('score, max_score, status')
          .eq('student_id', student.student_id)
          .in('assignment_id', activeAssignmentIds.length > 0 ? activeAssignmentIds : []);

        const hasLowScores = studentSubs?.some(s => {
          const percentage = s.max_score > 0 ? (s.score || 0) / s.max_score * 100 : 0;
          return percentage < 50;
        });

        if (!studentSubs || studentSubs.length === 0 || hasLowScores) {
          studentsNeedHelp.push({
            student_id: student.student_id,
            name: student.users?.name || 'Unknown',
            issue: !studentSubs || studentSubs.length === 0 ? 'No submission yet' : 'Low scores'
          });
        }
      }
    }

    res.json({
      activeAssignments: activeAssignments.length,
      studentsSubmitted: `${submittedCount}/${totalStudents || 0}`,
      averageScore: `${avgScore}%`,
      mightNeedHelp: studentsNeedHelp.length
    });
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get student dashboard stats
export async function getStudentDashboardStats(req, res) {
  try {
    const { studentId } = req.params;

    // Get student's submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        submission_id,
        assignment_id,
        score,
        max_score,
        status,
        assignments:assignment_id (
          assignment_id,
          title,
          due_date,
          status
        )
      `)
      .eq('student_id', studentId);

    if (submissionsError) throw submissionsError;

    // Calculate stats
    const completed = submissions?.filter(s => s.status === 'graded' && s.score > 0).length || 0;
    const avgScore = submissions && submissions.length > 0
      ? Math.round((submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length))
      : 0;

    // Get student's batch_id first
    const { data: studentData, error: studentDataError } = await supabase
      .from('students')
      .select('batch_id')
      .eq('student_id', studentId)
      .single();

    if (studentDataError) throw studentDataError;

    // Get pending assignments for student's batch only
    let assignmentsQuery = supabase
      .from('assignments')
      .select('assignment_id, title, due_date, status, batch_id')
      .eq('status', 'active');

    if (studentData?.batch_id) {
      assignmentsQuery = assignmentsQuery.eq('batch_id', studentData.batch_id);
    }

    const { data: allAssignments, error: assignmentsError } = await assignmentsQuery;

    if (assignmentsError) throw assignmentsError;

    const submittedAssignmentIds = new Set(submissions?.map(s => s.assignment_id) || []);
    const pending = allAssignments?.filter(a => !submittedAssignmentIds.has(a.assignment_id)).length || 0;

    // Get current rank (simplified - would need more complex query)
    const { data: allStudentSubmissions, error: rankError } = await supabase
      .from('submissions')
      .select('student_id, score')
      .eq('status', 'graded');

    if (rankError) throw rankError;

    // Calculate average scores per student
    const studentScores = {};
    allStudentSubmissions?.forEach(s => {
      if (!studentScores[s.student_id]) {
        studentScores[s.student_id] = { total: 0, count: 0 };
      }
      studentScores[s.student_id].total += s.score || 0;
      studentScores[s.student_id].count += 1;
    });

    const studentAverages = Object.entries(studentScores).map(([id, data]) => ({
      student_id: parseInt(id),
      avgScore: data.total / data.count
    })).sort((a, b) => b.avgScore - a.avgScore);

    const currentRank = studentAverages.findIndex(s => s.student_id === parseInt(studentId)) + 1;

    res.json({
      assignmentsCompleted: completed,
      averageScore: `${avgScore}%`,
      pendingAssignments: pending,
      currentRank: currentRank || null
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get assignment stats
export async function getAssignmentStats(req, res) {
  try {
    const { assignmentId } = req.params;

    // Get assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('assignment_id, batch_id, max_score')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError) throw assignmentError;

    // Get total students in batch
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('student_id', { count: 'exact' })
      .eq('batch_id', assignment.batch_id);

    if (studentsError) throw studentsError;

    // Get submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('submission_id, score, max_score, status')
      .eq('assignment_id', assignmentId);

    if (submissionsError) throw submissionsError;

    const submittedCount = submissions?.length || 0;
    const avgScore = submissions && submissions.length > 0
      ? Math.round((submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length))
      : 0;

    res.json({
      totalStudents: totalStudents || 0,
      submittedCount,
      averageScore: `${avgScore}%`,
      submissions: `${submittedCount}/${totalStudents || 0}`
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get leaderboard
export async function getLeaderboard(req, res) {
  try {
    const batchId = req.params.batchId || req.query.batchId;

    // Get all students in batch
    let studentsQuery = supabase
      .from('students')
      .select(`
        student_id,
        roll_no,
        users:user_id (
          user_id,
          name,
          email
        )
      `);

    if (batchId) {
      studentsQuery = studentsQuery.eq('batch_id', batchId);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) throw studentsError;

    // Get all submissions for students
    const studentIds = students?.map(s => s.student_id) || [];
    
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('student_id, score, max_score, status')
      .in('student_id', studentIds.length > 0 ? studentIds : [0])
      .eq('status', 'graded');

    if (submissionsError) throw submissionsError;

    // Calculate average scores per student
    const studentScores = {};
    students?.forEach(s => {
      studentScores[s.student_id] = {
        student_id: s.student_id,
        name: s.users?.name || 'Unknown',
        roll_no: s.roll_no,
        totalScore: 0,
        totalMax: 0,
        submissionCount: 0
      };
    });

    submissions?.forEach(s => {
      if (studentScores[s.student_id]) {
        studentScores[s.student_id].totalScore += s.score || 0;
        studentScores[s.student_id].totalMax += s.max_score || 100;
        studentScores[s.student_id].submissionCount += 1;
      }
    });

    const leaderboard = Object.values(studentScores)
      .map(student => ({
        student_id: student.student_id,
        name: student.name,
        roll_no: student.roll_no,
        score: student.totalMax > 0 
          ? Math.round((student.totalScore / student.totalMax) * 100)
          : 0,
        submissions: student.submissionCount
      }))
      .sort((a, b) => b.score - a.score)
      .map((student, index) => ({
        rank: index + 1,
        ...student
      }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
}

