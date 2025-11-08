import { supabase } from '../config/supabase.js';

// Get teacher dashboard stats
export async function getTeacherDashboardStats(req, res) {
  try {
    const { instructorId } = req.params;

    // Get all assignments for this instructor (no batch filtering)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('assignment_id, status, due_date')
      .eq('instructor_id', instructorId);

    if (assignmentsError) throw assignmentsError;

    // Get active assignments
    const activeAssignments = assignments?.filter(a => a.status === 'active') || [];
    const activeAssignmentIds = activeAssignments.map(a => a.assignment_id);

    // Get all students (no batch filtering)
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('student_id', { count: 'exact' });

    if (studentsError) throw studentsError;

    // Get submissions for active assignments
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

    // Get all students with their user info
    const { data: allStudents, error: allStudentsError } = await supabase
      .from('students')
      .select(`
        student_id,
        roll_no,
        users:user_id (
          name,
          email
        )
      `);

    if (allStudentsError) throw allStudentsError;

    const studentsNeedHelp = [];
    const now = new Date();

    if (allStudents) {
      for (const student of allStudents) {
        // Get all assignments with due dates that have passed
        const pastDueAssignments = activeAssignments.filter(a => {
          const dueDate = new Date(a.due_date);
          return now > dueDate;
        });

        // Get student's submissions for active assignments
        const { data: studentSubs } = await supabase
          .from('submissions')
          .select('assignment_id, score, max_score, status')
          .eq('student_id', student.student_id)
          .in('assignment_id', activeAssignmentIds.length > 0 ? activeAssignmentIds : [0]);

        const studentSubmissionIds = new Set(studentSubs?.map(s => s.assignment_id) || []);

        // Check for failed submissions (status = 'error' or score = 0)
        const failedSubmissions = studentSubs?.filter(s => 
          s.status === 'error' || (s.max_score > 0 && s.score === 0)
        ) || [];

        // Check for assignments past deadline that student hasn't attempted
        const missedDeadlines = pastDueAssignments.filter(a => 
          !studentSubmissionIds.has(a.assignment_id)
        );

        // Check for low scores (< 50%)
        const hasLowScores = studentSubs?.some(s => {
          const percentage = s.max_score > 0 ? (s.score || 0) / s.max_score * 100 : 0;
          return percentage < 50 && s.status === 'graded';
        });

        // Determine issue
        let issue = null;
        let priority = 'medium';

        if (failedSubmissions.length > 0) {
          issue = `Failed ${failedSubmissions.length} submission(s)`;
          priority = 'high';
        } else if (missedDeadlines.length > 0) {
          issue = `Missed ${missedDeadlines.length} assignment deadline(s)`;
          priority = 'high';
        } else if (hasLowScores) {
          issue = 'Low scores on assignments';
          priority = 'medium';
        } else if (!studentSubs || studentSubs.length === 0) {
          issue = 'No submissions yet';
          priority = 'medium';
        }

        if (issue) {
          studentsNeedHelp.push({
            student_id: student.student_id,
            name: student.users?.name || 'Unknown',
            issue: issue,
            priority: priority
          });
        }
      }
    }

    res.json({
      activeAssignments: activeAssignments.length,
      studentsSubmitted: `${submittedCount}/${totalStudents || 0}`,
      averageScore: `${avgScore}%`,
      mightNeedHelp: studentsNeedHelp.length,
      studentsNeedHelp: studentsNeedHelp // Return the full list
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

    // Calculate stats using average scores per assignment
    const assignmentScores = {};
    submissions?.forEach(sub => {
      if (sub.status === 'graded' && sub.score !== null) {
        const assignmentId = sub.assignment_id;
        if (!assignmentScores[assignmentId]) {
          assignmentScores[assignmentId] = [];
        }
        assignmentScores[assignmentId].push(sub);
      }
    });

    // Calculate average per assignment, then overall average
    const assignmentAverages = [];
    Object.keys(assignmentScores).forEach(assignmentId => {
      const subs = assignmentScores[assignmentId];
      if (subs.length > 0) {
        const totalScore = subs.reduce((sum, s) => sum + (s.score || 0), 0);
        const maxScore = subs[0].max_score || 100;
        const avgScore = totalScore / subs.length;
        const avgPercentage = Math.round((avgScore / maxScore) * 100);
        assignmentAverages.push(avgPercentage);
      }
    });

    const completed = assignmentAverages.length;
    const avgScore = assignmentAverages.length > 0
      ? Math.round(assignmentAverages.reduce((sum, s) => sum + s, 0) / assignmentAverages.length)
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

    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('assignment_id, max_score')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError) throw assignmentError;

    // Get all submissions for this assignment
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('submission_id, score, max_score, status')
      .eq('assignment_id', assignmentId);

    if (submissionsError) throw submissionsError;

    // Calculate stats
    const totalSubmissions = submissions?.length || 0;
    const gradedSubmissions = submissions?.filter(s => s.status === 'graded') || [];
    const avgScore = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length)
      : 0;

    res.json({
      submissions: `${gradedSubmissions.length}/${totalSubmissions}`,
      averageScore: `${avgScore}%`
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get leaderboard
export async function getLeaderboard(req, res) {
  try {
    // Get all students (no batch filtering)
    const { data: students, error: studentsError } = await supabase
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
